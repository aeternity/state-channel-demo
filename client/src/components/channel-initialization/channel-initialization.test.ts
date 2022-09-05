import { render, fireEvent } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import ChannelInitialization from './channel-initialization.vue';
import { createTestingPinia } from '@pinia/testing';

describe('Open State Channel Button', () => {
  expect(ChannelInitialization).toBeTruthy();
  it('should hide button after clicking it and show loader', async () => {
    const channelComp = render(ChannelInitialization, {
      global: {
        plugins: [createTestingPinia()],
      },
    });
    const button = channelComp.getByText('Start game');
    await fireEvent.click(button);
    // button is hidden after clicking it
    expect(() => {
      channelComp.getByText('Start game');
    }).toThrowError();

    channelComp.getByText('Funding accounts...');
  });

  it('should have `Reconnecting` title when there is a stored gameState', async () => {
    localStorage.setItem(
      'gameState',
      JSON.stringify({
        keypair: {},
        channelRound: 10,
        contractCreationChannelRound: 1,
      })
    );
    const channelComp = render(ChannelInitialization, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              channel: {
                channel: {
                  isOpen: true,
                  isFunded: true,
                },
              },
            },
          }),
        ],
      },
    });
    const button = channelComp.getByText('Start game');
    await fireEvent.click(button);
    // button is hidden after clicking it
    expect(() => {
      channelComp.getByText('Start game');
    }).toThrowError();

    expect(
      channelComp.getByText(
        'Reconnecting - Waiting for contract to be compiled...'
      )
    ).toBeDefined();
  });

  it('shows error message on error', async () => {
    const channelComp = render(ChannelInitialization, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              channel: {
                channel: {
                  error: {
                    status: 500,
                    statusText: 'Internal Server Error',
                    message: 'Error while fetching channel config',
                  },
                },
              },
            },
          }),
        ],
      },
    });
    const button = channelComp.getByText('Start game');
    await fireEvent.click(button);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(
      channelComp.getByText(
        'Error 500: Internal Server Error, Error while fetching channel config'
      )
    ).toBeTruthy();
  }, 6000);
});
