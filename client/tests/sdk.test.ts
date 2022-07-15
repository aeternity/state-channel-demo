import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import { describe, it, expect } from 'vitest';
import { getSdk, FAUCET_ACCOUNT } from '../src/sdk/sdkService';
import { createTestingPinia } from '@pinia/testing';
import { GameChannel } from '../src/sdk/GameChannel';
import { AeSdk } from '@aeternity/aepp-sdk';

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
});
