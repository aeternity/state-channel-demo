import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import { ContractService } from '.';
import { createHash, decodeCallData } from '../../../test';
import { sdk } from '../sdk';
import { ContractEvents, CONTRACT_NAME, Moves } from './contract.constants';
import { getCompiledContract } from './contract.service';

describe('ContractService', () => {
  it('should be defined', () => {
    expect(ContractService).toBeDefined();
  });

  let contract: ContractInstance;

  beforeAll(async () => {
    contract = await getCompiledContract(sdk.selectedAddress);
  });

  describe('getRandomMoveCallData()', () => {
    it('should generate callData with either rock, paper, or scissors', async () => {
      const callData = ContractService.getRandomMoveCallData(contract).calldata;
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

      const { calldata: nextCallData } = await ContractService.getNextCallDataFromDecodedEvents(
        [
          {
            name: ContractEvents.player0ProvidedHash,
            args: [dummyHash],
            contract: {
              name: CONTRACT_NAME,
              address: 'ct_random',
            },
          },
        ],
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

    it('should return null when provided with unhandled method', async () => {
      const nextCallData = await ContractService.getNextCallDataFromDecodedEvents(
        [
          {
            name: 'lala',
            args: ['lala'],
            contract: {
              name: CONTRACT_NAME,
              address: 'ct_random',
            },
          },
        ],
        contract,
      );
      expect(nextCallData).toBe(null);
    });
  });
});
