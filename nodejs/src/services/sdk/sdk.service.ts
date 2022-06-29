import {
  AccountBase, AeSdk, MemoryAccount, Node,
} from '@aeternity/aepp-sdk';
import { Keypair } from '@aeternity/aepp-sdk/es/account/Memory';
import {
  COMPILER_URL,
  GENESIS_ACCOUNT,
  IGNORE_NODE_VERSION,
  NETWORK_ID,
  NODE_URL,
} from './sdk.service.constants';

/**
 * @param params.accounts - array of accounts to be used by the sdk
 * @param params.networkId - network id
 * @param params.withoutGenesisAccount - false only on development
 * @returns sdk instance
 */
export const BaseAe = async (
  params: {
    accounts?: AccountBase[];
    withoutGenesisAccount?: boolean;
    networkId?: string;
  } = {},
): Promise<AeSdk> => {
  const sdk = new AeSdk({
    ...params,
    compilerUrl: COMPILER_URL,
    ignoreVersion: IGNORE_NODE_VERSION,
    nodes: [
      {
        name: 'test',
        instance: new Node(NODE_URL, { ignoreVersion: IGNORE_NODE_VERSION }),
      },
    ],
  });

  const accounts = params.accounts ?? [];
  if (!params.withoutGenesisAccount) {
    accounts.push(GENESIS_ACCOUNT);
  }

  await Promise.all(
    accounts.map(async (account, index) => {
      await sdk.addAccount(account, { select: index === 0 });
    }),
  );

  return sdk;
};

/**
 * ! DEVELOPMENT ONLY
 * a helper function to fund account
 */
const spendPromise = (account: Keypair) => (async () => {
  const ae = await BaseAe({
    networkId: NETWORK_ID,
    withoutGenesisAccount: false,
  });
  await ae.awaitHeight(2);
  await ae.spend(1e26, account.publicKey);
})();

/**
 * @param keyPair Keypair of the account which will be the default of the sdk
 * @returns sdk instance
 */
export async function getSdk(keyPair: Keypair): Promise<AeSdk> {
  if (!process?.env?.NODE_URL?.includes('testnet.aeternity.io')) {
    await spendPromise(keyPair);
  }

  return BaseAe({
    accounts: [new MemoryAccount({ keypair: keyPair })],
    networkId: NETWORK_ID,
    withoutGenesisAccount: true,
  });
}
