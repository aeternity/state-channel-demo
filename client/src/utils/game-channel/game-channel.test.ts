import { BigNumber } from 'bignumber.js';
import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { GameChannel } from './game-channel';
import { initSdk, sdk } from '../sdk-service/sdk-service';
import contractSource from '@aeternity/rock-paper-scissors';
import { Selections } from './game-channel.types';
import { Channel } from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import * as main from '../../main';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';

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

  const getChannelWithoutProxySpy = vi.spyOn(
    gameChannel,
    'getChannelWithoutProxy'
  );

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

  describe('checkIfChannelIsEstablished()', async () => {
    getChannelWithoutProxySpy
      .mockReturnValueOnce({
        state: function () {
          return new Promise((resolve) => {
            setTimeout(resolve, 5000);
          });
        },
      } as Channel)
      .mockReturnValueOnce({
        state: function () {
          return new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
        },
      } as Channel);

    it('returns false when state() promise takes more than 3000ms', async () => {
      expect(await gameChannel.checkIfChannelIsEstablished()).toBe(false);
    });
    it('returns true when state() promise takes less than 3000ms', async () => {
      expect(await gameChannel.checkIfChannelIsEstablished()).toBe(true);
    });
  });

  describe('reconnectChannel()', async () => {
    const gameChannel = new GameChannel();
    const getChannelWithoutProxySpy = vi.spyOn(
      gameChannel,
      'getChannelWithoutProxy'
    );
    const reconnectSpy = vi.spyOn(Channel, 'reconnect');
    const checkIfChannelIsEstablishedSpy = vi.spyOn(
      gameChannel,
      'checkIfChannelIsEstablished'
    );
    const alertSpy = vi.spyOn(window, 'alert');
    const resetAppSpy = vi.spyOn(main, 'resetApp').mockResolvedValue();
    const registerEventsSpy = vi.spyOn(gameChannel, 'registerEvents');

    reconnectSpy.mockResolvedValue({} as Channel);
    checkIfChannelIsEstablishedSpy
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    it('alerts user that the channel was shutdown and resets app', async () => {
      gameChannel.channelConfig = {} as ChannelOptions;
      localStorage.setItem('gameState', 'test');
      await gameChannel.reconnectChannel();
      expect(alertSpy).toHaveBeenCalled();
      expect(localStorage.getItem('gameState')).toBe(null);
      await new Promise((resolve) => {
        setTimeout(resolve, 3000);
      });
      expect(resetAppSpy).toHaveBeenCalled();
    });

    it('re-registers events on channel reconnect', async () => {
      getChannelWithoutProxySpy.mockReturnValue({
        on: () => ({}),
      } as unknown as Channel);
      gameChannel.channelConfig = {} as ChannelOptions;
      localStorage.setItem('gameState', 'test');
      await gameChannel.reconnectChannel();
      expect(gameChannel.isOpen).toBe(true);
      expect(gameChannel.isFunded).toBe(true);
      expect(registerEventsSpy).toHaveBeenCalled();
    });
  });

  describe('saveStateToLocalStorage()', async () => {
    it('saves state to localStorage', async () => {
      const gameChannel = new GameChannel();
      const gameRound = {
        stake: new BigNumber(10),
        index: 3,
        isCompleted: true,
        winner: 'ak_me' as Encoded.AccountAddress,
        userSelection: Selections.paper,
        botSelection: Selections.rock,
        hasRevealed: true,
      };
      gameChannel.gameRound = gameRound;
      gameChannel.contractCreationChannelRound = 3;
      gameChannel.channelConfig = {} as ChannelOptions;
      gameChannel.saveStateToLocalStorage();

      const { stake, ...restgameRound } = gameRound;
      const { stake: savedStake, ...savedRound } = JSON.parse(
        localStorage.getItem('gameState') || '{}'
      ).gameRound;
      expect(stake.toString()).toEqual(savedStake.toString());
      expect(savedRound).toEqual(restgameRound);
    });
  });

  describe('restoreGameState()', async () => {
    const gameChannel = new GameChannel();
    const reconnectChannelSpy = vi
      .spyOn(gameChannel, 'reconnectChannel')
      .mockResolvedValue({} as NodeJS.Timeout);
    const buildContractSpy = vi
      .spyOn(gameChannel, 'buildContract')
      .mockResolvedValue();
    const updateBalancesSpy = vi
      .spyOn(gameChannel, 'updateBalances')
      .mockResolvedValue();

    it('returns when there is no stored state', async () => {
      localStorage.clear();
      await gameChannel.restoreGameState();
      expect(gameChannel.gameRound).toEqual({
        stake: new BigNumber(0),
        index: 1,
        userSelection: Selections.none,
        botSelection: Selections.none,
        isCompleted: false,
      });
    });

    it('restores game state', async () => {
      gameChannel.gameRound = {
        stake: new BigNumber(10),
        index: 3,
        isCompleted: true,
        winner: 'ak_me' as Encoded.AccountAddress,
        userSelection: Selections.paper,
        botSelection: Selections.rock,
        hasRevealed: true,
      };
      gameChannel.contractCreationChannelRound = 3;
      gameChannel.fsmId = 'fsmId';
      gameChannel.channelId = 'ch_ala';
      gameChannel.channelConfig = {} as ChannelOptions;
      gameChannel.saveStateToLocalStorage();
      await gameChannel.restoreGameState();
      expect(reconnectChannelSpy).toHaveBeenCalled();
      expect(buildContractSpy).toHaveBeenCalled();
      expect(updateBalancesSpy).toHaveBeenCalled();
    });
  });
});
