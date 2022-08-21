import { BigNumber } from 'bignumber.js';
import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { GameChannel } from './game-channel';
import { initSdk, sdk } from '../sdk-service/sdk-service';
import contractSource from '@aeternity/rock-paper-scissors';
import { Selections } from './game-channel.types';

describe('GameChannel', async () => {
  const gameChannel = new GameChannel();
  await initSdk();

  vi.spyOn(gameChannel, 'callContract').mockResolvedValue({
    accepted: true,
    signedTx: 'tx_mock',
  });

  vi.spyOn(sdk, 'getContractInstance').mockResolvedValue({
    source: contractSource,
    compile: () => ({ bytecode: 'bytecode_mock' }),
  } as unknown as ContractInstance);

  beforeEach(async () => {
    createTestingPinia({
      initialState: {
        channel: {
          channel: gameChannel,
        },
      },
      stubActions: false,
    });
  });

  it('creates game channel instance', async () => {
    expect(gameChannel).toBeTruthy();
    expect(gameChannel.getUserSelection()).toBe(Selections.none);
    expect(gameChannel.gameRound.botSelection).toBe(Selections.none);
  });

  it('can set/get selection for user', async () => {
    await gameChannel.setUserSelection(Selections.rock);
    expect(gameChannel.getUserSelection()).toBe(Selections.rock);
  });

  it('throws error if selection is none', async () => {
    let errorMsg = '';
    try {
      await gameChannel.setUserSelection(Selections.none);
    } catch (e) {
      errorMsg = (e as { message: string }).message;
    }
    expect(errorMsg).toBe('Selection should not be none');
  });

  describe('fetchChannelConfig()', () => {
    it('retries with a different sdk if account is greylisted', async () => {
      await initSdk();
      const fetchSpy = vi.spyOn(global, 'fetch');
      fetchSpy
        .mockResolvedValueOnce({
          headers: {} as Headers,
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
          headers: {} as Headers,
          ok: false,
          redirected: false,
          status: 200,
          statusText: 'lalalal',
          type: 'ok',
          json: () => {
            return {};
          },
          url: '',
        } as unknown as Promise<Response>);

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

      expect(gameChannel.gameRound.winner).toBe(winner);
      expect(gameChannel.gameRound.isCompleted).toBe(true);
      expect(updateBalancesSpy).toHaveBeenCalled();
    });
  });

  describe('startNewRound()', () => {
    it('increments round index and resets state', () => {
      const gameChannel = new GameChannel();
      gameChannel.gameRound = {
        stake: new BigNumber(10),
        index: 3,
        isCompleted: true,
        winner: 'ak_me',
        userSelection: Selections.paper,
        botSelection: Selections.rock,
        hasRevealed: true,
      };
      gameChannel.startNewRound();

      expect(gameChannel.gameRound).toEqual({
        stake: new BigNumber(10),
        index: 4,
        isCompleted: false,
        winner: undefined,
        userSelection: Selections.none,
        botSelection: Selections.none,
        hasRevealed: false,
      });

      gameChannel.startNewRound();
      gameChannel.startNewRound();

      expect(gameChannel.gameRound.index).toBe(6);
    });
  });
});
