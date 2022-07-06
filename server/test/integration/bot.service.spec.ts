import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import { Channel, generateKeyPair } from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';
import { FAUCET_PUBLIC_ADDRESS } from '../../src/services/sdk/sdk.service.constants';
import botService from '../../src/services/bot';
import { getSdk } from '../../src/services/sdk/sdk.service';
import { timeout } from '../utils';

describe('botService', () => {
  jest.setTimeout(30000);

  it('should be defined', () => {
    expect(botService).toBeDefined();
  });

  it('generates game session with 2 open channels', async () => {
    const playerSdk = await getSdk(generateKeyPair());
    const responderId = await playerSdk.address();

    const responderConfig = await botService.generateGameSession(
      responderId,
      'localhost',
      3001,
    );

    const playerChannel = await Channel.initialize({
      ...responderConfig,
      role: 'responder',
      sign: (_tag: string, tx: EncodedData<'tx'>) => playerSdk.signTransaction(tx),
    });
    expect(playerChannel.status()).toBe('connected');
    await playerChannel.shutdown(playerSdk.signTransaction.bind(playerSdk));
  });

  it('bot service returns its balance back to the faucet', async () => {
    const playerSdk = await getSdk(generateKeyPair());
    const responderId = await playerSdk.address();
    const responderConfig = await botService.generateGameSession(
      responderId,
      'localhost',
      3001,
    );

    const initiatorFundedBalance = await playerSdk.getBalance(
      responderConfig.initiatorId,
    );
    const faucetBalance = await playerSdk.getBalance(FAUCET_PUBLIC_ADDRESS);

    const playerChannel = await Channel.initialize({
      ...responderConfig,
      role: 'responder',
      sign: (_tag: string, tx: EncodedData<'tx'>) => playerSdk.signTransaction(tx),
    });
    await playerChannel.shutdown(playerSdk.signTransaction.bind(playerSdk));
    await timeout(1000);

    const initiatorNewBalance = await playerSdk.getBalance(
      responderConfig.initiatorId,
    );
    const faucetNewBalance = new BigNumber(
      await playerSdk.getBalance(FAUCET_PUBLIC_ADDRESS),
    );

    expect(faucetNewBalance.isGreaterThan(faucetBalance)).toBe(true);
    expect(initiatorFundedBalance !== initiatorNewBalance).toBe(true);
    expect(initiatorNewBalance).toBe('0');
  });
});