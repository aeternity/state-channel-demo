import {
  buildTxHash,
  Channel,
  generateKeyPair,
  MemoryAccount,
  Tag,
} from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import BigNumber from 'bignumber.js';
import logger from '../../logger';
import {
  ContractService,
  CONTRACT_CONFIGURATION,
  GAME_STAKE,
  Methods,
} from '../contract';
import { getNextCallData } from '../contract/contract.service';
import {
  FAUCET_PUBLIC_ADDRESS, sdk, Update, decodeCallData,
} from '../sdk';
import { fundAccount } from '../sdk/sdk.service';
import { MUTUAL_CHANNEL_CONFIGURATION } from './bot.constants';
import { GameSession, SignatureType, TransactionLog } from './bot.interface';

export const gameSessionPool = new Map<string, GameSession>();
let openStateChannelTxLog: TransactionLog;

/**
 * Adds game session to the pool after deploying the contract
 */
export async function addGameSession(
  channel: Channel,
  configuration: ChannelOptions,
) {
  const balances = await channel.balances([
    configuration.initiatorId,
    configuration.responderId,
  ]);

  const { instance, address } = await ContractService.deployContract(
    configuration.initiatorId,
    channel,
    {
      player0: configuration.responderId,
      player1: configuration.initiatorId,
      reactionTime: 60000,
    },
  );
  gameSessionPool.set(configuration.initiatorId, {
    channelWrapper: {
      instance: channel,
      state: await channel.state(),
      poi: await channel.poi({
        accounts: [configuration.initiatorId, configuration.responderId],
      }),
      balances: {
        initiatorAmount: new BigNumber(balances[configuration.initiatorId]),
        responderAmount: new BigNumber(balances[configuration.responderId]),
      },
    },
    participants: {
      responderId: configuration.responderId,
      initiatorId: configuration.initiatorId,
    },
    contractState: {
      instance,
      address,
    },
  });
  logger.info(
    `Added to game session pool with bot ID: ${configuration.initiatorId}. Total sessions: ${gameSessionPool.size}`,
  );
}

/**
 * Removes game session from the pool after the channel is closed
 */
export function removeGameSession(onAccount: Encoded.AccountAddress) {
  gameSessionPool.delete(onAccount);
  logger.info(
    `Removed from pool game session with bot ID: ${onAccount}. Total sessions: ${gameSessionPool.size}`,
  );
}

/**
 * In order to log the updates of the bot service on the client terminal,
 * we construct and send a transaction log through the channel
 * on each contract call.
 */
export async function sendCallUpdateLog(
  tx: Encoded.Transaction,
  callData: Encoded.ContractBytearray,
  gameSession: GameSession,
) {
  const data = await decodeCallData(
    callData,
    gameSession.contractState.instance.bytecode,
  );
  const txLog: TransactionLog = {
    id: buildTxHash(tx),
    description: `${data.function}()`,
    signed: SignatureType.confirmed,
    onChain: false,
    timestamp: Date.now(),
  };
  switch (data.function) {
    case Methods.provide_hash:
      txLog.description = 'User hashed his selection';
      break;
    case Methods.reveal: {
      const selection = data.arguments[1].value.toString();
      txLog.description = `User revealed his selection: ${selection}`;
      break;
    }
    case Methods.player1_move: {
      txLog.signed = SignatureType.proposed;
      const selection = data.arguments[0].value.toString();
      txLog.description = `Bot selected ${selection}`;
      break;
    }
    default:
      throw new Error(`Unhandled method: ${data.function}`);
  }
  await gameSession.channelWrapper.instance.sendMessage(
    {
      type: 'add_bot_transaction_log',
      data: txLog,
    },
    gameSession.participants.responderId,
  );
}

/**
 * Since we cannot send a message through the channel until the user also initializes the channel,
 * we store the log and send it when the user initializes the channel.
 */
function sendOpenStateChannelTxLog(
  channelInstance: Channel,
  recipient: Encoded.AccountAddress,
) {
  void channelInstance.sendMessage(
    {
      type: 'add_bot_transaction_log',
      data: openStateChannelTxLog,
    },
    recipient,
  );
}

/**
 * Returns funds to the faucet and removes the game session from the pool
 */
export async function handleChannelClose(onAccount: Encoded.AccountAddress) {
  removeGameSession(onAccount);
  try {
    await sdk.transferFunds(1, FAUCET_PUBLIC_ADDRESS, {
      onAccount,
    });
    logger.info(`${onAccount} has returned funds to faucet`);
  } catch (e) {
    logger.error({ e }, 'failed to return funds to faucet');
  }
  sdk.removeAccount(onAccount);
}

async function handleChannelDied(onAccount: Encoded.AccountAddress) {
  const gameSession = gameSessionPool.get(onAccount);

  let channelId;
  try {
    channelId = gameSession.channelWrapper.instance.id() as Encoded.Channel;
  } catch (e) {
    return handleChannelClose(onAccount);
  }

  const closeSoloTx = await sdk.buildTx(Tag.ChannelCloseSoloTx, {
    channelId,
    fromId: onAccount,
    // @ts-ignore
    poi: gameSession.channelWrapper.poi,
    payload: gameSession.channelWrapper.state.signedTx,
  });

  let signedTx = await sdk.signTransaction(closeSoloTx, {
    onAccount,
  });

  await sdk.sendTransaction(signedTx, {
    onAccount,
    verify: true,
    waitMined: true,
  });

  const settleTx = await sdk.buildTx(Tag.ChannelSettleTx, {
    channelId: gameSession.channelWrapper.instance.id() as Encoded.Channel,
    fromId: onAccount,
    initiatorAmountFinal: gameSession.channelWrapper.balances.initiatorAmount,
    responderAmountFinal: gameSession.channelWrapper.balances.responderAmount,
  });

  signedTx = await sdk.signTransaction(settleTx, {
    onAccount,
  });
  try {
    await sdk.sendTransaction(signedTx, {
      onAccount,
      verify: true,
      waitMined: true,
    });
  } catch (e) {
    // Sometimes the nonce is used, yet the channel does shutdown.
    logger.info(
      `Channel with initiator ${onAccount} was shutdown with error:`,
      await (e as any).verifyTx(),
    );
  } finally {
    await handleChannelClose(onAccount);
  }
}

/**
 * Triggered when channel operation is `OffChainCallContract`.
 * Decodes the call data provided by the opponent and generates
 * the next calldata to be sent to the opponent.
 */
export async function handleOpponentCallUpdate(
  update: Update,
  gameSession: GameSession,
  tx: Encoded.Transaction,
) {
  const nextCallDataToSend = await getNextCallData(
    update,
    gameSession.contractState.instance,
  );
  gameSession.contractState.callDataToSend = nextCallDataToSend;
  await sendCallUpdateLog(tx, update.call_data, gameSession);
}

/**
 * Calls contract if game session has available data to send
 */
async function respondToContractCall(gameSession: GameSession) {
  if (gameSession.contractState.callDataToSend == null) return;
  await gameSession.channelWrapper.instance.callContract(
    {
      amount: GAME_STAKE,
      contract: gameSession.contractState.address,
      abiVersion: CONTRACT_CONFIGURATION.abiVersion,
      callData: gameSession.contractState.callDataToSend,
    },
    async (tx: Encoded.Transaction) => {
      void sendCallUpdateLog(
        tx,
        gameSession.contractState.callDataToSend,
        gameSession,
      );
      return sdk.signTransaction(tx, {
        onAccount: gameSession.participants.initiatorId,
      });
    },
  );
  gameSession.contractState.callDataToSend = null;
}

/**
 * Registers channel events.
 * If the channel is closed,
 *  funds are returned to the faucet and the game session is removed from the pool.
 * If the channel is opened,
 *  bot deploys contract to the channel and the game session is added to the pool.
 * If the channel is updated,
 *  bot decodes the call data provided by the opponent and responds.
 */
export async function registerEvents(
  channelInstance: Channel,
  configuration: ChannelOptions,
) {
  channelInstance.on('statusChanged', (status) => {
    if (status === 'closed') {
      void handleChannelClose(configuration.initiatorId);
    }

    if (status === 'died') {
      logger.info(`channel with initiator ${configuration.initiatorId} died.`);
      void handleChannelDied(configuration.initiatorId);
    }

    if (status === 'error') {
      logger.error(
        `channel with initiator ${configuration.initiatorId} threw error.`,
      );
      void removeGameSession(configuration.initiatorId);
    }

    if (status === 'open') {
      if (!gameSessionPool.has(configuration.initiatorId)) {
        void addGameSession(channelInstance, configuration);
      }
    }

    // this is where the USER has signed the open channel transaction
    // but this is the soonest we can send a message
    if (status === 'signed') {
      sendOpenStateChannelTxLog(channelInstance, configuration.responderId);
    }
  });

  channelInstance.on('stateChanged', () => {
    const gameSession = gameSessionPool.get(configuration.initiatorId);

    if (gameSession?.contractState?.address) {
      void channelInstance.state().then(async (state) => {
        gameSession.channelWrapper.state = state;
        const balances = await gameSession.channelWrapper.instance.balances([
          gameSession.participants.initiatorId,
          gameSession.participants.responderId,
        ]);
        gameSession.channelWrapper.balances = {
          initiatorAmount: new BigNumber(
            balances[gameSession.participants.initiatorId],
          ),
          responderAmount: new BigNumber(
            balances[gameSession.participants.responderId],
          ),
        };
      });
      void channelInstance
        .poi({
          accounts: [configuration.initiatorId, configuration.responderId],
          contracts: [gameSession.contractState.address],
        })
        .then((poi) => {
          gameSession.channelWrapper.poi = poi;
        });
    }
    if (gameSession?.contractState?.callDataToSend) {
      setImmediate(() => {
        void respondToContractCall(gameSession);
      });
    }
  });
}

/**
 * Handles client request to create a new game session.
 * @returns mutual channel configuration
 */
export async function generateGameSession(
  playerAddress: Encoded.AccountAddress,
  playerNodeHost: string,
  playerNodePort: number,
) {
  const botKeyPair = generateKeyPair();
  await sdk.addAccount(new MemoryAccount({ keypair: botKeyPair }));

  const initiatorId = botKeyPair.publicKey;
  const responderId = playerAddress;

  await fundAccount(initiatorId);
  await fundAccount(responderId);

  const channelConfig: ChannelOptions & {
    gameStake: BigNumber;
  } = {
    ...MUTUAL_CHANNEL_CONFIGURATION,
    gameStake: GAME_STAKE,
    initiatorId,
    port: playerNodePort,
    host: playerNodeHost,
    responderId,
    role: 'initiator',
    // @ts-ignore
    sign: (
      tag: string,
      tx: Encoded.Transaction,
      options: {
        updates: Update[];
      },
    ) => {
      if (tag === 'initiator_sign') {
        // we are signing the channel open transaction
        openStateChannelTxLog = {
          description: 'Open state channel',
          id: buildTxHash(tx),
          onChain: true,
          signed: SignatureType.proposed,
          timestamp: Date.now(),
        };
      }
      if (tag === 'shutdown_sign_ack') {
        // we are signing the channel close transaction
        const gameSession = gameSessionPool.get(initiatorId);
        void gameSession.channelWrapper.instance.sendMessage(
          {
            type: 'add_bot_transaction_log',
            data: {
              description: 'Close state channel',
              id: buildTxHash(tx),
              onChain: true,
              signed: SignatureType.confirmed,
              timestamp: Date.now(),
            },
          },
          responderId,
        );
      }
      if (options?.updates[0]?.op === 'OffChainCallContract') {
        const gameSession = gameSessionPool.get(initiatorId);
        void handleOpponentCallUpdate(options.updates[0], gameSession, tx);
      }
      return sdk.signTransaction(tx, {
        onAccount: initiatorId,
      });
    },
  };

  const channel = await Channel.initialize(channelConfig);

  await registerEvents(channel, channelConfig);

  const { role, sign, ...responderConfig } = channelConfig;
  return responderConfig;
}
