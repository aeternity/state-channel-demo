import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import { AeSdk, Channel, Node } from '@aeternity/aepp-sdk';
import contractSource from '@aeternity/rock-paper-scissors';
import {
  COMPILER_URL,
  FAUCET_PUBLIC_ADDRESS,
  FAUCET_ACCOUNT,
  IGNORE_NODE_VERSION,
  IS_USING_LOCAL_NODE,
  NETWORK_ID,
  NODE_URL,
  CONTRACT_CONFIGURATION,
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

export async function getCompiledContract() {
  const contract = await sdk.getContractInstance({ source: contractSource });
  await contract.compile();
  return contract;
}

export async function deployContract(
  botAddress: EncodedData<'ak'>,
  channel: Channel,
  config: {
    player0: EncodedData<'ak'>;
    player1: EncodedData<'ak'>;
    reactionTime: number;
    debugTimestamp?: number;
  },
) {
  const contract = await getCompiledContract();

  return channel.createContract(
    {
      ...CONTRACT_CONFIGURATION,
      code: contract.bytecode,
      callData: contract.calldata.encode('RockPaperScissors', 'init', [
        ...Object.values(config),
      ]) as string,
    },
    async (tx) => {
      sdk.selectAccount(botAddress);
      return sdk.signTransaction(tx);
    },
  );
}

/**
 * ! LOCAL NODE USAGE ONLY
 * a helper function to fund account
 */
export const genesisFund = async (address: EncodedData<'ak'>) => {
  if (!IS_USING_LOCAL_NODE) throw new Error('genesis fund is only for local node usage');
  await sdk.addAccount(FAUCET_ACCOUNT, { select: true });
  await sdk.awaitHeight(2);
  await sdk.spend(1e25, address);
  if (sdk.accounts[FAUCET_PUBLIC_ADDRESS]) sdk.removeAccount(FAUCET_PUBLIC_ADDRESS);
};
