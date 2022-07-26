import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
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

describe('SDK', () => {
  it('creates and returns an SDK instance', async () => {
    const sdk = await getSdk();
    expect(sdk).toBeTruthy();
    expect(Object.keys(sdk.accounts).length).toBe(1);
    expect(sdk.selectedAddress).toBeTruthy();
  });

  it('creates game channel instance, initializes Channel and returns coins to faucet on channel closing', async () => {
    createTestingPinia();
    const gameChannel = new GameChannel(await getSdk());
    await gameChannel.initializeChannel();
    const client = gameChannel.sdk as AeSdk;
    const ae = await getSdk();

    expect(client?.selectedAddress).toBeTruthy();
    expect(gameChannel.channelInstance?.status()).toBe('connected');

    if (FAUCET_ACCOUNT) {
      await ae.addAccount(FAUCET_ACCOUNT, { select: true });
    }
    const balance_before = await client.getBalance(
      client.selectedAddress as EncodedData<'ak'>
    );
    expect(BigInt(balance_before)).toBeGreaterThan(0);

    const faucet_balance_before = await ae.getBalance(
      ae.selectedAddress as EncodedData<'ak'>
    );

    await gameChannel.closeChannel();
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const balance_after = await client.getBalance(
      client.selectedAddress as EncodedData<'ak'>
    );
    const faucet_balance_after = await ae.getBalance(
      ae.selectedAddress as EncodedData<'ak'>
    );
    expect(balance_after).toBe('0');
    expect(BigInt(faucet_balance_after)).toBeGreaterThan(
      BigInt(faucet_balance_before)
    );
  }, 6000);

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
    it('does not throw an error if proposed bytecode is correct', async () => {
      const sdk = await getSdk();
      const contract = await sdk.getContractInstance({
        source: contractSource,
      });
      await contract.compile();
      if (!contract.bytecode)
        throw new Error('Contract bytecode is not defined');
      await expect(
        verifyContractBytecode(sdk, contract.bytecode, contractSource)
      ).resolves.toBeFalsy();
    });

    it('throw an error if proposed bytecode is wrong', async () => {
      const sdk = await getSdk();
      const contract = await sdk.getContractInstance({
        source: contractSource,
      });
      await contract.compile();
      if (!contract.bytecode)
        throw new Error('Contract bytecode is not defined');
      expect(
        verifyContractBytecode(sdk, contract.bytecode, wrongSource)
      ).rejects.toThrow();
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
    }, 6000);
  });
});
