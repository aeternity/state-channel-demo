import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import { describe, it, expect, vi } from 'vitest';
import {
  getSdk,
  FAUCET_ACCOUNT,
  verifyContractBytecode,
} from '../src/sdk/sdkService';
import { createTestingPinia } from '@pinia/testing';
import { GameChannel } from '../src/sdk/GameChannel';
import { AeSdk } from '@aeternity/aepp-sdk';
import contractSource from '@aeternity/rock-paper-scissors';
import { waitForChannelReady } from './utils';
import SHA from 'sha.js';

describe('SDK', () => {
  it('creates and returns an SDK instance', async () => {
    const sdk = await getSdk();
    expect(sdk).toBeTruthy();
    expect(Object.keys(sdk.accounts).length).toBe(1);
    expect(sdk.selectedAddress).toBeTruthy();
  });

  it('cannot call contract when channel is not initialized', async () => {
    const gameChannel = new GameChannel(await getSdk());
    gameChannel.autoSign = true;
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await gameChannel.initializeChannel();
    createTestingPinia({
      initialState: {
        channel: {
          channel: gameChannel,
        },
      },
    });
    await expect(gameChannel.callContract('init', [])).rejects.toThrow();
  });
  it('cannot call contract when contract is not deployed', async () => {
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
    await waitForChannelReady(gameChannel.getChannelWithoutProxy());
    expect(gameChannel.contract).toBeFalsy();
    await expect(gameChannel.callContract('init', [])).rejects.toThrow();
  });

  it('can call contract after it is deployed', async () => {
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
    await waitForChannelReady(gameChannel.getChannelWithoutProxy());
    expect(gameChannel.contract).toBeFalsy();
    await new Promise((resolve) => setTimeout(resolve, 5000));
    expect(gameChannel.contract).toBeTruthy();
    await expect(
      gameChannel.callContract('provide_hash', [
        SHA('sha256')
          .update('aeternity' + 'rock')
          .digest('hex'),
      ])
    ).resolves.toHaveProperty('accepted');
  }, 8000);

  it('creates game channel instance, initializes Channel and returns coins to faucet on channel closing', async () => {
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
    await waitForChannelReady(gameChannel.getChannelWithoutProxy());
    const client = gameChannel.sdk as AeSdk;
    const ae = await getSdk();

    expect(client?.selectedAddress).toBeTruthy();
    expect(gameChannel.getStatus()).toBe('open');

    if (FAUCET_ACCOUNT) {
      await ae.addAccount(FAUCET_ACCOUNT, { select: true });
    }
    const balance_before = await client.getBalance(
      client.selectedAddress as Encoded.AccountAddress
    );
    expect(BigInt(balance_before)).toBeGreaterThan(0);

    const faucet_balance_before = await ae.getBalance(
      ae.selectedAddress as Encoded.AccountAddress
    );

    await gameChannel.closeChannel();
    await new Promise((resolve) => setTimeout(resolve, 2500));
    expect(gameChannel.getStatus()).toBe('disconnected');

    const balance_after = await client.getBalance(
      client.selectedAddress as Encoded.AccountAddress
    );
    const faucet_balance_after = await ae.getBalance(
      ae.selectedAddress as Encoded.AccountAddress
    );
    expect(balance_after).toBe('0');
    expect(BigInt(faucet_balance_after)).toBeGreaterThan(
      BigInt(faucet_balance_before)
    );
  }, 7000);

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
    it('returns true if proposed bytecode is correct', async () => {
      const sdk = await getSdk();
      const contract = await sdk.getContractInstance({
        source: contractSource,
      });
      await contract.compile();
      if (!contract.bytecode)
        throw new Error('Contract bytecode is not defined');
      await expect(
        verifyContractBytecode(sdk, contract.bytecode, contractSource)
      ).resolves.toBeTruthy();
    });

    it('returns false if proposed bytecode is wrong', async () => {
      const sdk = await getSdk();
      const contract = await sdk.getContractInstance({
        source: contractSource,
      });
      await contract.compile();
      if (!contract.bytecode)
        throw new Error('Contract bytecode is not defined');
      expect(
        verifyContractBytecode(sdk, contract.bytecode, wrongSource)
      ).resolves.toBeFalsy();
    });
  });
});

describe('GameChannel', () => {
  describe('fetchChannelConfig()', () => {
    it('retries with a different sdk if account is greylisted', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      fetchSpy.mockResolvedValueOnce({
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
      } as unknown as Response);

      const sdk = await getSdk();

      const gameChannel = new GameChannel(sdk);
      await gameChannel.fetchChannelConfig();
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    }, 10000);
  });
});
