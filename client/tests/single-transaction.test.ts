import { render } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import SingleTransaction from '../src/components/SingleTransaction.vue';

const mockTransaction = { hash: '1234567', status: 'success' };
const mockTransactionFailed = { hash: '1234568', status: 'failed' };

describe('Render Single Transaction Log', () => {
  expect(SingleTransaction).toBeTruthy();
  it('should display a single transaction log', async () => {
    const transactionComp = render(SingleTransaction, {
      props: { transaction: mockTransaction },
    });

    const log = transactionComp.getByText(
      `Hash: ${mockTransaction.hash} Status: ${mockTransaction.status}`
    );
    expect(log).toBeTruthy();
  });

  it('should add specific class to failed transactions ', async () => {
    const transactionComp = render(SingleTransaction, {
      props: { transaction: mockTransactionFailed },
    });

    const log = transactionComp.getByText(
      `Hash: ${mockTransactionFailed.hash} Status: ${mockTransactionFailed.status}`
    );
    expect(log.classList.contains('failed')).toBeTruthy();
  });
});
