import { Channel } from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import BigNumber from 'bignumber.js';
import axios from 'axios';
import { BaseAe, getSdk, networkId } from '../sdk/sdk.service.development';

const channelPool = new WeakSet<Channel>();

export const baseChannelConfig = {
  url: process.env.WS_URL ?? 'ws://localhost:3014/channel',
  pushAmount: 3,
  initiatorAmount: new BigNumber('1e2'),
  responderAmount: new BigNumber('1e2'),
  channelReserve: 0,
  ttl: 10000,
  lockPeriod: 1,
  debug: false,
};

function removeChannel(channel: Channel) {
  channelPool.delete(channel);
}
function addChannel(channel: Channel) {
  channelPool.add(channel);
}

async function fundThroughFaucet(account: EncodedData<'ak'>) {
  const FAUCET_URL = 'https://faucet.aepps.com/';
  try {
    await axios.post(`${FAUCET_URL}/account/${account}`, {});
  } catch (e) {
    console.log(e);
    throw e;
  }
}

async function fundAccount(account: EncodedData<'ak'>) {
  if (process?.env?.NODE_URL?.includes('testnet.aeternity.io')) {
    await fundThroughFaucet(account);
  } else {
    console.log('using local node');
    // when using a local node, fund account using genesis account
    const genesis = await BaseAe({ networkId });
    await genesis.spend(1e18, account, { confirm: true });
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
  const bot = await getSdk();

  const initiatorId = await bot.address();
  const responderId = playerAddress;

  await fundAccount(initiatorId);
  await fundAccount(responderId);

  const channelConfig: ChannelOptions = {
    ...baseChannelConfig,
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
