import { fireEvent, render } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import TransactionsList from './transaction-list.vue';
import {
  mockUserTransactions,
  mockBotTransactions,
} from '../../../tests/mocks';

describe('Render Transactions List', () => {
  expect(TransactionsList).toBeTruthy();

  it('can expand and minimize', async () => {
    const transactionsComp = render(TransactionsList, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              channel: { channel: { isOpen: true, gameRound: { index: 0 } } },
            },
          }),
        ],
      },
    });
    const transactions = transactionsComp.getByTestId('transactions');
    const expandButton = transactionsComp.getByLabelText('expand_button');
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
              channel: { channel: { isOpen: true, gameRound: { index: 1 } } },
              transactions: {
                userTransactions: mockUserTransactions,
                botTransactions: mockBotTransactions,
              },
            },
          }),
        ],
      },
    });
    const channelInitTxLogs = transactionsComp.getByTestId(
      'channel-init-tx-logs'
    );
    const gameRoundTxLogs = transactionsComp.getByTestId('game-round-tx-logs');
    const channelShutdownTxLogs = transactionsComp.getByTestId(
      'channel-shutdown-tx-logs'
    );
    expect(
      channelInitTxLogs && gameRoundTxLogs && channelShutdownTxLogs
    ).toBeTruthy();

    expect(channelInitTxLogs.textContent).toContain('User Initial Transaction');
    expect(channelInitTxLogs.textContent).toContain('Bot Initial Transaction');
    expect(channelInitTxLogs.textContent).toContain(
      'User Deploy Contract Transaction'
    );
    expect(channelInitTxLogs.textContent).toContain(
      'Bot Deploy Contract Transaction'
    );

    expect(channelShutdownTxLogs.textContent).toContain(
      'User Shutdown Transaction'
    );
    expect(channelShutdownTxLogs.textContent).toContain(
      'Bot Shutdown Transaction'
    );

    expect(gameRoundTxLogs.textContent).toContain('User Round 1 Transaction');
    expect(gameRoundTxLogs.textContent).toContain('Bot Round 1 Transaction');
  });
});
