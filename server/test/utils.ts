import {
  AeSdk,
  Node,
  MemoryAccount,
  generateKeyPair,
  Channel,
} from '@aeternity/aepp-sdk';
import { setTimeout as awaitSetTimeout } from 'timers/promises';
import Crypto from 'crypto';
import { Moves } from '../src/services/contract';
import {
  NETWORK_ID,
  COMPILER_URL,
  IGNORE_NODE_VERSION,
  NODE_URL,
} from '../src/services/sdk';

export function timeout(ms: number) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const getSdk = async () => {
  const sdk = new AeSdk({
    networkId: NETWORK_ID,
    compilerUrl: COMPILER_URL,
    ignoreVersion: IGNORE_NODE_VERSION,
    nodes: [
      {
        name: 'test',
        instance: new Node(NODE_URL, { ignoreVersion: IGNORE_NODE_VERSION }),
      },
    ],
  });

  await sdk.addAccount(new MemoryAccount({ keypair: generateKeyPair() }), {
    select: true,
  });
  return sdk;
};

export async function waitForChannelReady(
  channel: Channel,
  statuses = ['open'],
): Promise<void> {
  return new Promise((resolve) => {
    channel.on('statusChanged', (newStatus: string) => {
      if (statuses.includes(newStatus)) {
        resolve();
      }
    });
  });
}

export async function pollForRound(desiredRound: number, channel: Channel) {
  let currentRound = channel.round();
  while (currentRound < desiredRound) {
    await awaitSetTimeout(1);
    currentRound = channel.round();
  }
}

export const createHash = async (move: Moves, key: string) => Crypto.createHash('sha256')
  .update(key + move)
  .digest('hex');
