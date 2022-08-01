import {
  AeSdk,
  Node,
  generateKeyPair,
  MemoryAccount,
} from '@aeternity/aepp-sdk';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import contractSource from '@aeternity/rock-paper-scissors';

export const NODE_URL =
  import.meta.env.VITE_NODE_URL ?? 'http://localhost:3013';
export const COMPILER_URL =
  import.meta.env.VITE_COMPILER_URL ?? 'http://localhost:3080';
export const IS_USING_LOCAL_NODE = !import.meta.env.VITE_NODE_URL.includes(
  'testnet.aeternity.io'
);
const FAUCET_PUBLIC_ADDRESS = import.meta.env
  .VITE_FAUCET_PUBLIC_ADDRESS as EncodedData<'ak'>;

export let sdk: AeSdk;

export async function getNewSdk() {
  const account = new MemoryAccount({ keypair: generateKeyPair() });
  const node = new Node(NODE_URL);
  const newSdk = new AeSdk({
    nodes: [{ name: 'testnet', instance: node }],
    compilerUrl: COMPILER_URL,
  });
  await newSdk.addAccount(account, { select: true });
  return newSdk;
}

export async function initSdk() {
  sdk = await getNewSdk();
}

export async function returnCoinsToFaucet() {
  const userBalance = await sdk.getBalance(
    sdk.selectedAddress as EncodedData<'ak'>
  );
  if (BigInt(userBalance) <= 0) return;
  try {
    await sdk.transferFunds(1, FAUCET_PUBLIC_ADDRESS);
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

export async function verifyContractBytecode(
  bytecode: EncodedData<'cb'>,
  source = contractSource
) {
  let isEqual = false;
  try {
    await sdk.compilerApi.validateByteCode({
      bytecode,
      source,
      options: {},
    });
    isEqual = true;
  } catch (e) {
    isEqual = false;
  }
  return isEqual;
}
