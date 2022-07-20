import {
  AeSdk,
  Channel,
  generateKeyPair,
  MemoryAccount,
} from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import BigNumber from 'bignumber.js';
import axios, { AxiosError } from 'axios';
import { setTimeout } from 'timers/promises';
import { deployContract, genesisFund } from '../sdk/sdk.service';
import { IS_USING_LOCAL_NODE, FAUCET_PUBLIC_ADDRESS, sdk } from '../sdk';
import logger from '../../logger';

export const channelPool = new Map<
string,
{
  instance: Channel;
  participants: {
    responderId: EncodedData<'ak'>;
    initiatorId: EncodedData<'ak'>;
  };
}
>();

export const mutualChannelConfiguration = {
  url: process.env.WS_URL ?? 'ws://localhost:3014/channel',
  pushAmount: 0,
  initiatorAmount: new BigNumber('4.5e18'),
  responderAmount: new BigNumber('4.5e18'),
  channelReserve: 2,
  lockPeriod: 10,
  debug: false,
  minimumDepthStrategy: 'plain',
  minimumDepth: 0,
  gameStake: new BigNumber('0.01e18'),
};

export function addChannel(channel: Channel, configuration: ChannelOptions) {
  channelPool.set(configuration.initiatorId, {
    instance: channel,
    participants: {
      responderId: configuration.responderId,
      initiatorId: configuration.initiatorId,
    },
  });
  logger.info(
    `Added to pool channel with bot ID: ${configuration.initiatorId}`,
  );
}

export function removeChannel(botId: EncodedData<'ak'>) {
  channelPool.delete(botId);
  logger.info(`Removed from pool channel with bot ID: ${botId}`);
}

export async function fundThroughFaucet(
  account: EncodedData<'ak'>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
  } = {
    maxRetries: 1,
    retryDelay: 1000,
  },
): Promise<void> {
  const FAUCET_URL = 'https://faucet.aepps.com';
  if (Number.isNaN(options.retryDelay)) options.retryDelay = 1000;
  try {
    await axios.post(`${FAUCET_URL}/account/${account}`, {});
    return logger.info(`Funded account ${account} through Faucet`);
  } catch (error) {
    if (error instanceof AxiosError && error.response.status === 425) {
      const errorMessage = `account ${account} is greylisted.`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    } else if (options.maxRetries > 0) {
      logger.warn(
        `Faucet is currently unavailable. Retrying at maximum ${options.maxRetries} more times`,
      );
      await setTimeout(options.retryDelay);
      return fundThroughFaucet(account, {
        maxRetries: options.maxRetries - 1,
        retryDelay: options.retryDelay + 1000,
      });
    }
    logger.error({ error }, 'failed to fund account through faucet');
    throw new Error(
      `failed to fund account through faucet. details: ${error.toString()}`,
    );
  }
}

export async function fundAccount(account: EncodedData<'ak'>) {
  if (!IS_USING_LOCAL_NODE) {
    try {
      await fundThroughFaucet(account, {
        maxRetries: 20,
      });
    } catch (error) {
      if (
        new BigNumber(await sdk.getBalance(account)).gt(
          mutualChannelConfiguration.responderAmount,
        )
      ) {
        logger.warn(
          `Got an error but Account ${account} already has sufficient balance.`,
        );
      } else throw error;
    }
  } else {
    await genesisFund(account);
  }
}

export async function handleChannelClose(sdk: AeSdk) {
  try {
    await sdk.transferFunds(1, FAUCET_PUBLIC_ADDRESS);
    logger.info(`${sdk.selectedAddress} has returned funds to faucet`);
  } catch (e) {
    logger.error({ e }, 'failed to return funds to faucet');
  }
  const { selectedAddress } = sdk;
  removeChannel(selectedAddress);
  sdk.removeAccount(selectedAddress);
}

export async function registerEvents(
  channel: Channel,
  configuration: ChannelOptions,
) {
  channel.on('statusChanged', (status) => {
    if (status === 'closed' || status === 'died') {
      sdk.selectAccount(configuration.initiatorId);
      void handleChannelClose(sdk);
    }

    if (status === 'open') {
      if (!channelPool.has(configuration.initiatorId)) {
        void deployContract(configuration.initiatorId, channel, {
          player0: configuration.initiatorId,
          player1: configuration.responderId,
          reactionTime: 3000,
        });
        addChannel(channel, configuration);
      }
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

  const channelConfig: ChannelOptions = {
    ...mutualChannelConfiguration,
    initiatorId,
    port: playerNodePort,
    host: playerNodeHost,
    responderId,
    role: 'initiator',
    sign: (_tag: string, tx: EncodedData<'tx'>) => {
      bot.selectAccount(botKeyPair.publicKey);
      return bot.signTransaction(tx);
    },
  };

  const channel = await Channel.initialize(channelConfig);

  await registerEvents(channel, channelConfig);

  const { role, sign, ...responderConfig } = channelConfig;
  return responderConfig;
}
