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
const FAUCET_PUBLIC_ADDRESS = import.meta.env
  .VITE_FAUCET_PUBLIC_ADDRESS as EncodedData<'ak'>;

export async function getSdk() {
  const account = new MemoryAccount({ keypair: generateKeyPair() });
  const node = new Node(NODE_URL);
  const aeSdk = new AeSdk({
    nodes: [{ name: 'testnet', instance: node }],
    compilerUrl: COMPILER_URL,
  });
  await aeSdk.addAccount(account, { select: true });
  return aeSdk;
}

export async function returnCoinsToFaucet(aeSdk: AeSdk) {
  const userBalance = await aeSdk.getBalance(
    aeSdk.selectedAddress as EncodedData<'ak'>
  );
  if (BigInt(userBalance) <= 0) return;
  try {
    await aeSdk.transferFunds(1, FAUCET_PUBLIC_ADDRESS);
  } catch (e) {
    console.error({ e }, 'failed to return funds to faucet');
  }
}

// ! LOCAL NODE USAGE ONLY
export const FAUCET_ACCOUNT = IS_USING_LOCAL_NODE
  ? new MemoryAccount({
      keypair: {
        publicKey: FAUCET_PUBLIC_ADDRESS,
        secretKey: import.meta.env.VITE_FAUCET_SECRET_KEY,
      },
    })
  : null;
