import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import BigNumber from 'bignumber.js';
import { MemoryAccount, generateKeyPair, Channel } from '@aeternity/aepp-sdk';
import { getSdk, BaseAe, networkId } from '../sdk/sdk.service.development';
import { waitForChannel } from '../sdk/sdk.service';

const channelPool = new WeakSet<Channel>();

const channelConfig = {
  url: process.env.WS_URL ?? 'ws://localhost:3014/channel',
  pushAmount: 3,
  initiatorAmount: new BigNumber('1e2'),
  responderAmount: new BigNumber('1e2'),
  channelReserve: 0,
  ttl: 10000,
  host: 'localhost',
  port: 3001,
  lockPeriod: 1,
  debug: false,
  role: 'initiator',
};

function removeChannel(channel: Channel) {
  channelPool.delete(channel);
}
function addChannel(channel: Channel) {
  channelPool.add(channel);
}

async function fundAccount(account: EncodedData<'ak'>) {
  const sdk = await getSdk();
  return sdk.spend(1e18, account);
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

export async function generateGameSession(playerKey: EncodedData<'ak'>) {
  const bot = await BaseAe({
    accounts: [new MemoryAccount({ keypair: generateKeyPair() })],
    networkId,
  });

  const initiatorId = await bot.address();
  const responderId = playerKey;

  await fundAccount(initiatorId);
  await fundAccount(responderId);

  const channel = await Channel.initialize({
    ...channelConfig,
    initiatorId,
    responderId,
    role: 'initiator',
    sign: (_tag, tx) => bot.signTransaction(tx),
  });

  registerEvents(channel);

  await Promise.all([waitForChannel(channel)]);
  return channel;
}

export default {
  generateGameSession,
  removeChannel,
  addChannel,
  channelPool,
  registerEvents,
  fundAccount,
};
