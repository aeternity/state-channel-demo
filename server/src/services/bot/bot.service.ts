/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import {
  buildTxHash,
  Channel,
  generateKeyPair,
  MemoryAccount,
  Tag,
  unpackTx,
} from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import BigNumber from 'bignumber.js';
import { Keypair } from '@aeternity/aepp-sdk/es/account/Memory';
import { ContractEvents, Methods } from '../contract/contract.constants';
import logger from '../../logger';
import {
  ContractService,
  CONTRACT_CONFIGURATION,
  GAME_STAKE,
} from '../contract';
import {
  findMethodFromCallData,
  getNextCallDataFromDecodedEvents,
} from '../contract/contract.service';
import {
  ENVIRONMENT_CONFIG,
  FAUCET_PUBLIC_ADDRESS,
  IS_USING_LOCAL_NODE,
  sdk,
  Update,
} from '../sdk';
import { fundAccount, pollForAccount } from '../sdk/sdk.service';
import { MUTUAL_CHANNEL_CONFIGURATION } from './bot.constants';
import {
  GameSession,
  ServiceStatus,
  SignatureType,
  TransactionLog,
} from './bot.interface';

export const gameSessionPool = new Map<string, GameSession>();

const serviceStatus: ServiceStatus = {
  channelsOpenCurrently: 0,
  channelsInitialized: 0,
  channelsOpened: 0,
  runningSince: Date.now(),
  env: ENVIRONMENT_CONFIG,
};

/**
 * Throws error after given time
 */
function timeout(ms: number) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('timeout succeeded')), ms);
  });
}

/**
 * Returns the current status of the game session service
 */
export function getServiceStatus() {
  return {
    ...serviceStatus,
    channelsOpenCurrently: gameSessionPool.size,
  };
}

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
      round: 0,
      fsmId: channel.fsmId() as Encoded.Bytearray,
      channelId: channel.id() as Encoded.Channel,
      poi: await channel.poi({
        accounts: [configuration.initiatorId, configuration.responderId],
      }),
      configuration,
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
  serviceStatus.channelsOpened += 1;
  logger.info(
    `Added to game session pool with bot ID: ${configuration.initiatorId}. Total sessions: ${gameSessionPool.size}`,
  );
}

/**
 * Removes game session from the pool after the channel is closed
 */
export function removeGameSession(onAccount: Encoded.AccountAddress) {
  gameSessionPool.get(onAccount)?.channelWrapper.instance.disconnect();
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
  event: {
    name: string;
    value: string;
  },
  gameSession: GameSession,
) {
  const txLog: TransactionLog = {
    id: buildTxHash(tx),
    description: `${event.name}`,
    signed: SignatureType.confirmed,
    onChain: false,
    timestamp: Date.now(),
  };
  switch (event.name) {
    case ContractEvents.player0ProvidedHash:
      txLog.description = 'Bot co-signed a contract call with user’s hashed game move';
      break;
    case ContractEvents.player0Revealed: {
      const selection = event.value;
      txLog.description = `Bot co-signed user’s contract call with revealed game move: ${selection}`;
      break;
    }
    case ContractEvents.player1Moved: {
      txLog.signed = SignatureType.proposed;
      const selection = event.value;
      txLog.description = `Bot signed a contract call with game move: ${selection}`;
      break;
    }
    default:
      throw new Error(`Unhandled contract event: ${event.name}`);
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

/**
 * Reconnects channel on timeout.
 * SDK disconnects channel if node does not respond in 5 seconds
 * on ping-pong messages.
 */
async function handleChannelPingTimeout(onAccount: Encoded.AccountAddress) {
  const gameSession = gameSessionPool.get(onAccount);
  try {
    gameSession.channelWrapper.instance = await Channel.initialize({
      ...gameSession.channelWrapper.configuration,
      existingChannelId: gameSession.channelWrapper.channelId,
      existingFsmId: gameSession.channelWrapper.fsmId,
      role: 'initiator',
    });
    const state = await gameSession.channelWrapper.instance.state();
    await registerEvents(
      gameSession.channelWrapper.instance,
      gameSession.channelWrapper.configuration,
    );
    const isLastContractCallhandled = await handleLastCallUpdate(
      gameSession,
      state.signedTx as Encoded.Transaction,
    );
    if (!isLastContractCallhandled) {
      await handleDecodedEvents(gameSession);
    }
    logger.info(`channel with initiator ${onAccount} reconnected.`);
  } catch (e) {
    logger.error(e);
    logger.error(`channel with initiator ${onAccount} failed to reconnect.`);
    void handleChannelClose(onAccount);
  }
}

async function handleChannelDied(onAccount: Encoded.AccountAddress) {
  const gameSession = gameSessionPool.get(onAccount);

  let channelId;
  try {
    channelId = gameSession.channelWrapper.instance.id() as Encoded.Channel;
  } catch (e) {
    return handleChannelClose(onAccount);
  }
  try {
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
    await sdk.sendTransaction(signedTx, {
      onAccount,
    });
  } catch (e) {
    // Sometimes the nonce is used, yet the channel does shutdown.
    logger.info(
      `Channel with initiator ${onAccount} was shutdown with error:`,
      (await (e as any)?.verifyTx?.()) || e,
    );
  } finally {
    await handleChannelClose(onAccount);
  }
}

/**
 * Calls contract if game session has available data to send
 */
async function respondToContractCall(gameSession: GameSession) {
  const callData = gameSession.contractState.callDataToSend;
  if (gameSession.channelWrapper.round % 10 === 0) {
    await gameSession.channelWrapper.instance.cleanContractCalls();
  }
  if (callData == null) return;
  try {
    const result = await gameSession.channelWrapper.instance.callContract(
      {
        amount: GAME_STAKE,
        contract: gameSession.contractState.address,
        abiVersion: CONTRACT_CONFIGURATION.abiVersion,
        callData,
      },
      async (tx: Encoded.Transaction) => sdk.signTransaction(tx, {
        onAccount: gameSession.participants.initiatorId,
      }),
    );

    if (result.accepted && result.signedTx) {
      gameSession.contractState.callDataToSend = null;
      await sendCallUpdateLog(
        result.signedTx,
        {
          name: ContractEvents.player1Moved,
          value: gameSession.contractState.botMove,
        },
        gameSession,
      );
      gameSession.contractState.lastCaller = gameSession.participants.initiatorId;
    } else {
      logger.warn(
        `${gameSession.participants.initiatorId} - No signed transaction returned from contract call`,
        result,
      );
    }
  } catch (e) {
    logger.warn(
      `${
        gameSession.participants.initiatorId
      } - Failed to respond to contract - ${e.toString()}`,
    );
  }
}

/**
 * Triggered when channel operation is `OffChainCallContract`.
 * Decodes the call data if it was provided by the opponent
 * and generates the next calldata to be sent to the opponent.
 * @returns false if no action was needed.
 */
// @ts-ignore
export async function handleLastCallUpdate(
  gameSession: GameSession,
  tx: Encoded.Transaction,
  round?: number,
) {
  let result;
  try {
    const resultPromise = gameSession.channelWrapper.instance.getContractCall({
      caller: gameSession.participants.responderId,
      contract: gameSession.contractState.address,
      round: round ?? gameSession.channelWrapper.instance.round(),
    });
    result = (await Promise.race([resultPromise, timeout(1000)])) as Awaited<
      typeof resultPromise
    >;
  } catch (e) {
    // last caller was not the responder
    return false;
  }

  const decodedEvents = gameSession.contractState.instance.decodeEvents(
    // @ts-expect-error ts mismatch
    result.log,
  );
  await handleDecodedEvents(gameSession, decodedEvents);
  return true;
}

/**
 *  Handles decoded events by responding with next contract call.
 * it was observed that if bot was reconnected and the last contractCall
 * was a player move, decodedEvents is an empty array.
 * Therefore, we reconstruct the event from the last move.
 */
async function handleDecodedEvents(
  gameSession: GameSession,
  decodedEvents: Awaited<ReturnType<ContractInstance['decodeEvents']>> = [],
) {
  const tx = (await gameSession.channelWrapper.instance.state())
    .signedTx as Encoded.Transaction;

  if (decodedEvents.length === 0) {
    decodedEvents.push({
      name: ContractEvents.player0ProvidedHash,
      args: [GAME_STAKE],
      value: null,
    } as unknown as typeof decodedEvents[0]);
  }

  const nextCallData = await getNextCallDataFromDecodedEvents(
    decodedEvents,
    gameSession.contractState.instance,
  );
  gameSession.contractState.callDataToSend = nextCallData?.calldata;
  gameSession.contractState.botMove = nextCallData?.move;
  await sendCallUpdateLog(
    tx,
    {
      name: decodedEvents.at(-1).name,
      value: (decodedEvents.at(-1).args as unknown[])?.[0] as string,
    },
    gameSession,
  );
  await respondToContractCall(gameSession);
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
  channelInstance.on('error', (error: Error) => {
    if (error.name === 'ChannelPingTimedOutError') {
      logger.warn(
        `channel with initiator ${configuration.initiatorId} ping timed out: ${error.name}`,
      );
      void handleChannelPingTimeout(configuration.initiatorId);
    } else {
      logger.error(
        `channel with initiator ${configuration.initiatorId} threw error: ${error.name}. Closing channel.`,
      );
      void handleChannelDied(configuration.initiatorId);
    }
  });
  channelInstance.on('statusChanged', (status) => {
    if (status === 'closed') {
      void handleChannelClose(configuration.initiatorId);
    }

    if (status === 'died') {
      logger.info(`channel with initiator ${configuration.initiatorId} died.`);
      void handleChannelDied(configuration.initiatorId);
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

  channelInstance.on('stateChanged', (tx: Encoded.Transaction) => {
    const gameSession = gameSessionPool.get(configuration.initiatorId);
    if (gameSession?.channelWrapper) {
      gameSession.channelWrapper.round = gameSession.channelWrapper.instance.round();
    }
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

    try {
      const unpackedTx = unpackTx(tx);
      // @ts-expect-error ts mismatch
      const transaction = unpackedTx?.tx?.encodedTx;
      if (transaction?.txType === Tag.ChannelOffChainTx) {
        void handleLastCallUpdate(gameSession, tx);
      }
    } catch (e) {
      logger.warn(e);
    }
  });
}

/**
 * Genereates a keypair and funds it
 * @param retries number of retries
 * @return keypair
 */
async function generateFundedKeypair(retries = 20): Promise<Keypair> {
  const botKeyPair = generateKeyPair();
  try {
    await fundAccount(botKeyPair.publicKey);
    return botKeyPair;
  } catch (e) {
    if (retries > 0) {
      logger.warn(`${botKeyPair.publicKey} - Funding failed, retrying...`);
      // wait 0.5s before retrying
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 500));
      return generateFundedKeypair(retries - 1);
    }
    throw e;
  }
}

function validateOpponentCall(gameSession: GameSession, update: Update) {
  try {
    const method = findMethodFromCallData(
      update.call_data,
      gameSession.contractState.instance,
    );
    // Demo follows happy path, so we expect only the following methods.
    if (![Methods.provide_hash, Methods.reveal].includes(method)) {
      throw new Error(
        `Invalid method ${method} called by responder. Expected ${Methods.provide_hash} or ${Methods.reveal}`,
      );
    } else if (
      gameSession.contractState.callDataToSend
      && method !== Methods.reveal
    ) {
      throw new Error(
        `Only reveal can be called after bot's move, got ${method}`,
      );
    } else if (
      !gameSession.contractState.callDataToSend
      && method !== Methods.provide_hash
    ) {
      throw new Error(
        `Only move hashing can be called before bot's move, got ${method}`,
      );
    }
  } catch (e) {
    void gameSession.channelWrapper.instance.sendMessage(
      {
        type: 'Error',
        data: {
          description: (e as Error).message,
        },
      },
      gameSession.participants.responderId,
    );
    throw e;
  }
}

/**
 * Sign function which is called with each channel transaction.
 */
async function channelSign(
  initiatorId: Encoded.AccountAddress,
  tag: string,
  tx: Encoded.Transaction,
  options: {
    updates: Update[];
  },
) {
  if (tag === 'initiator_sign') {
    // we are signing the channel open transaction
    openStateChannelTxLog = {
      description:
        'Bot signed a transaction to initialise state channel connection',
      id: buildTxHash(tx),
      onChain: true,
      signed: SignatureType.proposed,
      timestamp: Date.now(),
    };
  }
  const gameSession = gameSessionPool.get(initiatorId);
  if (tag === 'shutdown_sign_ack') {
    // we are signing the channel close transaction
    void gameSession.channelWrapper.instance
      .sendMessage(
        {
          type: 'add_bot_transaction_log',
          data: {
            description:
              'Bot co-signed user’s transaction to close state channel connection',
            id: buildTxHash(tx),
            onChain: true,
            signed: SignatureType.confirmed,
            timestamp: Date.now(),
          },
        },
        gameSession.channelWrapper.configuration.responderId,
      )
      .catch(() => logger.warn(`${initiatorId} - failed to send tx log`));
  }
  if (options?.updates[0]?.op === 'OffChainCallContract') {
    gameSession.contractState.lastCaller = options?.updates[0]?.caller_id;
    validateOpponentCall(gameSession, options?.updates[0]);
  }
  return sdk.signTransaction(tx, {
    onAccount: initiatorId,
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
  const botKeyPair = await generateFundedKeypair();
  await sdk.addAccount(new MemoryAccount({ keypair: botKeyPair }));

  const initiatorId = botKeyPair.publicKey;
  const responderId = playerAddress;

  /**
   * in order to not use genesis funding on the client app (duplication)
   * we fund the responder account here since its for dev purposes only
   */
  if (IS_USING_LOCAL_NODE) await fundAccount(responderId);

  serviceStatus.channelsInitialized += 1;

  await pollForAccount(initiatorId);
  await pollForAccount(responderId);

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
    sign: (...args) => channelSign(initiatorId, ...args),
  };

  const channel = await Channel.initialize(channelConfig);

  await registerEvents(channel, channelConfig);

  const { role, sign, ...responderConfig } = channelConfig;
  return responderConfig;
}
