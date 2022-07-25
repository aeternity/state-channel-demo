import {
  buildContractId, Channel, unpackTx, sha256hash,
} from '@aeternity/aepp-sdk';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import contractSource from '@aeternity/rock-paper-scissors';
import BigNumber from 'bignumber.js';
import botService from '../../src/services/bot';
import { CONTRACT_CONFIGURATION, Moves, RockPaperScissorsContract } from '../../src/services/contract';
import { FAUCET_PUBLIC_ADDRESS } from '../../src/services/sdk/sdk.constants';
import {
  getSdk, timeout, waitForChannelReady,
} from '../utils';

const createHash = (move:Moves, key:string) => sha256hash(move + key);

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
    void playerChannel.shutdown(playerSdk.signTransaction.bind(playerSdk));
    await waitForChannelReady(playerChannel, ['closed', 'died', 'disconnected']);
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

  it('bot services makes a random pick when user has picked', async () => {
    const playerSdk = await getSdk();
    const contract = (await playerSdk.getContractInstance({
      source: contractSource,
    })) as RockPaperScissorsContract;
    await contract.compile();

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

    const dummyHash = createHash(Moves.paper, 'eternity');

    const callData = contract.calldata.encode(
      'RockPaperScissors',
      'provide_hash',
      [dummyHash],
    );

    console.log('To play');
    const res = await playerChannel.callContract(
      {
        amount: responderConfig.gameStake,
        contract: contractAddress,
        abiVersion: CONTRACT_CONFIGURATION.abiVersion,
        callData,
      },
      async (tx) => playerSdk.signTransaction(tx),
    );
  });
});
