import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import { AeSdk, Node } from '@aeternity/aepp-sdk';
import axios, { AxiosError } from 'axios';
import BigNumber from 'bignumber.js';
import {
  COMPILER_URL,
  FAUCET_PUBLIC_ADDRESS,
  FAUCET_ACCOUNT,
  IGNORE_NODE_VERSION,
  IS_USING_LOCAL_NODE,
  NETWORK_ID,
  NODE_URL,
} from './sdk.constants';
import logger from '../../logger';

export const sdk = new AeSdk({
  networkId: NETWORK_ID,
  compilerUrl: COMPILER_URL,
  ignoreVersion: IGNORE_NODE_VERSION,
  nodes: [
    {
      name: 'test',
      instance: new Node(NODE_URL, { ignoreVersion: IGNORE_NODE_VERSION }),
    },
  ],
});

/**
 * ! LOCAL NODE USAGE ONLY
 * a helper function to fund account
 */
export const genesisFund = async (address: Encoded.AccountAddress) => {
  if (!IS_USING_LOCAL_NODE) throw new Error('genesis fund is only for local node usage');
  await sdk.addAccount(FAUCET_ACCOUNT, { select: true });
  await sdk.awaitHeight(2);
  await sdk.spend(1e25, address);
  if (sdk.accounts[FAUCET_PUBLIC_ADDRESS]) sdk.removeAccount(FAUCET_PUBLIC_ADDRESS);
};

/**
 * Funds account with 5AE.
 * Sometimes, the faucet may throw an error, so we retry the operation.
 */
export async function fundThroughFaucet(
  account: Encoded.AccountAddress,
  options: {
    maxRetries?: number;
  } = {
    maxRetries: 200,
  },
): Promise<void> {
  const FAUCET_URL = 'https://faucet.aepps.com';
  try {
    await axios.post(`${FAUCET_URL}/account/${account}`, {});
    return logger.info(`Funded account ${account} through Faucet`);
  } catch (error) {
    if (error instanceof AxiosError && error.response.status === 425) {
      const errorMessage = `account ${account} is greylisted.`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    } else if (options.maxRetries > 0) {
      logger.warn(
        `Faucet is currently unavailable. Retrying at maximum ${options.maxRetries} more times`,
      );
      return fundThroughFaucet(account, {
        maxRetries: options.maxRetries - 1,
      });
    }
    logger.error({ error }, 'failed to fund account through faucet');
    throw new Error(
      `failed to fund account through faucet. details: ${error.toString()}`,
    );
  }
}

/**
 * Funds account based on which network is used.
 */
export async function fundAccount(account: Encoded.AccountAddress) {
  if (!IS_USING_LOCAL_NODE) {
    try {
      await fundThroughFaucet(account, {
        maxRetries: 20,
      });
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
) {
  return sdk.compilerApi.decodeCalldataBytecode({
    calldata,
    bytecode,
  });
}
