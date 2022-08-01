import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import contractSource from '@aeternity/rock-paper-scissors';
import { CONTRACT_NAME, Methods, Moves } from './contract.constants';
import { ContractService, RockPaperScissorsContract } from '.';
import { decodeCallData, sdk, Update } from '../sdk';
import { createHash } from '../../../test';

describe('ContractService', () => {
  it('should be defined', () => {
    expect(ContractService).toBeDefined();
  });

  let contract: ContractInstance;

  beforeAll(async () => {
    contract = (await sdk.getContractInstance({
      source: contractSource,
    })) as RockPaperScissorsContract;
    await contract.compile();
  });

  describe('getRandomMoveCallData()', () => {
    it('should generate callData with either rock, paper, or scissors', async () => {
      const callData = ContractService.getRandomMoveCallData(contract);
      const decodedCallData = await decodeCallData(callData, contract.bytecode);

      const { arguments: usedArguments } = decodedCallData;

      expect(usedArguments.length).toBe(1);
      expect(decodedCallData.function).toBe('player1_move');
      expect(
        Object.values(Moves).includes(usedArguments[0].value as Moves),
      ).toBeTruthy();
    });
  });

  describe('getNextCallData()', () => {
    it('should make a move when last called method was provide_hash', async () => {
      const hashKey = 'Aeternity';
      const pick = Moves.paper;
      const dummyHash = await createHash(pick, hashKey);

      const callData = contract.calldata.encode(
        CONTRACT_NAME,
        Methods.provide_hash,
        [dummyHash],
      );

      const update: Update = {
        call_data: callData,
        contract_id: 'ct_',
        op: 'OffChainCallContract',
      };

      const nextCallData = await ContractService.getNextCallData(
        update,
        contract,
      );

      const decodedCallData = await decodeCallData(
        nextCallData,
        contract.bytecode,
      );
      const { arguments: usedArguments } = decodedCallData;

      expect(usedArguments.length).toBe(1);
      expect(decodedCallData.function).toBe('player1_move');
      expect(
        Object.values(Moves).includes(usedArguments[0].value as Moves),
      ).toBeTruthy();
    });

    it('should throw an error if update contains an unhandled method', async () => {
      const callData = contract.calldata.encode(
        CONTRACT_NAME,
        Methods.set_timestamp,
        [1],
      );

      const update: Update = {
        call_data: callData,
        contract_id: 'ct_',
        op: 'OffChainCallContract',
      };

      await expect(
        ContractService.getNextCallData(update, contract),
      ).rejects.toThrow('Unhandled method: set_timestamp');
    });
  });
});
