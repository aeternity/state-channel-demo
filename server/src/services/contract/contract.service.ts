import { buildTxHash, Channel } from '@aeternity/aepp-sdk';
import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import contractAci from './contract-aci.json';
import logger from '../../logger';
import { SignatureType, TransactionLog } from '../bot/bot.interface';
import { sdk } from '../sdk';
import contractBytecode from './contract.bytecode';
import {
  ContractEvents,
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
    aci: contractAci,
    bytecode: contractBytecode,
    onAccount,
  });
  contract.bytecode ??= contractBytecode;
  return contract;
}

/**
 * Makes a random pick and returns calldata for `player1_move` method
 */
export function getRandomMoveCallData(contract: ContractInstance): {
  move: Moves;
  calldata: Encoded.ContractBytearray;
} {
  const randomMove = Math.floor(Math.random() * 3);
  const move = Object.values(Moves)[randomMove];
  return {
    move,
    calldata: contract.calldata.encode(CONTRACT_NAME, Methods.player1_move, [
      move,
    ]),
  };
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
    async (tx) => {
      const log: TransactionLog = {
        id: buildTxHash(tx),
        onChain: false,
        description:
          'Bot signed a transaction and deployed game contract in state channel',
        timestamp: Date.now(),
        signed: SignatureType.proposed,
      };
      void channel.sendMessage(
        {
          type: 'add_bot_transaction_log',
          data: log,
        },
        config.player0,
      );

      return sdk.signTransaction(tx, {
        onAccount: deployerAddress,
      });
    },
  );

  logger.info(`${deployerAddress} deployed contract: ${res.address}`);

  return { instance: contract, address: res.address };
}

/**
 * extracts latest callData from decoded events
 * and generates returns next callData to be sent
 */
export async function getNextCallDataFromDecodedEvents(
  events: ReturnType<ContractInstance['decodeEvents']>,
  contract: ContractInstance,
) {
  if (events.length === 0) return null;

  const mainEvent = events.at(-1);
  switch (mainEvent.name) {
    case ContractEvents.player0ProvidedHash:
      return getRandomMoveCallData(contract);
    default:
      return null;
  }
}

/**
 * extracts latest callData from last called method
 * and generates returns next callData to be sent
 */
export function getNextCallDataFromPreviousMethod(
  method: Methods,
  contract: ContractInstance,
) {
  switch (method) {
    case Methods.provide_hash:
      return getRandomMoveCallData(contract);
    default:
      return null;
  }
}

/**
 * Finds called method from given callData
 */
export function findMethodFromCallData(
  callData: Encoded.ContractBytearray,
  contract: ContractInstance,
) {
  return Object.values(Methods).find(
    (method) => !!contract.calldata.decode(CONTRACT_NAME, method, callData),
  );
}
