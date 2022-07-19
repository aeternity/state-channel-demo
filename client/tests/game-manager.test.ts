import { describe, it, expect } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import GameManager, { Selections } from '../src/game/GameManager';
import { GameChannel } from '../src/sdk/GameChannel';
import { getSdk } from '../src/sdk/sdkService';

describe('GameManager', async () => {
  let gameManager: GameManager;
  const gameChannel = new GameChannel(await getSdk());
  gameChannel.autoSign = true;
  await gameChannel.initializeChannel();
  createTestingPinia({
    initialState: {
      channel: {
        channel: gameChannel,
      },
    },
  });
  await gameChannel.waitForChannelReady();
  // TODO remove when contract is created by bot
  await gameChannel.createContract();

  it('creates game manager instance', async () => {
    gameManager = new GameManager();
    expect(gameManager).toBeTruthy();
    expect(gameManager.getUserSelection()).toBe(Selections.none);
    expect(gameManager.botSelection).toBe(Selections.none);
  });

  it('can set/get selection for user', async () => {
    await gameManager.setUserSelection(Selections.rock);
    expect(gameManager.getUserSelection()).toBe(Selections.rock);
  });

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
