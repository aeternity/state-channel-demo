import { fireEvent, render } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import TransactionsList from '../src/components/TransactionsList.vue';
import { initGameChannel, gameChannel } from '../src/sdk/GameChannel';
import { initSdk } from '../src/sdk/sdkService';

describe('Render Transactions List', async () => {
  await initSdk();
  await initGameChannel();

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
    gameChannel.isOpen = true;
    const transactionsComp = render(TransactionsList);

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
