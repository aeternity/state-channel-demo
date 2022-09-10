import { Channel } from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import contractSource from '@aeternity/rock-paper-scissors';
import { createTestingPinia } from '@pinia/testing';
import SHA from 'sha.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameChannel } from '../../utils/game-channel/game-channel';
import {
  initSdk,
  refreshSdkAccount,
  sdk,
  verifyContractBytecode,
} from '../../utils/sdk-service/sdk-service';

describe('SDK', () => {
  let gameChannel: GameChannel;
  const channelInitializeSpy = vi.spyOn(Channel, 'initialize');

  channelInitializeSpy.mockResolvedValue({
    on: () => ({}),
  } as unknown as Channel);

  beforeEach(async () => {
    await initSdk();
    await refreshSdkAccount();
    gameChannel = new GameChannel();
    const fetchConfigSpy = vi.spyOn(gameChannel, 'fetchChannelConfig');

    fetchConfigSpy.mockResolvedValue({} as ChannelOptions);
  });

  it('creates and returns an SDK instance', async () => {
    expect(sdk).toBeTruthy();
    expect(Object.keys(sdk.accounts).length).toBe(1);
    expect(sdk.selectedAddress).toBeTruthy();
  });

  it('cannot call contract when channel is not initialized', async () => {
    createTestingPinia({
      initialState: {
        channel: {
          channel: gameChannel,
        },
      },
    });
    await expect(gameChannel.callContract('init', [])).rejects.toThrowError(
      'Channel is not open'
    );
  });
  it('cannot call contract when contract is not deployed', async () => {
    createTestingPinia({
      initialState: {
        channel: {
          channel: gameChannel,
        },
      },
    });
    await gameChannel.initializeChannel();

    expect(gameChannel.contract).toBeFalsy();
    await expect(gameChannel.callContract('init', [])).rejects.toThrowError(
      'Contract is not set'
    );
  });

  it('can call contract after it is deployed', async () => {
    vi.spyOn(gameChannel, 'callContract').mockResolvedValue({
      accepted: true,
      signedTx: 'tx_mock',
    });

    createTestingPinia({
      initialState: {
        channel: {
          channel: gameChannel,
        },
      },
    });

    await expect(
      gameChannel.callContract('provide_hash', [
        SHA('sha256')
          .update('aeternity' + 'rock')
          .digest('hex'),
      ])
    ).resolves.toHaveProperty('accepted');
  });

  describe('verifyContractBytecode()', () => {
    const wrongSource = `
      contract Remote =
      datatype event = RemoteEvent1(int) | RemoteEvent2(string, int) | Duplicate(int)
      stateful entrypoint emitEvents(duplicate: bool) : unit =
      Chain.event(RemoteEvent2("test-string", 43))
      switch(duplicate)
        true => Chain.event(Duplicate(0))
        false => ()
    `;
    const gameChannel = new GameChannel();
    const fetchConfigSpy = vi.spyOn(gameChannel, 'fetchChannelConfig');
    fetchConfigSpy.mockResolvedValue({} as ChannelOptions);

    vi.spyOn(gameChannel, 'callContract').mockResolvedValue({
      accepted: true,
      signedTx: 'tx_mock',
    });

    it('returns true if proposed bytecode is correct', async () => {
      const contract = await sdk.getContractInstance({
        source: contractSource,
      });
      await contract.compile();
      if (!contract.bytecode)
        throw new Error('Contract bytecode is not defined');
      await expect(
        verifyContractBytecode(contract.bytecode, contractSource)
      ).resolves.toBeTruthy();
    }, 10000);

    it('returns false if proposed bytecode is wrong', async () => {
      const contract = await sdk.getContractInstance({
        source: contractSource,
      });
      await contract.compile();
      if (!contract.bytecode)
        throw new Error('Contract bytecode is not defined');
      expect(
        verifyContractBytecode(contract.bytecode, wrongSource)
      ).resolves.toBeFalsy();
    });
  });
});
