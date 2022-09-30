import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import { AeSdk, Node } from '@aeternity/aepp-sdk';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { setTimeout as awaitSetTimeout } from 'timers/promises';
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
    await awaitSetTimeout(300);
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
 * Since we create accounts on the fly and we fund them
 * with faucet, our node may not be yet aware of their existence.
 * Therefore, check if the node is aware by calling its API.
 */
export async function pollForAccount(
  address: Encoded.AccountAddress,
  maxTries = 50,
): Promise<boolean> {
  try {
    return !!(await sdk.api.getAccountByPubkey(address));
  } catch (error) {
    if (maxTries > 0) {
      logger.warn(`Account ${address} not yet known by node, retrying...`);
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return pollForAccount(address, maxTries - 1);
    }
    logger.error(
      error,
      `Account ${address} is not yet known by the node and max retries have been used.`,
    );
    throw error;
  }
}
