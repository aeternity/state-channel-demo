import { Channel, generateKeyPair, MemoryAccount } from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import BigNumber from 'bignumber.js';
import logger from '../../logger';
import {
  ContractService,
  CONTRACT_CONFIGURATION,
  GAME_STAKE,
} from '../contract';
import { getNextCallData } from '../contract/contract.service';
import { FAUCET_PUBLIC_ADDRESS, sdk, Update } from '../sdk';
import { fundAccount } from '../sdk/sdk.service';
import { MUTUAL_CHANNEL_CONFIGURATION } from './bot.constants';
import { GameSession } from './bot.interface';

export const gameSessionPool = new Map<string, GameSession>();

export async function addGameSession(
  channel: Channel,
  configuration: ChannelOptions,
  contractPromise?: Promise<{
    instance: ContractInstance;
    address: EncodedData<'ct'>;
  }>,
) {
  const { instance, address } = contractPromise != null && (await contractPromise);
  gameSessionPool.set(configuration.initiatorId, {
    channel,
    contractState: {
      instance,
      address,
    },
    participants: {
      responderId: configuration.responderId,
      initiatorId: configuration.initiatorId,
    },
  });
  logger.info(
    `Added to game session pool with bot ID: ${configuration.initiatorId}. Total sessions: ${gameSessionPool.size}`,
  );
}

export function removeGameSession(botId: EncodedData<'ak'>) {
  gameSessionPool.delete(botId);
  logger.info(
    `Removed from pool game session with bot ID: ${botId}. Total sessions: ${gameSessionPool.size}`,
  );
}

export async function handleChannelClose(onAccount: EncodedData<'ak'>) {
  try {
    await sdk.transferFunds(1, FAUCET_PUBLIC_ADDRESS, {
      onAccount,
    });
    logger.info(`${onAccount} has returned funds to faucet`);
  } catch (e) {
    logger.error({ e }, 'failed to return funds to faucet');
  }
  removeGameSession(onAccount);
  sdk.removeAccount(onAccount);
}

export async function handleOpponentCallUpdate(
  update: Update,
  gameSession: GameSession,
) {
  const nextCallDataToSend = await getNextCallData(
    update,
    gameSession.contractState.instance,
  );
  gameSession.contractState.callDataToSend = nextCallDataToSend;
}

async function respondToContractCall(gameSession: GameSession) {
  if (gameSession.contractState.callDataToSend == null) return;
  await gameSession.channel.callContract(
    {
      amount: GAME_STAKE,
      contract: gameSession.contractState.address,
      abiVersion: CONTRACT_CONFIGURATION.abiVersion,
      callData: gameSession.contractState.callDataToSend,
    },
    async (tx: EncodedData<'tx'>) => sdk.signTransaction(tx, {
      onAccount: gameSession.participants.initiatorId,
    }),
  );
  gameSession.contractState.callDataToSend = null;
}

export async function registerEvents(
  channelInstance: Channel,
  configuration: ChannelOptions,
) {
  channelInstance.on('statusChanged', (status) => {
    if (status === 'closed' || status === 'died') {
      void handleChannelClose(configuration.initiatorId);
    }

    if (status === 'open') {
      if (!gameSessionPool.has(configuration.initiatorId)) {
        const contractPromise = ContractService.deployContract(
          configuration.initiatorId,
          channelInstance,
          {
            player0: configuration.responderId,
            player1: configuration.initiatorId,
            reactionTime: 3000,
          },
        );
        void addGameSession(channelInstance, configuration, contractPromise);
      }
    }
  });

  channelInstance.on('stateChanged', () => {
    const gameSession = gameSessionPool.get(configuration.initiatorId);
    if (gameSession?.contractState?.callDataToSend) {
      setImmediate(() => {
        void respondToContractCall(gameSession);
      });
    }
  });
}

export async function generateGameSession(
  playerAddress: EncodedData<'ak'>,
  playerNodeHost: string,
  playerNodePort: number,
) {
  const botKeyPair = generateKeyPair();
  await sdk.addAccount(new MemoryAccount({ keypair: botKeyPair }), {
    select: true,
  });
  const bot = sdk;

  const initiatorId = await bot.address();
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
      _tag: string,
      tx: EncodedData<'tx'>,
      options: {
        updates: Update[];
      },
    ) => {
      if (options?.updates[0]?.op === 'OffChainCallContract') {
        const gameSession = gameSessionPool.get(initiatorId);
        void handleOpponentCallUpdate(options.updates[0], gameSession);
      }
      return bot.signTransaction(tx, {
        onAccount: initiatorId,
      });
    },
  };

  const channel = await Channel.initialize(channelConfig);

  await registerEvents(channel, channelConfig);

  const { role, sign, ...responderConfig } = channelConfig;
  return responderConfig;
}
