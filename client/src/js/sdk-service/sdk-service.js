import {
  AeSdk,
  Node,
  generateKeyPair,
  MemoryAccount,
} from '@aeternity/aepp-sdk';
import contractBytecode from '../contract-bytecode/contract-bytecode';

/**
 * @typedef {import("@aeternity/aepp-sdk").AeSdk} AeSdk
 */

/**
 * @type {AeSdk}
 */
export let sdk;
export let node;
export const keypair = generateKeyPair();

export const NODE_URL =
  import.meta.env.VITE_NODE_URL ?? 'http://localhost:3013';
export const COMPILER_URL =
  import.meta.env.VITE_COMPILER_URL ?? 'http://localhost:3080';
export const IS_USING_LOCAL_NODE = !import.meta.env.VITE_NODE_URL.includes(
  'testnet'
);
const FAUCET_PUBLIC_ADDRESS = import.meta.env.VITE_FAUCET_PUBLIC_ADDRESS;

export async function refreshSdkAccount() {
  if (sdk.selectedAddress) sdk.removeAccount(sdk.selectedAddress);
  const account = new MemoryAccount({ keypair: generateKeyPair() });
  await sdk.addAccount(account, { select: true });
}

export async function getNewSdk() {
  const account = new MemoryAccount({ keypair });
  node = new Node(NODE_URL);
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

/**
 * @param {string} payload
 * @returns {`th_${string}` | undefined}
 */
export async function returnCoinsToFaucet(payload) {
  if (!sdk) return;
  const userBalance = await sdk.getBalance(sdk.selectedAddress);
  if (BigInt(userBalance) <= 0) return;
  try {
    const result = await sdk.transferFunds(1, FAUCET_PUBLIC_ADDRESS, {
      payload,
    });
    return result.hash;
  } catch (e) {
    console.error({ e }, 'failed to return funds to faucet');
  }
}

export async function fundThroughFaucet(retries = 10) {
  const FAUCET_URL = 'https://faucet.aepps.com';
  try {
    const res = await fetch(`${FAUCET_URL}/account/${sdk.selectedAddress}`, {
      method: 'POST',
    });
    if (res.status != 200) throw new Error(`${res.statusText} - ${res.status}`);
  } catch (e) {
    if (retries > 0) {
      await refreshSdkAccount();
      return fundThroughFaucet(retries - 1);
    } else {
      console.error(e);
      throw new Error(`Faucet was unable to fund account`);
    }
  }
}

// ! LOCAL NODE USAGE ONLY
export const FAUCET_ACCOUNT = import.meta.env.VITE_FAUCET_SECRET_KEY
  ? new MemoryAccount({
      keypair: {
        publicKey: FAUCET_PUBLIC_ADDRESS,
        secretKey: import.meta.env.VITE_FAUCET_SECRET_KEY,
      },
    })
  : null;

/**
 * @param {`cb_${string}`} bytecode
 */
export function verifyContractBytecode(bytecode) {
  return bytecode === contractBytecode;
}
