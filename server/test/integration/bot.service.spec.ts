import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import { buildContractId, Channel, unpackTx } from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';
import { FAUCET_PUBLIC_ADDRESS } from '../../src/services/sdk/sdk.constants';
import botService from '../../src/services/bot';
import { waitForChannelReady, getSdk, timeout } from '../utils';

describe('botService', () => {
  jest.setTimeout(30000);

  it('should be defined', () => {
    expect(botService).toBeDefined();
  });

  it('generates game session with 2 open channels', async () => {
    const playerSdk = await getSdk();
    const responderId = await playerSdk.address();

    const responderConfig = await botService.generateGameSession(
      responderId,
      'localhost',
      3001,
    );

    let contractCreationRound = '-1';
    const playerChannel = await Channel.initialize({
      ...responderConfig,
      role: 'responder',
      sign: (_tag: string, tx: EncodedData<'tx'>, options) => {
        // @ts-expect-error
        if (options?.updates[0]?.op === 'OffChainNewContract') {
          // @ts-expect-error
          contractCreationRound = unpackTx(tx).tx.round as string;
        }
        return playerSdk.signTransaction(tx);
      },
    });

    await waitForChannelReady(playerChannel);
    expect(playerChannel.status()).toBe('open');
    await timeout(4000);
    const contractAddress = buildContractId(
      responderConfig.initiatorId,
      parseInt(contractCreationRound, 10),
    );
    expect(await playerChannel.getContractState(contractAddress)).toBeDefined();
    await playerChannel.shutdown(playerSdk.signTransaction.bind(playerSdk));
    await timeout(4000);
  });

  it('bot service returns its balance back to the faucet', async () => {
    const playerSdk = await getSdk();
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
    await waitForChannelReady(playerChannel);
    await timeout(5000);
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
