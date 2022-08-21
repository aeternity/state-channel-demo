import { BigNumber } from 'bignumber.js';
import { render } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import EndScreen from './end-screen.vue';
import { createTestingPinia } from '@pinia/testing';
import { GameChannel } from '../../utils/game-channel/game-channel';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import {
  mockBotTransactions,
  mockUserTransactions,
} from '../../../tests/mocks';

describe('Show end screen', async () => {
  expect(EndScreen).toBeTruthy();
  const gameChannel = new GameChannel();
  gameChannel.autoplay.enabled = true;
  gameChannel.autoplay.elapsedTime = 1000;
  gameChannel.balances.user = new BigNumber(10e18);
  gameChannel.channelConfig = {
    responderAmount: new BigNumber(5e18),
  } as ChannelOptions;

  it('should display the end screen when user wins', async () => {
    const endScreen = render(EndScreen, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              channel: {
                channel: gameChannel,
              },
              transactions: {
                userTransactions: mockUserTransactions,
                botTransactions: mockBotTransactions,
              },
            },
          }),
        ],
      },
    });
    expect(endScreen.getByText('You won 5.00 AE')).toBeTruthy();
    expect(endScreen.getByText('1 round played')).toBeTruthy();
    expect(endScreen.getByText('1 off-chain transaction in 1sec')).toBeTruthy();
  });

  it('should display the end screen when bot wins', async () => {
    gameChannel.balances.user = new BigNumber(3e18);
    const endScreen = render(EndScreen, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              channel: {
                channel: gameChannel,
              },
              transactions: {
                userTransactions: mockUserTransactions,
                botTransactions: mockBotTransactions,
              },
            },
          }),
        ],
      },
    });
    expect(endScreen.getByText('You lost 2.00 AE')).toBeTruthy();
    expect(endScreen.getByText('1 off-chain transaction in 1sec')).toBeTruthy();
  });

  it('should display the end screen when nobody wins', async () => {
    gameChannel.balances.user = new BigNumber(5e18);
    const endScreen = render(EndScreen, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              channel: {
                channel: gameChannel,
              },
              transactions: {
                userTransactions: mockUserTransactions,
                botTransactions: mockBotTransactions,
              },
            },
          }),
        ],
      },
    });
    expect(endScreen.getByText("You didn't win or lose anything")).toBeTruthy();
    expect(endScreen.getByText('1 off-chain transaction in 1sec')).toBeTruthy();
  });
});
