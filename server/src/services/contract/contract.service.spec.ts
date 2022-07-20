import ContractService, { Moves } from '.';

describe('ContractService', () => {
  it('should be defined', () => {
    expect(ContractService).toBeDefined();
  });

  describe('createHash()', () => {
    it('should create a unique hash when given different parameters', () => {
      const hash = ContractService.createHash(Moves.paper, 'test');
      const hash2 = ContractService.createHash(Moves.paper, 'test2');
      expect(hash).not.toEqual(hash2);
    });

    it('should create the same hash when given the same parameters', () => {
      const hash = ContractService.createHash(Moves.paper, 'test');
      const hash2 = ContractService.createHash(Moves.paper, 'test');
      expect(hash).toEqual(hash2);
    });
  });
});
