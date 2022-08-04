import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { GameChannel, Selections } from '../../utils/game-channel/game-channel';
import { initSdk } from '../sdk-service/sdk-service';
import { waitForChannelReady } from '../../../tests/utils';

describe('GameChannel', async () => {
  let gameChannel: GameChannel;

  beforeEach(async () => {
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
  }, 10000);

  it('throws error if selection is none', async () => {
    let errorMsg = '';
    try {
      await gameChannel.setUserSelection(Selections.none);
    } catch (e) {
      errorMsg = e.message;
    }
    expect(errorMsg).toBe('Selection should not be none');
  });

  describe('fetchChannelConfig()', () => {
    it('retries with a different sdk if account is greylisted', async () => {
      await initSdk();
      const fetchSpy = vi.spyOn(global, 'fetch');
      fetchSpy
        .mockResolvedValueOnce({
          headers: {} as any,
          ok: false,
          redirected: false,
          status: 500,
          statusText: 'lalalal',
          type: 'error',
          json: () => {
            return {
              error: 'account is greylisted',
            };
          },
          url: '',
        } as unknown as Response)
        .mockReturnValueOnce({
          headers: {} as any,
          ok: false,
          redirected: false,
          status: 200,
          statusText: 'lalalal',
          type: 'ok',
          json: () => {
            return {};
          },
          url: '',
        });

      const gameChannel = new GameChannel();
      await gameChannel.fetchChannelConfig();
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    }, 10000);
  });

  describe('finishGameRound()', () => {
    it('sets winner, completes round and calls updateBalances()', () => {
      const updateBalancesSpy = vi.spyOn(gameChannel, 'updateBalances');
      const winner = 'ak_me';

      updateBalancesSpy.mockResolvedValue();

      gameChannel.finishGameRound(winner);

      expect(gameChannel.game.round.winner).toBe(winner);
      expect(gameChannel.game.round.isCompleted).toBe(true);
      expect(updateBalancesSpy).toHaveBeenCalled();
    });
  });

  describe('startNewRound()', () => {
    it('increments round index and resets state', () => {
      const gameChannel = new GameChannel();
      gameChannel.game.round = {
        index: 3,
        isCompleted: true,
        winner: 'ak_me',
        userSelection: Selections.paper,
        botSelection: Selections.rock,
        hasRevealed: true,
      };
      gameChannel.startNewRound();

      expect(gameChannel.game.round).toEqual({
        index: 4,
        isCompleted: false,
        winner: undefined,
        userSelection: Selections.none,
        botSelection: Selections.none,
        hasRevealed: false,
      });

      gameChannel.startNewRound();
      gameChannel.startNewRound();

      expect(gameChannel.game.round.index).toBe(6);
    });
  });
});
