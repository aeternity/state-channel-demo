import {
  AeSdk,
  Node,
  MemoryAccount,
  generateKeyPair,
  Channel,
  CompilerHttp,
} from '@aeternity/aepp-sdk';
import { AciContractCallEncoder } from '@aeternity/aepp-calldata';
import { setTimeout as awaitSetTimeout } from 'timers/promises';
import Crypto from 'crypto';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import { CONTRACT_NAME, Moves } from '../src/services/contract';
import contractAci from '../src/services/contract/contract-aci.json';
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
    onCompiler: new CompilerHttp(COMPILER_URL),
    nodes: [
      {
        name: 'test',
        instance: new Node(NODE_URL, { ignoreVersion: IGNORE_NODE_VERSION }),
      },
    ],
  });

  sdk.addAccount(new MemoryAccount(generateKeyPair().secretKey), {
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

export async function decodeCallData(
  calldata: Encoded.ContractBytearray,
  fnName: string,
) {
  const decoder = new AciContractCallEncoder(contractAci);
  const decodedData = decoder.decodeCall(CONTRACT_NAME, fnName, calldata);

  return decodedData;
}
