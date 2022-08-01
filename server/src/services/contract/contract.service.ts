import { Channel } from '@aeternity/aepp-sdk';
import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import contractSource from '@aeternity/rock-paper-scissors';
import logger from '../../logger';
import { decodeCallData, sdk, Update } from '../sdk';
import {
  CONTRACT_CONFIGURATION,
  CONTRACT_NAME,
  Methods,
  Moves,
} from './contract.constants';

/**
 * @category sdk-wrapper
 */
export async function getCompiledContract(onAccount: Encoded.AccountAddress) {
  const contract = await sdk.getContractInstance({
    source: contractSource,
    onAccount,
  });
  await contract.compile();
  return contract;
}

/**
 * Makes a random pick and returns calldata for `player1_move` method
 */
export function getRandomMoveCallData(
  contract: ContractInstance,
): Encoded.ContractBytearray {
  const randomMove = Math.floor(Math.random() * 3);
  const move = Object.values(Moves)[randomMove];
  return contract.calldata.encode(CONTRACT_NAME, Methods.player1_move, [move]);
}

/**
 * deploys the contract on channel and returns the instance and its address
 * @param config - parameters used in contract's `init` method {@link 'https://github.com/aeternity/state-channel-demo/blob/develop/contract/contracts/RockPaperScissors.aes#L29'}
 */
export async function deployContract(
  deployerAddress: Encoded.AccountAddress,
  channel: Channel,
  config: {
    player0: Encoded.AccountAddress;
    player1: Encoded.AccountAddress;
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
      ]) as Encoded.ContractBytearray,
    },
    async (tx) => sdk.signTransaction(tx, {
      onAccount: deployerAddress,
    }),
  );

  logger.info(`${deployerAddress} deployed contract: ${res.address}`);

  return { instance: contract, address: res.address };
}

/**
 * extracts latest callData and generates returns next callData to be sent
 */
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
