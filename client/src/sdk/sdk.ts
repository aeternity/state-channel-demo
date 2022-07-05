import {
  AeSdk,
  Node,
  generateKeyPair,
  MemoryAccount,
} from '@aeternity/aepp-sdk';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';

export const NODE_URL =
  import.meta.env.VITE_NODE_URL ?? 'http://localhost:3013';
export const COMPILER_URL =
  import.meta.env.VITE_COMPILER_URL ?? 'http://localhost:3080';
export const IS_USING_LOCAL_NODE = !import.meta.env.VITE_NODE_URL.includes(
  'testnet.aeternity.io'
);

export async function getSdk() {
  const account = new MemoryAccount({ keypair: generateKeyPair() });
  const node = new Node(NODE_URL);
  const aeSdk = new AeSdk({
    nodes: [{ name: 'testnet', instance: node }],
  });
  await aeSdk.addAccount(account, { select: true });
  return aeSdk;
}

export async function returnCoinsToFaucet(aeSdk: AeSdk) {
  const recipient: EncodedData<'ak'> = FAUCET_PUBLIC_KEY;
  try {
    await aeSdk.transferFunds(1, recipient);
  } catch (e) {
    console.error({ e }, 'failed to return funds to faucet');
  }
}

// ! LOCAL NODE USAGE ONLY
const FAUCET_SECRET_KEY =
  import.meta.env.VITE_FAUCET_SECRET_KEY ??
  'bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b';
const FAUCET_PUBLIC_KEY = import.meta.env
  .VITE_FAUCET_PUBLIC_ADDRESS as EncodedData<'ak'>;

export const FAUCET_ACCOUNT = IS_USING_LOCAL_NODE
  ? new MemoryAccount({
      keypair: {
        publicKey: FAUCET_PUBLIC_KEY,
        secretKey: FAUCET_SECRET_KEY,
      },
    })
  : null;
