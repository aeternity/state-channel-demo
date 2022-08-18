import { render } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import SingleTransaction, { TransactionLog } from './transaction.vue';

const mockTransactionLog: TransactionLog = {
  id: 'tx_123',
  description: 'Test Tx',
  signed: true,
  onChain: false,
  timestamp: Date.now(),
};
const mockOnChainTransactionLog: TransactionLog = {
  id: 'tx_123',
  description: 'Test Tx',
  signed: false,
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
    expect(transactionComp.getByText('Signed')).toBeTruthy();
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
    expect(transactionComp.getByText('Declined')).toBeTruthy();
    expect(transactionComp.getByText('on Chain')).toBeTruthy();
  });
  it('should display display message when no transaction log is passed', async () => {
    const transactionComp = render(SingleTransaction);

    expect(transactionComp.getByText('pending...')).toBeTruthy();
  });
});
