import { fireEvent, render } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import TransactionsList from './transaction-list.vue';

describe('Render Transactions List', () => {
  expect(TransactionsList).toBeTruthy();

  it('can expand and minimize', async () => {
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
                  [
                    {
                      id: '1',
                      description: 'User Initial Transaction',
                      signed: true,
                      onChain: true,
                      timestamp: Date.now(),
                    },
                    {
                      id: '2',
                      description: 'User Deploy Contract Transaction',
                      signed: true,
                      onChain: true,
                      timestamp: Date.now(),
                    },
                    {
                      id: '4',
                      description: 'User Shutdown Transaction',
                      signed: true,
                      onChain: true,
                      timestamp: Date.now(),
                    },
                  ],
                  [
                    {
                      id: '3',
                      description: 'User Round 1 Transaction',
                      signed: true,
                      onChain: false,
                      timestamp: Date.now(),
                    },
                  ],
                ],
                botTransactions: [
                  [
                    {
                      id: '1',
                      description: 'Bot Initial Transaction',
                      signed: true,
                      onChain: true,
                      timestamp: Date.now(),
                    },
                    {
                      id: '2',
                      description: 'Bot Deploy Contract Transaction',
                      signed: true,
                      onChain: false,
                      timestamp: Date.now(),
                    },
                    {
                      id: '4',
                      description: 'Bot Shutdown Transaction',
                      signed: true,
                      onChain: true,
                      timestamp: Date.now(),
                    },
                  ],
                  [
                    {
                      id: '3',
                      description: 'Bot Round 1 Transaction',
                      signed: true,
                      onChain: false,
                      timestamp: Date.now(),
                    },
                  ],
                ],
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
