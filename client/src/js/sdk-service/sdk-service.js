import {
  AeSdk,
  Node,
  generateKeyPair,
  encode,
  MemoryAccount,
  CompilerHttp,
  Encoding,
} from '@aeternity/aepp-sdk';
import { Buffer } from 'buffer';
import { contractBytecode } from '../contract/contract';
import { addUserTransaction } from '../terminal/terminal';

/**
 * @typedef {import("@aeternity/aepp-sdk").AeSdk} AeSdk
 */

/**
 * @type {AeSdk}
 */
export let sdk;
export let node;
export let keypair;

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
  keypair = generateKeyPair();
  const account = new MemoryAccount(keypair.secretKey);
  sdk.addAccount(account, { select: true });

  const log = {
    id: account.address,
    description: 'User initialized a Memory Account',
    timestamp: Date.now(),
  };
  addUserTransaction(log, 0);
}

export async function getNewSdk() {
  node = new Node(NODE_URL);
  const newSdk = new AeSdk({
    onCompiler: new CompilerHttp(COMPILER_URL),
    nodes: [{ name: 'testnet', instance: node }],
  });
  return newSdk;
}

export async function initSdk() {
  sdk = await getNewSdk();
}

/**
 * @param {string} payload
 * @returns {Promise<`th_${string}`> | undefined}
 */
export async function returnCoinsToFaucet(payload) {
  if (!sdk) return;
  const userBalance = await sdk.getBalance(sdk.selectedAddress);
  if (BigInt(userBalance) <= 0) return;
  try {
    const encodedPayload = encode(Buffer.from(payload), Encoding.Bytearray);
    const result = await sdk.transferFunds(1, FAUCET_PUBLIC_ADDRESS, {
      payload: encodedPayload,
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
    const log = {
      onChain: true,
      description: 'User topped up coins from faucet',
      timestamp: Date.now(),
    };
    addUserTransaction(log, 0);
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
  ? new MemoryAccount(import.meta.env.VITE_FAUCET_SECRET_KEY)
  : null;

/**
 * @param {`cb_${string}`} bytecode
 */
export function verifyContractBytecode(bytecode) {
  return bytecode === contractBytecode;
}
