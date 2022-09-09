import {
  AeSdk,
  Node,
  generateKeyPair,
  MemoryAccount,
} from '@aeternity/aepp-sdk';
import { DecodedCalldata } from '@aeternity/aepp-sdk/es/apis/compiler';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import contractSource from '@aeternity/rock-paper-scissors';

export const NODE_URL =
  import.meta.env.VITE_NODE_URL ?? 'http://localhost:3013';
export const COMPILER_URL =
  import.meta.env.VITE_COMPILER_URL ?? 'http://localhost:3080';
export const IS_USING_LOCAL_NODE = !import.meta.env.VITE_NODE_URL.includes(
  'testnet'
);
const FAUCET_PUBLIC_ADDRESS = import.meta.env
  .VITE_FAUCET_PUBLIC_ADDRESS as Encoded.AccountAddress;

export let sdk: AeSdk;
export let node: Node;
export const keypair = generateKeyPair();

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

export async function returnCoinsToFaucet() {
  if (!sdk) return;
  const userBalance = await sdk.getBalance(
    sdk.selectedAddress as Encoded.AccountAddress
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
  bytecode: Encoded.ContractBytearray,
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

export function timeout(ms: number) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('timeout succeeded')), ms);
  });
}

/**
 * @category sdk-wrapper
 * Wrapper function to decode callData.
 */
export async function decodeCallData(
  calldata: Encoded.ContractBytearray,
  bytecode: string,
  hasRetried = false
): Promise<DecodedCalldata> {
  try {
    const decodedCalldata = await sdk.compilerApi.decodeCalldataBytecode({
      calldata,
      bytecode,
    });

    return decodedCalldata;
  } catch (e) {
    if (!hasRetried) {
      console.log('Compiler is unavailable, retrying to decode callData');
      await timeout(2000);
      return decodeCallData(calldata, bytecode, true);
    }
    throw e;
  }
}
