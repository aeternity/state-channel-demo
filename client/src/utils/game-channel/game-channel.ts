import { NODE_URL } from '../sdk-service/sdk-service';
import {
  buildTxHash,
  Channel,
  encodeContractAddress,
  MemoryAccount,
  poll,
  unpackTx,
} from '@aeternity/aepp-sdk';
import contractSource from '@aeternity/rock-paper-scissors';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import { BigNumber } from 'bignumber.js';
import {
  keypair,
  node,
  refreshSdkAccount,
  returnCoinsToFaucet,
  sdk,
  verifyContractBytecode,
} from '../sdk-service/sdk-service';
import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import SHA from 'sha.js';
import {
  TransactionLogGroup,
  useTransactionsStore,
} from '../../stores/transactions';
import { TransactionLog } from '../../components/transaction/transaction.vue';
import { resetApp } from '../../main';
import {
  ContractEvents,
  GameRound,
  Methods,
  Selections,
  SignatureType,
  Update,
} from './game-channel.types';
import {
  getSavedState,
  StoredState,
  storeGameState,
} from '../local-storage/local-storage';
import contractBytecode from '../contract-bytecode/contract-bytecode';

function timeout(ms: number) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('timeout succeeded')), ms);
  });
}

let channel: Channel;

export class GameChannel {
  channelConfig?: ChannelOptions;
  channelRound?: number;
  channelId?: string;
  fsmId?: string;
  isOpen = false;
  isOpening = false;
  isFunded = false;
  shouldShowEndScreen = false;
  timerStartTime = -1;
  lastOffChainTxTime = -1;
  channelIsClosing = false;
  savedResultsOnChainTxHash?: Encoded.TxHash;
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
  autoplay: {
    enabled: boolean;
    rounds: number;
    extraRounds: number; // extra rounds to play when continuing autoplay
    elapsedTime: number; // time elapsed while autoplay is playing
  } = {
    enabled: false,
    rounds: 10,
    extraRounds: 10,
    elapsedTime: 0,
  };
  gameRound: GameRound = {
    stake: new BigNumber(0),
    index: 1,
    userSelection: Selections.none,
    botSelection: Selections.none,
    isCompleted: false,
    shouldHandleBotAction: false,
    userInAction: false,
  };
  contract?: ContractInstance;
  contractAddress?: Encoded.ContractAddress;
  contractCreationChannelRound?: number;

  getStatus() {
    return channel.status();
  }

  getSelectionHash(selection: Selections): string {
    this.gameRound.hashKey = Math.random().toString(16).substring(2, 8);
    return SHA('sha256')
      .update(this.gameRound.hashKey + selection)
      .digest('hex');
  }

  getUserSelection() {
    return this.gameRound.userSelection;
  }

  async setUserSelection(selection: Selections) {
    if (selection === Selections.none) {
      throw new Error('Selection should not be none');
    }

    this.gameRound.userInAction = true;
    this.saveStateToLocalStorage();

    const result = await this.callContract(Methods.provide_hash, [
      this.getSelectionHash(selection),
    ]);
    if (result?.accepted) this.gameRound.userSelection = selection;
    else {
      console.error(result);
      throw new Error('Selection was not accepted');
    }
  }

  setBotSelection(selection: Selections) {
    this.gameRound.botSelection = selection;
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
    this.gameRound.stake = new BigNumber(data.gameStake);
    if (res.status != 200) {
      if (data.error.includes('greylisted')) {
        console.log('Greylisted account, retrying with new account');
        await refreshSdkAccount();
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

  async initializeChannel(config?: ChannelOptions) {
    this.isOpening = true;
    if (!config) config = await this.fetchChannelConfig();
    this.channelConfig = config;
    this.isFunded = true;
    channel = await Channel.initialize({
      ...this.channelConfig,
      debug: true,
      role: 'responder',
      // @ts-expect-error ts-mismatch
      sign: this.signTx.bind(this),
      url:
        import.meta.env.VITE_NODE_ENV == 'development'
          ? import.meta.env.VITE_WS_URL
          : this.channelConfig.url,
    });
    this.timerStartTime = Date.now();
    this.registerEvents();
  }

  async checkifChannelIsStillOpen() {
    const response = await fetch(`${NODE_URL}/v3/channels/${this.channelId}`);
    const result = await response.json();
    return !!result.id;
  }

  async reconnectChannel() {
    if (!this.channelConfig) throw new Error('Channel config is not set');
    this.isOpening = true;

    if (!(await this.checkifChannelIsStillOpen())) {
      localStorage.removeItem('gameState');
      alert(
        'Channel was shutdown and can no longer be opened. App will reset.'
      );
      return resetApp();
    }

    channel = await Channel.reconnect(
      {
        ...this.channelConfig,
        debug: true,
        role: 'responder',
        // @ts-expect-error ts-mismatch
        sign: this.signTx.bind(this),
      },
      {
        channelId: this.channelConfig.existingChannelId,
        role: 'responder',
        pubkey: this.channelConfig?.responderId,
        round: this.channelRound,
      }
    );

    this.isFunded = true;
    this.isOpen = true;

    this.registerEvents();
  }

  async closeChannel() {
    localStorage.clear();
    if (!channel) {
      throw new Error('Channel is not open');
    }

    const channelClosing = new Promise((resolve) => {
      if (
        !this.contractAddress ||
        !this.isOpen ||
        !this.isFunded ||
        this.gameRound.userInAction ||
        this.channelIsClosing
      ) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    await channelClosing.then(async (canClose) => {
      if (!canClose) return;
      this.channelIsClosing = true;
      await channel
        .shutdown((tx: Encoded.Transaction) => this.signTx('channel_close', tx))
        .then(async () => {
          this.savedResultsOnChainTxHash = await returnCoinsToFaucet(
            this.getMessageToSaveOnChain()
          );
          this.shouldShowEndScreen = true;
          this.isOpen = false;
        });
    });
    return channelClosing;
  }

  async signTx(
    tag: string,
    tx: Encoded.Transaction,
    options?: {
      updates: Update[];
    }
  ): Promise<Encoded.Transaction> {
    const update = options?.updates?.[0];
    const txHash = buildTxHash(tx);

    // if we are signing the open channel tx
    if (tag === 'responder_sign') {
      const transactionLog: TransactionLog = {
        id: txHash,
        description: 'Open state channel',
        signed: SignatureType.confirmed,
        onChain: true,
        timestamp: Date.now(),
      };
      useTransactionsStore().addUserTransaction(transactionLog, 0);
    }

    // if we are signing the close channel tx
    if (tag === 'channel_close') {
      const transactionLog: TransactionLog = {
        id: txHash,
        description: 'Close state channel',
        signed: SignatureType.proposed,
        onChain: true,
        timestamp: Date.now(),
      };
      useTransactionsStore().addUserTransaction(transactionLog, 0);
    }

    // if we are signing a transaction that updates the contract
    if (update?.op === 'OffChainNewContract' && update?.code && update?.owner) {
      const proposedBytecode = update.code;
      let isContractValid = false;
      try {
        isContractValid = await verifyContractBytecode(proposedBytecode);
      } catch (e) {
        console.warn('Compiler threw an error on verification', e);
      }
      if (!update.owner) throw new Error('Owner is not set');
      if (!isContractValid) throw new Error('Contract is not valid');

      // @ts-expect-error ts-mismatch
      void this.buildContract(unpackTx(tx).tx.round, update.owner).then(() => {
        this.logContractDeployment(txHash);
        this.saveStateToLocalStorage();
      });
    }

    // for both user and bot calls to the contract
    if (update?.op === 'OffChainCallContract') {
      this.lastOffChainTxTime = Date.now();
      // if we are signing a bot transaction that calls the contract
      if (update?.caller_id !== sdk.selectedAddress) {
        this.gameRound.shouldHandleBotAction = true;
      }
    }

    return sdk.signTransaction(tx);
  }

  registerEvents() {
    if (channel) {
      channel.on('statusChanged', (status) => {
        if (status === 'open') {
          this.isOpen = true;
          this.isOpening = false;

          if (!this.channelId) this.channelId = channel.id();
          if (!this.fsmId) this.fsmId = channel.fsmId();
          this.updateBalances();
        }

        if (status === 'closed' || status === 'died') {
          alert(
            'Node triggered a timeout and the channel has died. App will reset.'
          );
          resetApp();
        }
      });

      channel.on('stateChanged', (tx: Encoded.Transaction) => {
        this.channelRound = channel.round() ?? undefined;
        if (this.isOpen) this.saveStateToLocalStorage();

        if (this.gameRound.shouldHandleBotAction) {
          this.gameRound.shouldHandleBotAction = false;
          this.handleOpponentCall(tx);
        }
      });
      channel.on('message', (message) => {
        const msg = JSON.parse(message.info);
        this.handleMessage(msg);
      });
      channel.on('onChainTx', async (onChainTx) => {
        const onChainTxhash = buildTxHash(onChainTx);
        const polledTx = await poll(onChainTxhash, {
          onNode: node,
        });
        // @ts-expect-error ts-mismatch
        if (polledTx.tx.type === 'ChannelCreateTx') {
          useTransactionsStore().updateOpenChannelTransactions(onChainTxhash);
        }
      });
    }
  }

  async buildContract(
    contractCreationChannelRound: number,
    owner: Encoded.AccountAddress
  ) {
    this.contractCreationChannelRound = contractCreationChannelRound;
    this.contract = await sdk.getContractInstance({
      source: contractSource,
    });
    this.contract.bytecode = contractBytecode;
    this.contractAddress = encodeContractAddress(
      owner,
      contractCreationChannelRound
    );
  }

  logContractDeployment(th: Encoded.TxHash) {
    const transactionLog: TransactionLog = {
      id: th,
      description: 'Deploy contract',
      signed: SignatureType.confirmed,
      onChain: false,
      timestamp: Date.now(),
    };
    useTransactionsStore().addUserTransaction(transactionLog, 0);

    // if autoplay is enabled, make user selection automatically
    if (this.autoplay.enabled) {
      this.setUserSelection(this.getRandomSelection());
    }
  }

  async callContract(
    method: Methods,
    params: unknown[],
    amount?: number | BigNumber
  ) {
    if (!channel) {
      throw new Error('Channel is not open');
    }
    if (!this.contract || !this.contractAddress) {
      throw new Error('Contract is not set');
    }
    const result = await channel.callContract(
      {
        amount: amount ?? this.gameRound.stake,
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

    const value =
      typeof params === 'string' ? params : (params.at(-1) as string);

    this.logCallUpdate(result.signedTx, {
      name: method,
      value,
      type: 'method',
    });
    return result;
  }

  async updateBalances() {
    if (!this.channelConfig) {
      throw new Error('Channel config is not set');
    }
    const { initiatorId, responderId } = this.channelConfig;
    const balances = await channel.balances([initiatorId, responderId]);
    this.balances.user = new BigNumber(balances[responderId]);
    this.balances.bot = new BigNumber(balances[initiatorId]);
  }

  async getLastEventsDecoded() {
    if (!this.contract) throw new Error('Contract is not set');
    const result = await this.fetchLastContractCall();
    return this.contract.decodeEvents(result.log);
  }

  async handleOpponentCall(tx: Encoded.Transaction) {
    if (!this.channelConfig?.responderId)
      throw new Error('Responder id is not defined');
    if (!this.channelRound) throw new Error('Channel round is undefined');
    const decodedEvents = await this.getLastEventsDecoded();
    this.logCallUpdate(tx, {
      name: decodedEvents[0].name as ContractEvents,
      value: (decodedEvents[0].args as string[])[0],
      type: 'event',
    });

    switch (decodedEvents[0].name) {
      case ContractEvents.player1Moved:
        this.setBotSelection(
          (decodedEvents[0].args as string[])[0] as Selections
        );
        this.gameRound.hasRevealed = true;
        this.saveStateToLocalStorage();
        this.revealRoundResult();
        break;
      default:
        return;
    }
  }

  async logCallUpdate(
    tx: Encoded.Transaction,
    information: {
      name: Methods | ContractEvents;
      value: string;
      type: 'method' | 'event';
    }
  ) {
    const th = buildTxHash(tx);
    const transactionLog: TransactionLog = {
      id: th,
      description: ``,
      signed: SignatureType.proposed,
      onChain: false,
      timestamp: Date.now(),
    };
    if (information.type === 'method') {
      transactionLog.description = `User called ${information.name}()`;
      switch (information.name) {
        case Methods.provide_hash:
          transactionLog.description = `User hashed his selection`;
          break;
        case Methods.reveal:
          transactionLog.description = `User revealed his selection: ${information.value}`;
          break;
      }
    } else if (information.name === ContractEvents.player1Moved) {
      transactionLog.signed = SignatureType.confirmed;
      transactionLog.description = `Bot selected ${information.value}`;
    }
    useTransactionsStore().addUserTransaction(
      transactionLog,
      this.gameRound.index
    );
  }

  async getRoundContractCall(caller: Encoded.AccountAddress, round: number) {
    if (!this.contract) throw new Error('Contract is not set');
    if (!this.contractAddress) throw new Error('Contract address is not set');

    return await channel.getContractCall({
      caller,
      contract: this.contractAddress,
      round,
    });
  }

  async revealRoundResult() {
    await this.callContract(
      Methods.reveal,
      [this.gameRound.hashKey, this.gameRound.userSelection],
      0 // reveal method is not payable, so we use 0
    );
    return this.handleRoundResult();
  }

  async handleRoundResult() {
    if (!this.channelConfig)
      throw new Error('Channel Configuration is undefined');
    if (!this.channelRound) throw new Error('No current round');
    if (!this.contract) throw new Error('Contract is not set');

    const result = await this.getRoundContractCall(
      this.channelConfig.responderId,
      this.channelRound
    );

    const winner = this.contract.calldata.decode(
      'RockPaperScissors',
      Methods.reveal,
      result.returnValue
    );

    return this.finishGameRound(winner);
  }

  async finishGameRound(winner?: Encoded.AccountAddress) {
    this.gameRound.winner = winner;
    this.gameRound.isCompleted = true;
    this.gameRound.userInAction = false;
    this.saveStateToLocalStorage();
    await this.updateBalances();

    if (this.gameRound.index % 50 === 0) {
      await channel.cleanContractCalls();
    }

    // if autoplay is enabled
    if (this.autoplay.enabled) {
      // if not last round, start next round
      if (this.gameRound.index < this.autoplay.rounds) this.startNewRound();
      // otherwise, show results
      else {
        this.autoplay.elapsedTime +=
          this.lastOffChainTxTime - this.timerStartTime;
        this.shouldShowEndScreen = true;
      }
    }
  }

  startNewRound() {
    this.gameRound.index++;
    this.gameRound.userSelection = Selections.none;
    this.gameRound.botSelection = Selections.none;
    this.gameRound.shouldHandleBotAction = false;
    this.gameRound.isCompleted = false;
    this.gameRound.hasRevealed = false;
    this.gameRound.winner = undefined;

    // if autoplay is enabled, make user selection automatically
    if (this.autoplay.enabled && this.gameRound.index <= this.autoplay.rounds) {
      this.setUserSelection(this.getRandomSelection());
    }
  }

  continueAutoplay() {
    this.autoplay.rounds += this.autoplay.extraRounds;
    this.shouldShowEndScreen = false;
    this.timerStartTime = Date.now();
    this.startNewRound();
  }

  private handleMessage(message: { type: string; data: TransactionLog }) {
    if (message.type === 'add_bot_transaction_log') {
      const txStore = useTransactionsStore();
      const txLog = message.data as TransactionLog;
      let round =
        txLog.onChain || txLog.description === 'Deploy contract'
          ? 0
          : this.gameRound.index;

      if (round > 1 && txStore.botTransactions[round - 1].length === 2) round--;
      txStore.addBotTransaction(txLog, round);
    }
  }

  getMessageToSaveOnChain() {
    if (!this.channelConfig) throw new Error('Channel config is not set');

    const initialBalance = this.channelConfig?.responderAmount as BigNumber;
    const balance = this.balances.user as BigNumber;
    const earnings = balance.minus(initialBalance);

    const data = {
      rounds: this.gameRound.index,
      isLastRoundCompleted: this.gameRound.isCompleted,
      elapsedTime: this.autoplay.elapsedTime,
      earnings: earnings,
      responderId: this.channelConfig.responderId,
    };

    const message = JSON.stringify(data);
    return message;
  }

  saveStateToLocalStorage() {
    if (
      !this.channelConfig ||
      !this.contractCreationChannelRound ||
      this.autoplay.enabled
    )
      return;
    const stateToSave: StoredState = {
      keypair: getSavedState()?.keypair || keypair,
      channelId: this.channelId as Encoded.Channel,
      fsmId: this.fsmId,
      channelConfig: {
        ...this.channelConfig,
        existingChannelId: this.channelId,
        existingFsmId: this.fsmId,
      },
      channelRound: this.channelRound,
      gameRound: { ...this.gameRound },
      transactionLogs: {
        userTransactions: this.getTrimmedTransactions(
          useTransactionsStore().userTransactions
        ),
        botTransactions: this.getTrimmedTransactions(
          useTransactionsStore().botTransactions
        ),
      },
      contractCreationChannelRound: this.contractCreationChannelRound,
    };
    storeGameState(stateToSave);
  }

  getTrimmedTransactions(logs: TransactionLogGroup): TransactionLogGroup {
    if (Object.keys(logs).length <= 6) return logs;

    const trimmedLogs = Object.assign({}, logs);
    for (const key of Object.keys(trimmedLogs)) {
      if (!(parseInt(key) === 0 || Object.keys(logs).slice(-5).includes(key))) {
        delete trimmedLogs[parseInt(key)];
      }
    }
    return trimmedLogs;
  }

  /**
   * ! Workaround.
   * If no caller is provided, responder is used.
   * If it hangs, we retry once more with the initiator.
   * the channel.getContractCall() method may result in a hanging
   * promise, without rejecting. Therefore we consider it rejected on a timeout.
   */
  // @ts-expect-error timeout typing
  async fetchLastContractCall(caller?: Encoded.AccountAddress) {
    if (!this.channelConfig)
      throw new Error('Channel configuration is undefined');

    if (!this.channelRound) throw new Error('Channel round is undefined');
    if (!caller) caller = this.channelConfig?.responderId;
    try {
      const promise = this.getRoundContractCall(caller, this.channelRound);
      return await Promise.race([promise, timeout(1000)]);
    } catch (e) {
      if (caller === this.channelConfig?.responderId)
        return this.fetchLastContractCall(this.channelConfig?.initiatorId);
      throw e;
    }
  }

  async restoreGameState() {
    const savedState = getSavedState();
    if (!savedState) return;
    if (savedState?.gameRound.userInAction) return localStorage.clear();
    await sdk.addAccount(new MemoryAccount({ keypair: savedState.keypair }), {
      select: true,
    });
    this.channelId = savedState.channelId;
    this.channelRound = savedState.channelRound;
    this.fsmId = savedState.fsmId;
    this.gameRound = savedState.gameRound;
    this.gameRound.stake = new BigNumber(savedState.gameRound.stake);
    useTransactionsStore().setUserTransactions(
      savedState.transactionLogs.userTransactions
    );
    useTransactionsStore().setBotTransactions(
      savedState.transactionLogs.botTransactions
    );
    this.channelConfig = savedState.channelConfig;
    await this.reconnectChannel();
    await this.buildContract(
      savedState.contractCreationChannelRound,
      savedState.channelConfig?.initiatorId
    );
    await this.updateBalances();

    if (savedState.gameRound.userSelection === Selections.none) return;
    try {
      const lastContractCall = await this.fetchLastContractCall();
      const decodedCall = this.contract?.decodeEvents(lastContractCall.log);

      if (decodedCall?.[0].name === ContractEvents.player1Moved)
        return this.revealRoundResult();

      if (
        decodedCall?.[1].name === ContractEvents.player0Revealed &&
        !savedState.gameRound.isCompleted
      ) {
        return this.handleRoundResult();
      }
    } catch (e) {
      alert(
        'Error while trying to get the last contract call. App will reset.'
      );
      resetApp();
    }
  }

  private getRandomSelection(): Selections {
    const randomSelection = Math.floor(Math.random() * 3);
    return Object.values(Selections)[randomSelection];
  }
}
