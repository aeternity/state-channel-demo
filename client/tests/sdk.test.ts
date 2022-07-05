import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import { describe, it, expect } from 'vitest';
import { getSdk, returnCoinsToFaucet, FAUCET_ACCOUNT } from '../src/sdk/sdk';

describe('SDK', () => {
  it('creates and returns an SDK instance', async () => {
    const sdk = await getSdk();
    expect(sdk).toBeTruthy();
    expect(Object.keys(sdk.accounts).length).toBe(1);
    expect(sdk.selectedAddress).toBeTruthy();
  });

  it('returns coins to faucet', async () => {
    const client = await getSdk();
    const ae = await getSdk();

    // ! LOCAL NODE USAGE ONLY
    if (FAUCET_ACCOUNT) {
      await ae.addAccount(FAUCET_ACCOUNT, { select: true });
      await ae.spend(1e26, client.selectedAddress as EncodedData<'ak'>);
    }

    const balance_before = await client.getBalance(
      client.selectedAddress as EncodedData<'ak'>
    );
    const faucet_balance_before = await ae.getBalance(
      ae.selectedAddress as EncodedData<'ak'>
    );
    expect(BigInt(balance_before)).toBeGreaterThan(0);

    await returnCoinsToFaucet(client);
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
  });
});
