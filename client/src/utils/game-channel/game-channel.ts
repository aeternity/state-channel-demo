import { Channel, encodeContractAddress, unpackTx } from '@aeternity/aepp-sdk';
import contractSource from '@aeternity/rock-paper-scissors';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import { BigNumber } from 'bignumber.js';
import { nextTick, toRaw } from 'vue';
import {
  decodeCallData,
  initSdk,
  returnCoinsToFaucet,
  sdk,
  verifyContractBytecode,
} from '../sdk-service/sdk-service';
import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import SHA from 'sha.js';
import { useTransactionsStore } from '../../stores/transactions';
import { TransactionLog } from '../../components/transaction/transaction.vue';

interface Update {
  call_data: Encoded.ContractBytearray;
  contract_id: Encoded.ContractAddress;
  op: 'OffChainCallContract' | 'OffChainNewContract';
  code?: Encoded.ContractBytearray;
  owner?: Encoded.AccountAddress;
  caller_id?: Encoded.AccountAddress;
}

enum Methods {
  init = 'init',
  provide_hash = 'provide_hash',
  get_state = 'get_state',
  player1_move = 'player1_move',
  reveal = 'reveal',
  player1_dispute_no_reveal = 'player1_dispute_no_reveal',
  player0_dispute_no_move = 'player0_dispute_no_move',
  set_timestamp = 'set_timestamp',
}

export enum Selections {
  rock = 'rock',
  paper = 'paper',
  scissors = 'scissors',
  none = 'none',
}

export class GameChannel {
  channelConfig?: ChannelOptions;
  channelInstance?: Channel;
  isOpen = false;
  isFunded = false;
  shouldShowEndScreen = false;
  channelOpenTime = -1;
  channelCloseTime = -1;
  channelIsClosing = false;
  error?: {
    status: number;
    statusText: string;
    message: string;
  };
  balances: {
    user?: BigNumber;
    bot?: BigNumber;
  } = {
    user: undefined,
    bot: undefined,
  };
  game: {
    autoplay: {
      enabled: boolean;
      rounds: number;
      extraRounds: number; // extra rounds to play when continuing autoplay
    };
    stake?: BigNumber;
    round: {
      index: number;
      hashKey?: string;
      userSelection?: Selections;
      botSelection?: Selections;
      winner?: Encoded.AccountAddress;
      isCompleted?: boolean;
      hasRevealed?: boolean;
    };
  } = {
    autoplay: {
      enabled: false,
      rounds: 10,
      extraRounds: 10,
    },
    round: {
      index: 1,
      userSelection: Selections.none,
      botSelection: Selections.none,
      isCompleted: false,
    },
  };
  contract?: ContractInstance;
  contractAddress?: Encoded.ContractAddress;

  // since gameChannel is reactive, we need to get the raw channel instance
  getChannelWithoutProxy() {
    if (!this.channelInstance) {
      throw new Error('Channel is not initialized');
    }
    return toRaw(this.channelInstance);
  }

  getStatus() {
    return this.getChannelWithoutProxy().status();
  }

  getSelectionHash(selection: Selections): string {
    this.game.round.hashKey = Math.random().toString(16).substring(2, 8);
    return SHA('sha256')
      .update(this.game.round.hashKey + selection)
      .digest('hex');
  }

  getUserSelection() {
    return this.game.round.userSelection;
  }

  async setUserSelection(selection: Selections) {
    if (selection === Selections.none) {
      throw new Error('Selection should not be none');
    }

    const result = await this.callContract(Methods.provide_hash, [
      this.getSelectionHash(selection),
    ]);
    if (result?.accepted) this.game.round.userSelection = selection;
    else {
      console.error(result);
      throw new Error('Selection was not accepted');
    }
  }

  setBotSelection(selection: Selections) {
    this.game.round.botSelection = selection;
  }

  async fetchChannelConfig(): Promise<ChannelOptions> {
    if (!sdk) throw new Error('SDK is not set');
    const res = await fetch(import.meta.env.VITE_BOT_SERVICE_URL + '/open', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: sdk.selectedAddress,
        port: import.meta.env.VITE_RESPONDER_PORT ?? '3333',
        host: import.meta.env.VITE_RESPONDER_HOST ?? 'localhost',
      }),
    });
    const data = await res.json();
    this.game.stake = new BigNumber(data.gameStake);
    if (res.status != 200) {
      if (data.error.includes('greylisted')) {
        console.log('Greylisted account, retrying with new account');
        initSdk();
        return this.fetchChannelConfig();
      } else
        this.error = {
          status: res.status,
          statusText: res.statusText,
          message: data.error || 'Error while fetching channel config',
        };
      throw new Error(data.error);
    }
    return data as ChannelOptions;
  }

  async initializeChannel() {
    const config = await this.fetchChannelConfig();
    this.channelConfig = config;
    this.isFunded = true;

    // ? Do we start counting before the funding or after?
    this.channelOpenTime = Date.now();
    this.channelInstance = await Channel.initialize({
      ...this.channelConfig,
      role: 'responder',
      // @ts-expect-error ts-mismatch
      sign: this.signTx.bind(this),
      url:
        import.meta.env.VITE_NODE_ENV == 'development'
          ? import.meta.env.VITE_WS_URL
          : this.channelConfig.url,
    });
    this.registerEvents();
  }

  async closeChannel() {
    if (!this.channelInstance) {
      throw new Error('Channel is not open');
    }
    this.channelIsClosing = true;
    await this.getChannelWithoutProxy()
      .shutdown((tx: Encoded.Transaction) => this.signTx('channel_close', tx))
      .then(async () => {
        await returnCoinsToFaucet();
        this.shouldShowEndScreen = true;
        this.isOpen = false;
        this.channelCloseTime = Date.now();
      });
  }

  async signTx(
    tag: string,
    tx: Encoded.Transaction,
    options?: {
      updates: Update[];
    }
  ): Promise<Encoded.Transaction> {
    const update = options?.updates?.[0];

    // if we are signing the open channel tx
    if (tag === 'responder_sign') {
      const transactionLog: TransactionLog = {
        id: tx,
        description: 'Open state channel',
        signed: true,
        onChain: true,
        timestamp: Date.now(),
      };
      useTransactionsStore().addUserTransaction(transactionLog, 0);
    }

    // if we are signing the close channel tx
    if (tag === 'channel_close') {
      const transactionLog: TransactionLog = {
        id: tx,
        description: 'Close state channel',
        signed: true,
        onChain: true,
        timestamp: Date.now(),
      };
      useTransactionsStore().addUserTransaction(transactionLog, 0);
    }

    // if we are signing a transaction that updates the contract
    if (update?.op === 'OffChainNewContract' && update?.code && update?.owner) {
      const proposedBytecode = update.code;
      const isContractValid = await verifyContractBytecode(proposedBytecode);
      if (!update.owner) throw new Error('Owner is not set');
      if (!isContractValid) throw new Error('Contract is not valid');

      void this.buildContract(tx, update.owner);
    }

    // for both user and bot calls to the contract
    if (update?.op === 'OffChainCallContract') {
      await this.logCallUpdate(update.call_data, tx);
      // if we are signing a bot transaction that calls the contract
      if (update?.caller_id !== sdk.selectedAddress) {
        await this.handleOpponentCallUpdate(update);
      }
    }

    return sdk.signTransaction(tx);
  }

  private registerEvents() {
    if (this.channelInstance) {
      this.getChannelWithoutProxy().on('statusChanged', (status) => {
        if (status === 'open') {
          this.isOpen = true;
          this.updateBalances();
        }
      });

      this.getChannelWithoutProxy().on('stateChanged', () => {
        if (
          this.game.round.botSelection != Selections.none &&
          !this.game.round.hasRevealed
        ) {
          this.game.round.hasRevealed = true;
          nextTick(() => this.revealRoundResult());
        }
      });
      this.getChannelWithoutProxy().on('message', (message) => {
        const msg = JSON.parse(message.info);
        this.handleMessage(msg);
      });
    }
  }

  async buildContract(tx: Encoded.Transaction, owner: Encoded.AccountAddress) {
    // @ts-expect-error ts-mismatch
    const contractCreationRound = unpackTx(tx).tx.round;
    this.contract = await sdk.getContractInstance({
      source: contractSource,
    });
    await this.contract.compile();
    this.contractAddress = encodeContractAddress(owner, contractCreationRound);
    const transactionLog: TransactionLog = {
      id: tx,
      description: 'Deploy contract',
      signed: true,
      onChain: false,
      timestamp: Date.now(),
    };
    useTransactionsStore().addUserTransaction(transactionLog, 0);

    // if autoplay is enabled, make user selection automatically
    if (this.game.autoplay.enabled) {
      this.setUserSelection(this.getRandomSelection());
    }
  }

  async callContract(
    method: string,
    params: unknown[],
    amount?: number | BigNumber
  ) {
    if (!this.channelInstance) {
      throw new Error('Channel is not open');
    }
    if (!this.contract || !this.contractAddress) {
      throw new Error('Contract is not set');
    }
    const result = await this.getChannelWithoutProxy().callContract(
      {
        amount: amount ?? this.game.stake,
        callData: this.contract.calldata.encode(
          'RockPaperScissors',
          method,
          params
        ),
        contract: this.contractAddress,
        abiVersion: 3,
      },
      // @ts-expect-error ts-mismatch
      async (
        tx,
        options: {
          updates: Update[];
        }
      ) => {
        return this.signTx(method, tx, options);
      }
    );
    return result;
  }

  async updateBalances() {
    if (!this.channelConfig) {
      throw new Error('Channel config is not set');
    }
    const { initiatorId, responderId } = this.channelConfig;
    const balances = await this.getChannelWithoutProxy().balances([
      initiatorId,
      responderId,
    ]);
    this.balances.user = new BigNumber(balances[responderId]);
    this.balances.bot = new BigNumber(balances[initiatorId]);
  }

  async handleOpponentCallUpdate(update: Update) {
    if (!this.contract) throw new Error('Contract is not set');
    if (!this.contract.bytecode) throw new Error('Contract is not compiled');
    const data = await decodeCallData(update.call_data, this.contract.bytecode);
    switch (data.function) {
      case Methods.player1_move:
        return this.setBotSelection(data.arguments[0].value as Selections);
      default:
        throw new Error(`Unhandled method: ${data.function}`);
    }
  }

  async logCallUpdate(
    callData: Encoded.ContractBytearray,
    tx: Encoded.Transaction
  ) {
    if (!this.contract) throw new Error('Contract is not set');
    if (!this.contract.bytecode) throw new Error('Contract is not compiled');
    const decodedCallData = await decodeCallData(
      callData,
      this.contract.bytecode
    );
    const transactionLog: TransactionLog = {
      id: tx,
      description: `User called ${decodedCallData.function}()`,
      signed: true,
      onChain: false,
      timestamp: Date.now(),
    };
    switch (decodedCallData.function) {
      case Methods.provide_hash:
        transactionLog.description = `User hashed his selection`;
        break;
      case Methods.reveal:
        transactionLog.description = `User revealed his selection: ${decodedCallData.arguments[1].value}`;
        break;
      case Methods.player1_move:
        transactionLog.description = `Bot selected ${decodedCallData.arguments[0].value}`;
        break;
    }
    useTransactionsStore().addUserTransaction(
      transactionLog,
      this.game.round.index
    );
  }

  async revealRoundResult() {
    await this.callContract(
      Methods.reveal,
      [this.game.round.hashKey, this.game.round.userSelection],
      0 // reveal method is not payable, so we use 0
    );

    const currentRound = this?.getChannelWithoutProxy().round();

    if (!this.channelConfig) throw new Error('No channel configuration');
    if (!this.contractAddress) throw new Error('Contract address is not set');
    if (!currentRound) throw new Error('No current round');
    if (!this.contract) throw new Error('Contract is not set');
    if (!this.channelInstance) throw new Error('Channel is not open');

    const result = await this.getChannelWithoutProxy().getContractCall({
      caller: this.channelConfig.responderId,
      contract: this.contractAddress,
      round: currentRound,
    });

    const winner = this.contract.calldata.decode(
      'RockPaperScissors',
      Methods.reveal,
      result.returnValue
    );

    return this.finishGameRound(winner);
  }

  async finishGameRound(winner?: Encoded.AccountAddress) {
    this.game.round.winner = winner;
    this.game.round.isCompleted = true;
    await this.updateBalances();

    // if autoplay is enabled
    if (this.game.autoplay.enabled) {
      // if not last round, start next round
      if (this.game.round.index < this.game.autoplay.rounds)
        this.startNewRound();
      // otherwise, show results
      else {
        this.channelCloseTime = Date.now();
        this.shouldShowEndScreen = true;
      }
    }
  }

  startNewRound() {
    this.game.round.index++;
    this.game.round.userSelection = Selections.none;
    this.game.round.botSelection = Selections.none;
    this.game.round.isCompleted = false;
    this.game.round.hasRevealed = false;
    this.game.round.winner = undefined;

    // if autoplay is enabled, make user selection automatically
    if (
      this.game.autoplay.enabled &&
      this.game.round.index <= this.game.autoplay.rounds
    ) {
      this.setUserSelection(this.getRandomSelection());
    }
  }

  continueAutoplay() {
    this.game.autoplay.rounds += this.game.autoplay.extraRounds;
    this.shouldShowEndScreen = false;
    this.startNewRound();
  }

  private handleMessage(message: { type: string; data: TransactionLog }) {
    if (message.type === 'add_bot_transaction_log') {
      const txLog = message.data as TransactionLog;
      const round =
        txLog.onChain || txLog.description === 'Deploy contract'
          ? 0
          : this.game.round.index;
      useTransactionsStore().addBotTransaction(txLog, round);
    }
  }

  private getRandomSelection(): Selections {
    const randomSelection = Math.floor(Math.random() * 3);
    return Object.values(Selections)[randomSelection];
  }
}
