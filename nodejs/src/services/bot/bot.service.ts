import { Channel, generateKeyPair } from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import BigNumber from 'bignumber.js';
import axios from 'axios';
import {
  BaseAe, getSdk, IS_USING_LOCAL_NODE, NETWORK_ID,
} from '../sdk';
import logger from '../../logger';

const channelPool = new WeakSet<Channel>();

export const mutualChannelConfiguration = {
  url: process.env.WS_URL ?? 'ws://localhost:3014/channel',
  pushAmount: 3,
  initiatorAmount: new BigNumber('1e2'),
  responderAmount: new BigNumber('1e2'),
  channelReserve: 0,
  ttl: 10000,
  lockPeriod: 1,
  debug: false,
};

function addChannel(channel: Channel) {
  channelPool.add(channel);
  logger.info(`Added to pool channel with ID: ${channel.id()}`);
}

function removeChannel(channel: Channel) {
  const channelId = channel.id();
  channelPool.delete(channel);
  logger.info(`Removed from pool channel with ID: ${channelId}`);
}

async function fundThroughFaucet(account: EncodedData<'ak'>) {
  const FAUCET_URL = 'https://faucet.aepps.com/';
  try {
    await axios.post(`${FAUCET_URL}/account/${account}`, {});
    logger.info(`Funded account ${account} through Faucet`);
  } catch (error) {
    logger.error({ error }, 'failed to fund account through faucet');
    throw error;
  }
}

async function fundAccount(account: EncodedData<'ak'>) {
  if (!IS_USING_LOCAL_NODE) {
    await fundThroughFaucet(account);
  } else {
    // when using a local node, fund account using genesis account
    const genesis = await BaseAe({ networkId: NETWORK_ID });
    const { nextNonce } = await genesis.api.getAccountNextNonce(
      await genesis.address(),
    );
    await genesis.spend(1e18, account, {
      confirm: true,
      nonce: nextNonce,
    });
  }
}

function registerEvents(channel: Channel) {
  channel.on('statusChanged', (status) => {
    if (status === 'disconnected') {
      removeChannel(channel);
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

  registerEvents(channel);

  const { role, sign, ...responderConfig } = channelConfig;
  return responderConfig;
}

export default {
  generateGameSession,
  removeChannel,
  addChannel,
  channelPool,
  registerEvents,
  fundAccount,
};
