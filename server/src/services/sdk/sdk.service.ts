import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import { AeSdk, Node } from '@aeternity/aepp-sdk';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { setTimeout as freezeTimeout } from 'timers/promises';
import { DecodedCalldata } from '@aeternity/aepp-sdk/es/apis/compiler';
import {
  COMPILER_URL,
  FAUCET_ACCOUNT,
  IS_USING_LOCAL_NODE,
  NODE_URL,
} from './sdk.constants';
import logger from '../../logger';

export const sdk = new AeSdk({
  compilerUrl: COMPILER_URL,
  nodes: [
    {
      name: 'testnet',
      instance: new Node(NODE_URL),
    },
  ],
});

export function timeout(ms: number) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * ! LOCAL NODE USAGE ONLY
 * a flag to indicate whether genesis account is currently funding or not.
 * If the flag is true, a delay of 0.3s is added to the funding process
 * in order to resolve account notch
 */
let isGenesisFunding = false;
/**
 * ! LOCAL NODE USAGE ONLY
 * a helper function to fund account
 */
export const genesisFund = async (
  address: Encoded.AccountAddress,
): Promise<void> => {
  if (isGenesisFunding) {
    await freezeTimeout(300);
    return genesisFund(address);
  }
  isGenesisFunding = true;
  if (!IS_USING_LOCAL_NODE) throw new Error('genesis fund is only for local node usage');
  await sdk.awaitHeight(2, {
    onAccount: FAUCET_ACCOUNT,
  });
  await sdk.spend(10e18, address, {
    onAccount: FAUCET_ACCOUNT,
  });
  isGenesisFunding = false;
};

/**
 * Funds account with 5AE.
 * Sometimes, the faucet may throw an error, so we retry the operation.
 */
export async function fundThroughFaucet(
  account: Encoded.AccountAddress,
): Promise<void> {
  const FAUCET_URL = 'https://faucet.aepps.com';
  try {
    await axios.post(`${FAUCET_URL}/account/${account}`, {});
    return logger.info(`Funded account ${account} through Faucet`);
  } catch (error) {
    const errorMessage = `account ${account} is greylisted.`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Funds account based on which network is used.
 */
export async function fundAccount(account: Encoded.AccountAddress) {
  if (!IS_USING_LOCAL_NODE) {
    try {
      await fundThroughFaucet(account);
    } catch (error) {
      if (
        new BigNumber(await sdk.getBalance(account)).gt(new BigNumber('4.5e18'))
      ) {
        logger.warn(
          `Got an error but Account ${account} already has sufficient balance.`,
        );
      } else throw error;
    }
  } else {
    await genesisFund(account);
  }
}

/**
 * @category sdk-wrapper
 * Wrapper function to decode callData.
 */
export async function decodeCallData(
  calldata: Encoded.ContractBytearray,
  bytecode: string,
  hasRetried = false,
): Promise<DecodedCalldata> {
  try {
    const decodedCalldata = await sdk.compilerApi.decodeCalldataBytecode({
      calldata,
      bytecode,
    });

    return decodedCalldata;
  } catch (e) {
    logger.warn('Compiler is unavailable, retrying to decode calldata');
    if (!hasRetried) {
      await timeout(2000);
      return decodeCallData(calldata, bytecode, true);
    }
    logger.error('Compiler is unavailable and retrying failed.', e);
    throw e;
  }
}
