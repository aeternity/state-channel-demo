import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import { AccountBase, AeSdk, Node } from '@aeternity/aepp-sdk';
import {
  COMPILER_URL,
  FAUCET_PUBLIC_ADDRESS,
  FAUCET_ACCOUNT,
  IGNORE_NODE_VERSION,
  IS_USING_LOCAL_NODE,
  NETWORK_ID,
  NODE_URL,
} from './sdk.service.constants';

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
 * @param params.accounts - array of accounts to be used by the sdk
 * @param params.networkId - network id
 * @param params.withoutFaucetAccount - false only on development
 * @returns sdk instance
 */
export const BaseAe = async (
  params: {
    accounts?: AccountBase[];
    withoutFaucetAccount?: boolean;
    networkId?: string;
  } = {},
): Promise<AeSdk> => {
  const accounts = params.accounts ?? [];
  if (!params.withoutFaucetAccount) {
    accounts.push(FAUCET_ACCOUNT);
  }

  await Promise.all(
    accounts.map(async (account, index) => {
      await sdk.addAccount(account, { select: index === 0 });
    }),
  );

  return sdk;
};

/**
 * ! LOCAL NODE USAGE ONLY
 * a helper function to fund account
 */
export const genesisFund = async (address: EncodedData<'ak'>) => {
  if (!IS_USING_LOCAL_NODE) throw new Error('genesis fund is only for local node usage');
  await sdk.addAccount(FAUCET_ACCOUNT, { select: true });
  await sdk.awaitHeight(2);
  await sdk.spend(1e25, address);
  sdk.removeAccount(FAUCET_PUBLIC_ADDRESS);
};
