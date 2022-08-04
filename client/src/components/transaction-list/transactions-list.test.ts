import { fireEvent, render } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import TransactionsList from './transaction-list.vue';

describe('Render Transactions List', () => {
  expect(TransactionsList).toBeTruthy();
  it('disables expand button when channel is not open', async () => {
    const transactionsComp = render(TransactionsList, {
      global: {
        plugins: [createTestingPinia()],
      },
    });
    const expandButton = transactionsComp.getByLabelText('expand_button');
    expect(expandButton.getAttribute('disabled')).toBe('true');
  });

  it('enables expand button when channel opens', async () => {
    const transactionsComp = render(TransactionsList, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              channel: { channel: { isOpen: true } },
            },
          }),
        ],
      },
    });
    const transactions = transactionsComp.getByTestId('transactions');
    const expandButton = transactionsComp.getByLabelText('expand_button');
    expect(expandButton.getAttribute('disabled')).toBe('false');
    expect(expandButton.textContent).toBe('Expand');

    await fireEvent.click(expandButton);
    expect(expandButton.textContent).toBe('Minimize');
    expect(transactions.classList.contains('fullscreen')).toBeTruthy();

    await fireEvent.click(expandButton);
    expect(expandButton.textContent).toBe('Expand');
    expect(transactions.classList.contains('fullscreen')).toBeFalsy();
  });

  it('renders transactions', async () => {
    const transactionsComp = render(TransactionsList, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              channel: { channel: { isOpen: true } },
              transactions: {
                userTransactions: [
                  {
                    id: '1',
                    description: 'User Transaction 1',
                    signed: true,
                    onChain: true,
                    timestamp: Date.now(),
                  },
                ],
                botTransactions: [
                  {
                    id: '2',
                    description: 'Bot Transaction 1',
                    signed: true,
                    onChain: true,
                    timestamp: Date.now(),
                  },
                ],
              },
            },
          }),
        ],
      },
    });
    const transactions = transactionsComp.getByTestId('transactions');
    expect(transactions.textContent).toContain('User Transaction 1');
    expect(transactions.textContent).toContain('Bot Transaction 1');
  });
});
