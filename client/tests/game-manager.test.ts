import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import GameManager, { Selections } from '../src/game/GameManager';
import { gameChannel, initGameChannel } from '../src/sdk/GameChannel';
import { initSdk } from '../src/sdk/sdkService';
import { waitForChannelReady } from './utils';

describe('GameManager', async () => {
  let gameManager: GameManager;

  beforeEach(async () => {
    await initSdk();
    await initGameChannel();
    gameChannel.autoSign = true;
    await gameChannel.initializeChannel();

    if (!gameChannel.channelInstance)
      throw new Error('Channel instance is not initialized');
    await waitForChannelReady(gameChannel.channelInstance);
  });

  it('creates game manager instance', async () => {
    gameManager = new GameManager();
    expect(gameManager).toBeTruthy();
    expect(gameManager.getUserSelection()).toBe(Selections.none);
    expect(gameManager.botSelection).toBe(Selections.none);
  });

  it('can set/get selection for user', async () => {
    // wait for contract to be deployed
    await new Promise((resolve) => setTimeout(resolve, 5000));
    expect(gameChannel.contract).toBeTruthy();
    await gameManager.setUserSelection(Selections.rock);
    expect(gameManager.getUserSelection()).toBe(Selections.rock);
  }, 6000);

  it('throws error if selection is none', async () => {
    let errorMsg = '';
    try {
      await gameManager.setUserSelection(Selections.none);
    } catch (e) {
      errorMsg = e.message;
    }
    expect(errorMsg).toBe('Selection should not be none');
  });
});
