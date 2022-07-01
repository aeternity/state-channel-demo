import {
  AeSdk,
  Node,
  generateKeyPair,
  MemoryAccount,
} from '@aeternity/aepp-sdk';

export const url = import.meta.env.VITE_NODE_URL ?? 'http://localhost:3013';
export const compilerUrl =
  import.meta.env.VITE_COMPILER_URL ?? 'http://localhost:3080';
export const networkId = import.meta.env.VITE_NETWORK_ID ?? 'ae_devnet';
export const ignoreVersion = import.meta.env.IGNORE_VERSION === 'true';

export async function getSdk() {
  const account = new MemoryAccount({ keypair: generateKeyPair() });
  const node = new Node(url);
  const aeSdk = new AeSdk({
    nodes: [{ name: 'testnet', instance: node }],
  });
  await aeSdk.addAccount(account, { select: true });
  return aeSdk;
}
