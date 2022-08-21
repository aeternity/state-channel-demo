import {
  Channel,
  encodeContractAddress,
  MemoryAccount,
  unpackTx,
} from '@aeternity/aepp-sdk';
import contractSource from '@aeternity/rock-paper-scissors';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import { BigNumber } from 'bignumber.js';
import { nextTick, toRaw } from 'vue';
import {
  decodeCallData,
  initSdk,
  keypair,
  returnCoinsToFaucet,
  sdk,
  verifyContractBytecode,
} from '../sdk-service/sdk-service';
import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import SHA from 'sha.js';
import { useTransactionsStore } from '../../stores/transactions';
import { TransactionLog } from '../../components/transaction/transaction.vue';
import { resetApp } from '../../main';
import { GameRound, Methods, Selections, Update } from './game-channel.types';
import {
  getSavedState,
  StoredState,
  storeGameState,
} from '../local-storage/local-storage';

export class GameChannel {
  channelConfig?: ChannelOptions;
  channelInstance?: Channel;
  channelRound: number | null = null;
  channelId?: string;
  fsmId?: string;
  isOpen = false;
  isOpening = false;
  isFunded = false;
  isClosedByUser = false;
  channelOpenTime = -1;
  channelCloseTime = -1;
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
  gameRound: GameRound = {
    stake: new BigNumber(0),
    index: 1,
    userSelection: Selections.none,
    botSelection: Selections.none,
    isCompleted: false,
  };
  contract?: ContractInstance;
  contractAddress?: Encoded.ContractAddress;
  contractCreationChannelRound?: number;

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

  async initializeChannel(config?: ChannelOptions) {
    this.isOpening = true;
    if (!config) config = await this.fetchChannelConfig();
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

  /**
   * returns true if channel was never shutdown
   * and reconnection was successful.
   * In cases where channel was shutdown, `channel.state()`
   * hangs for a while, therefore we add a timeout
   */
  async checkIfChannelIsEstablished() {
    function timeout(ms: number) {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('timeout succeeded')), ms);
      });
    }
    const statePromise = this.getChannelWithoutProxy().state();

    try {
      await Promise.race([statePromise, timeout(3000)]);
      return true;
    } catch (e) {
      return false;
    }
  }

  async reconnectChannel() {
    if (!this.channelConfig) throw new Error('Channel config is not set');
    this.isOpening = true;
    this.channelInstance = await Channel.reconnect(
      {
        ...this.channelConfig,
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

    const reconnectionWasSuccessful = await this.checkIfChannelIsEstablished();
    if (!reconnectionWasSuccessful) {
      alert(
        'Channel was shutdown and can no longer be opened. App will reset.'
      );
      localStorage.removeItem('gameState');
      return setTimeout(resetApp, 2000);
    }

    this.isFunded = true;
    this.isOpen = true;

    this.registerEvents();
  }

  async closeChannel() {
    if (!this.channelInstance) {
      throw new Error('Channel is not open');
    }
    this.getChannelWithoutProxy()
      .shutdown((tx: Encoded.Transaction) => {
        return this.signTx('channel_close', tx);
      })
      .then(() => {
        this.isClosedByUser = true;
        this.isOpen = false;
        this.channelCloseTime = Date.now();
        localStorage.removeItem('gameState');
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

      // @ts-expect-error ts-mismatch
      void this.buildContract(unpackTx(tx).tx.round, update.owner).then(() =>
        this.logContractDeployment(tx)
      );
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

  registerEvents() {
    if (this.channelInstance) {
      this.getChannelWithoutProxy().on('statusChanged', (status) => {
        if (status === 'disconnected') {
          returnCoinsToFaucet();
        }
        if (status === 'open') {
          this.isOpen = true;
          this.isOpening = false;

          if (!this.channelId)
            this.channelId = this.getChannelWithoutProxy().id();
          if (!this.fsmId) this.fsmId = this.getChannelWithoutProxy().fsmId();
          this.updateBalances();
        }
      });

      this.getChannelWithoutProxy().on('stateChanged', () => {
        this.channelRound = this.getChannelWithoutProxy().round();
        if (this.isOpen) this.saveStateToLocalStorage();
        if (
          this.gameRound.botSelection != Selections.none &&
          !this.gameRound.hasRevealed
        ) {
          this.gameRound.hasRevealed = true;
          nextTick(() => this.revealRoundResult());
        }
      });
      this.getChannelWithoutProxy().on('message', (message) => {
        const msg = JSON.parse(message.info);
        this.handleMessage(msg);
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
    await this.contract.compile();
    this.contractAddress = encodeContractAddress(
      owner,
      contractCreationChannelRound
    );
  }

  logContractDeployment(tx: Encoded.Transaction) {
    const transactionLog: TransactionLog = {
      id: tx,
      description: 'Deploy contract',
      signed: true,
      onChain: false,
      timestamp: Date.now(),
    };
    useTransactionsStore().addUserTransaction(transactionLog, 0);
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
      this.gameRound.index
    );
  }

  async getRoundContractCall(caller: Encoded.AccountAddress, round: number) {
    if (!this.channelConfig) throw new Error('No channel configuration');
    if (!this.contract) throw new Error('Contract is not set');
    if (!this.contractAddress) throw new Error('Contract address is not set');

    return await this.getChannelWithoutProxy().getContractCall({
      caller: caller,
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

    const currentRound = this?.getChannelWithoutProxy().round();

    if (!this.channelConfig) throw new Error('No channel configuration');
    if (!currentRound) throw new Error('No current round');
    if (!this.contract) throw new Error('Contract is not set');

    const result = await this.getRoundContractCall(
      this.channelConfig.responderId,
      currentRound
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
    this.saveStateToLocalStorage();
    await this.updateBalances();
  }

  startNewRound() {
    this.gameRound.index++;
    this.gameRound.userSelection = Selections.none;
    this.gameRound.botSelection = Selections.none;
    this.gameRound.isCompleted = false;
    this.gameRound.hasRevealed = false;
    this.gameRound.winner = undefined;
    this.saveStateToLocalStorage();
  }

  private handleMessage(message: { type: string; data: TransactionLog }) {
    if (message.type === 'add_bot_transaction_log') {
      const txLog = message.data as TransactionLog;
      const round =
        txLog.onChain || txLog.description === 'Deploy contract'
          ? 0
          : this.gameRound.index;
      useTransactionsStore().addBotTransaction(txLog, round);
    }
  }

  saveStateToLocalStorage() {
    if (!this.channelConfig || !this.contractCreationChannelRound) return;
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
        userTransactions: useTransactionsStore().userTransactions,
        botTransactions: useTransactionsStore().botTransactions,
      },
      contractCreationChannelRound: this.contractCreationChannelRound,
    };
    storeGameState(stateToSave);
  }

  async restoreGameState() {
    const savedState = getSavedState();
    if (!savedState) return;
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
  }
}
