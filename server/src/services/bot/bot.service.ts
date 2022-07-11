import { AeSdk, Channel, generateKeyPair } from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import BigNumber from 'bignumber.js';
import axios, { AxiosError } from 'axios';
import {
  BaseAe,
  getSdk,
  IS_USING_LOCAL_NODE,
  NETWORK_ID,
  FAUCET_PUBLIC_ADDRESS,
} from '../sdk';
import logger from '../../logger';

export const channelPool = new WeakSet<Channel>();

export const mutualChannelConfiguration = {
  url: process.env.WS_URL ?? 'ws://localhost:3014/channel',
  pushAmount: 1,
  initiatorAmount: new BigNumber('3e18'),
  responderAmount: new BigNumber('3e18'),
  channelReserve: 2,
  lockPeriod: 10,
  debug: false,
  minimumDepthStrategy: 'plain',
  minimumDepth: 0,
};

export function addChannel(channel: Channel) {
  channelPool.add(channel);
  logger.info(`Added to pool channel with ID: ${channel.id()}`);
}

export function removeChannel(channel: Channel) {
  const channelId = channel.id();
  channelPool.delete(channel);
  logger.info(`Removed from pool channel with ID: ${channelId}`);
}

export async function fundThroughFaucet(
  account: EncodedData<'ak'>,
  maxRetries = 10,
): Promise<void> {
  const FAUCET_URL = 'https://faucet.aepps.com';
  try {
    await axios.post(`${FAUCET_URL}/account/${account}`, {});
    return logger.info(`Funded account ${account} through Faucet`);
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response.status === 425) {
        logger.error(`account ${account} is greylisted.`);
      } else if (maxRetries > 0) {
        logger.warn(
          `Faucet is currently unavailable. Retrying at maximum ${maxRetries} more times`,
        );
        // wait .5s before retrying
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });
        return fundThroughFaucet(account, maxRetries - 1);
      }
    }
    logger.error({ error }, 'failed to fund account through faucet');
    throw error;
  }
}

export async function fundAccount(account: EncodedData<'ak'>) {
  if (!IS_USING_LOCAL_NODE) {
    await fundThroughFaucet(account);
  } else {
    // when using a local node, fund account using local faucet account
    const localFaucet = await BaseAe({ networkId: NETWORK_ID });
    const { nextNonce } = await localFaucet.api.getAccountNextNonce(
      await localFaucet.address(),
    );

    await localFaucet.spend(1e25, account, {
      nonce: nextNonce,
    });
  }
}

export async function handleChannelClose(channel: Channel, sdk: AeSdk) {
  try {
    await sdk.transferFunds(1, FAUCET_PUBLIC_ADDRESS);
    logger.info(`${sdk.selectedAddress} has returned funds to faucet`);
  } catch (e) {
    logger.error({ e }, 'failed to return funds to faucet');
  }
  removeChannel(channel);
}

export async function registerEvents(channel: Channel, sdk: AeSdk) {
  channel.on('statusChanged', (status) => {
    if (status === 'closed') {
      void handleChannelClose(channel, sdk);
    }

    if (status === 'open') {
      addChannel(channel);
    }
  });
}

export async function generateGameSession(
  playerAddress: EncodedData<'ak'>,
  playerNodeHost: string,
  playerNodePort: number,
) {
  const botKeyPair = generateKeyPair();
  const bot = await getSdk(botKeyPair);

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
    sign: (_tag: string, tx: EncodedData<'tx'>) => bot.signTransaction(tx),
  };

  const channel = await Channel.initialize(channelConfig);

  await registerEvents(channel, bot);

  const { role, sign, ...responderConfig } = channelConfig;
  return responderConfig;
}
