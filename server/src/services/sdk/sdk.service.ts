import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import { AeSdk, Node } from '@aeternity/aepp-sdk';
import {
  COMPILER_URL,
  FAUCET_PUBLIC_ADDRESS,
  FAUCET_ACCOUNT,
  IGNORE_NODE_VERSION,
  IS_USING_LOCAL_NODE,
  NETWORK_ID,
  NODE_URL,
} from './sdk.constants';

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
export const genesisFund = async (address: EncodedData<'ak'>) => {
  if (!IS_USING_LOCAL_NODE) throw new Error('genesis fund is only for local node usage');
  await sdk.addAccount(FAUCET_ACCOUNT, { select: true });
  await sdk.awaitHeight(2);
  await sdk.spend(1e25, address);
  sdk.removeAccount(FAUCET_PUBLIC_ADDRESS);
};
