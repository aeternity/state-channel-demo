import { Channel } from '@aeternity/aepp-sdk';
import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import contractSource from '@aeternity/rock-paper-scissors';
import logger from '../../logger';
import { decodeCallData, sdk, Update } from '../sdk';
import {
  CONTRACT_CONFIGURATION,
  CONTRACT_NAME,
  Methods,
  Moves,
} from './contract.constants';

export async function getCompiledContract(onAccount: EncodedData<'ak'>) {
  const contract = await sdk.getContractInstance({
    source: contractSource,
    onAccount,
  });
  await contract.compile();
  return contract;
}

export function getRandomMoveCallData(contract: ContractInstance) {
  const randomMove = Math.floor(Math.random() * 3);
  const move = Object.values(Moves)[randomMove];
  return contract.calldata.encode(CONTRACT_NAME, Methods.player1_move, [move]);
}

export async function deployContract(
  deployerAddress: EncodedData<'ak'>,
  channel: Channel,
  config: {
    player0: EncodedData<'ak'>;
    player1: EncodedData<'ak'>;
    reactionTime: number;
    debugTimestamp?: number;
  },
) {
  const contract = await getCompiledContract(deployerAddress);

  const res = await channel.createContract(
    {
      ...CONTRACT_CONFIGURATION,
      code: contract.bytecode,
      callData: contract.calldata.encode(CONTRACT_NAME, Methods.init, [
        ...Object.values(config),
      ]) as string,
    },
    async (tx) => sdk.signTransaction(tx, {
      onAccount: deployerAddress,
    }),
  );

  logger.info(`${deployerAddress} deployed contract: ${res.address}`);

  return { instance: contract, address: res.address } as {
    instance: ContractInstance;
    address: EncodedData<'ct'>;
  };
}

export async function getNextCallData(
  update: Update,
  contract: ContractInstance,
) {
  const data = await decodeCallData(update.call_data, contract.bytecode);
  switch (data.function) {
    case Methods.provide_hash:
      return getRandomMoveCallData(contract);
    case Methods.reveal:
      return null;
    default:
      throw new Error(`Unhandled method: ${data.function}`);
  }
}
