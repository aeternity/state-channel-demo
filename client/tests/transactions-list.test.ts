import { fireEvent, render } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import TransactionsList from '../src/components/TransactionsList.vue';

describe('Render Transactions List', () => {
  expect(TransactionsList).toBeTruthy();
  it('disables autoplay button when channel is not open', async () => {
    const transactionsComp = render(TransactionsList, {
      global: {
        plugins: [createTestingPinia()],
      },
    });
    const expandButton = transactionsComp.getByLabelText('expand_button');
    expect(expandButton.getAttribute('disabled')).toBe('true');
  });

  it('enables autoplay button when channel opens', async () => {
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
});
