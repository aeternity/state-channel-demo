import { describe, it, expect, beforeAll } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { GameChannel, Selections } from '../src/sdk/GameChannel';
import { initSdk } from '../src/sdk/sdkService';
import { waitForChannelReady } from './utils';

describe('GameChannel', async () => {
  let gameChannel: GameChannel;

  beforeAll(async () => {
    await initSdk();
    gameChannel = new GameChannel();
    gameChannel.autoSign = true;
    await gameChannel.initializeChannel();
    createTestingPinia({
      initialState: {
        channel: {
          channel: gameChannel,
        },
      },
    });
    await waitForChannelReady(gameChannel.getChannelWithoutProxy());
  });

  it('creates game channel instance', async () => {
    expect(gameChannel).toBeTruthy();
    expect(gameChannel.getUserSelection()).toBe(Selections.none);
    expect(gameChannel.game.round.botSelection).toBe(Selections.none);
  });

  it('can set/get selection for user', async () => {
    // wait for contract to be deployed
    await new Promise((resolve) => setTimeout(resolve, 5000));
    expect(gameChannel.contract).toBeTruthy();
    await gameChannel.setUserSelection(Selections.rock);
    expect(gameChannel.getUserSelection()).toBe(Selections.rock);
  }, 6000);

  it('throws error if selection is none', async () => {
    let errorMsg = '';
    try {
      await gameChannel.setUserSelection(Selections.none);
    } catch (e) {
      errorMsg = e.message;
    }
    expect(errorMsg).toBe('Selection should not be none');
  });
});
