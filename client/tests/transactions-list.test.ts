import { render } from '@testing-library/vue';
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
    const autoplaybtn = transactionsComp.getByLabelText('autoplay_button');
    expect(autoplaybtn.getAttribute('disabled')).toBe('true');
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
    const autoplaybtn = transactionsComp.getByLabelText('autoplay_button');
    expect(autoplaybtn.getAttribute('disabled')).toBe('false');
  });
});
