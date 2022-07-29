import { buildContractId, Channel, unpackTx } from '@aeternity/aepp-sdk';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import contractSource from '@aeternity/rock-paper-scissors';
import BigNumber from 'bignumber.js';
import botService from '../../src/services/bot';
import {
  CONTRACT_CONFIGURATION,
  Moves,
  RockPaperScissorsContract,
} from '../../src/services/contract';
import {
  CONTRACT_NAME,
  Methods,
} from '../../src/services/contract/contract.constants';
import { Update } from '../../src/services/sdk';
import { FAUCET_PUBLIC_ADDRESS } from '../../src/services/sdk/sdk.constants';
import {
  createHash,
  getSdk,
  pollForRound,
  timeout,
  waitForChannelReady,
} from '../utils';

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
      sign: (_tag: string, tx: Encoded.Transaction, options) => {
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
    await waitForChannelReady(playerChannel, [
      'closed',
      'died',
      'disconnected',
    ]);
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
      sign: (_tag: string, tx: Encoded.Transaction) => playerSdk.signTransaction(tx),
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

  it('bot makes a random pick, player reveals and the game is complete', async () => {
    const playerSdk = await getSdk();

    // The responder needs a contract instance in order to call contract
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

    // we need the contract creation round in order
    // to fetch the contract address deployed by
    // the initiator
    let contractCreationRound = '-1';

    const playerChannel = await Channel.initialize({
      ...responderConfig,
      role: 'responder',
      // @ts-expect-error
      sign: async (
        _tag: string,
        tx: Encoded.Transaction,
        options: {
          updates: Update[];
        },
      ) => {
        if (options?.updates[0]?.op === 'OffChainNewContract') {
          // @ts-expect-error
          contractCreationRound = unpackTx(tx).tx.round as string;
        }
        return playerSdk.signTransaction(tx);
      },
    });

    // wait for channel to be opened
    await waitForChannelReady(playerChannel);
    expect(playerChannel.status()).toBe('open');

    // wait for contract to be deployed
    await timeout(4000);

    // build contract address
    const contractAddress = buildContractId(
      responderConfig.initiatorId,
      parseInt(contractCreationRound, 10),
    );

    // arguments for contract's `provide_hash` method
    const hashKey = 'Aeternity';
    const pick = Moves.paper;
    const dummyHash = await createHash(pick, hashKey);

    const callData = contract.calldata.encode(
      CONTRACT_NAME,
      Methods.provide_hash,
      [dummyHash],
    );

    await playerChannel.callContract(
      {
        amount: responderConfig.gameStake,
        contract: contractAddress,
        abiVersion: CONTRACT_CONFIGURATION.abiVersion,
        callData,
      },
      async (tx) => playerSdk.signTransaction(tx),
    );

    // wait for the next round
    await pollForRound(playerChannel.round() + 1, playerChannel);
    const nextRound = playerChannel.round() + 1;
    await playerChannel.callContract(
      {
        amount: 0,
        contract: contractAddress,
        abiVersion: CONTRACT_CONFIGURATION.abiVersion,
        callData: contract.calldata.encode(CONTRACT_NAME, Methods.reveal, [
          hashKey,
          pick,
        ]),
      },
      async (tx) => playerSdk.signTransaction(tx),
    );

    await pollForRound(nextRound, playerChannel);

    const result = await playerChannel.getContractCall({
      caller: responderConfig.responderId,
      contract: contractAddress,
      round: playerChannel.round(),
    });

    const winner = contract.calldata.decode(
      CONTRACT_NAME,
      Methods.reveal,
      result.returnValue,
    );
    const balances = await Promise.all([
      playerChannel.balances([responderId, responderConfig.initiatorId]),
    ]);

    const playerBalance = new BigNumber(balances[0][responderId]);
    const botBalance = new BigNumber(balances[0][responderConfig.initiatorId]);

    if (winner === responderId) {
      // player wins
      expect(playerBalance.gt(botBalance)).toBe(true);
    } else if (winner === responderConfig.initiatorId) {
      // bot wins
      expect(playerBalance.lt(botBalance)).toBe(true);
    } else {
      // draw
      expect(botBalance.eq(playerBalance));
    }

    await playerChannel.leave();
    await timeout(1500);
  });
});
