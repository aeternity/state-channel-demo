import { render } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import { SignatureType } from '../../utils/game-channel/game-channel.types';
import SingleTransaction, { TransactionLog } from './transaction.vue';

const mockTransactionLog: TransactionLog = {
  id: 'th_123',
  description: 'Test Tx',
  signed: SignatureType.proposed,
  onChain: false,
  timestamp: Date.now(),
};
const mockOnChainTransactionLog: TransactionLog = {
  id: 'th_123',
  description: 'Test Tx',
  signed: SignatureType.declined,
  onChain: true,
  timestamp: Date.now(),
};

describe('Render Single Transaction Log', () => {
  expect(SingleTransaction).toBeTruthy();
  it('should display a single signed transaction log', async () => {
    const transactionComp = render(SingleTransaction, {
      props: { transaction: mockTransactionLog },
    });

    expect(
      transactionComp.getByText(`TXID ${mockTransactionLog.id} |`)
    ).toBeTruthy();
    expect(
      transactionComp.getByText(`${mockTransactionLog.description}`)
    ).toBeTruthy();
    expect(transactionComp.getByText(SignatureType.proposed)).toBeTruthy();
  });
  it('should display a single declined on-chain transaction log', async () => {
    const transactionComp = render(SingleTransaction, {
      props: { transaction: mockOnChainTransactionLog },
    });

    expect(
      transactionComp.getByText(`TXID ${mockOnChainTransactionLog.id} |`)
    ).toBeTruthy();
    expect(
      transactionComp.getByText(`${mockOnChainTransactionLog.description}`)
    ).toBeTruthy();
    expect(transactionComp.getByText(SignatureType.declined)).toBeTruthy();
    expect(transactionComp.getByText('on Chain')).toBeTruthy();
  });
  it('should display display message when no transaction log is passed', async () => {
    const transactionComp = render(SingleTransaction);

    expect(transactionComp.getByText('pending...')).toBeTruthy();
  });
});
