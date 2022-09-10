import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import { expect, describe, it } from 'vitest';
import { GameChannel } from '../src/utils/game-channel/game-channel';
import {
  initSdk,
  sdk,
  getNewSdk,
  FAUCET_ACCOUNT,
} from '../src/utils/sdk-service/sdk-service';

describe('integration', async () => {
  await initSdk();

  it('creates game channel instance, initializes Channel and returns coins to faucet on channel closing', async () => {
    const gameChannel = new GameChannel();
    await gameChannel.initializeChannel();
    await new Promise((resolve) => setTimeout(resolve, 15000));
    const client = sdk;
    const ae = await getNewSdk();

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
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await gameChannel.closeChannel();
    await new Promise((resolve) => setTimeout(resolve, 5000));
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
  }, 30000);
});
