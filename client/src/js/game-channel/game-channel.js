import {
  buildTxHash,
  Channel,
  encodeContractAddress,
  MemoryAccount,
  poll,
  unpackTx,
} from '@aeternity/aepp-sdk';
import { BigNumber } from 'bignumber.js';
import SHA from 'sha.js';
import contractSource from '@aeternity/rock-paper-scissors';
import {
  getSavedState,
  storeGameState,
  resetApp,
} from '../local-storage/local-storage';
import {
  keypair,
  node,
  NODE_URL,
  refreshSdkAccount,
  returnCoinsToFaucet,
  sdk,
  verifyContractBytecode,
} from '../sdk-service/sdk-service';
import {
  ContractEvents,
  Methods,
  Selections,
  SignatureTypes,
} from './game-channel.enums';
import {
  transactionLogs,
  addUserTransaction,
  setUserTransactions,
  addBotTransaction,
  setBotTransactions,
  updateOpenChannelTransactions,
} from '../terminal/terminal';
import { DomMiddleware } from './game-channel.middleware';

/**
 * @typedef {import("../../types").GameRound} GameRound
 * @typedef {import("../../types").Update} Update
 * @typedef {import("./game-channel.enums").Selections} Selections
 * @typedef {import("./game-channel.enums").Methods} Methods
 * @typedef {import('@aeternity/aepp-sdk/es/channel/internal').ChannelOptions} ChannelOptions
 * @typedef {import('@aeternity/aepp-sdk/es/utils/encoder').Encoded} Encoded
 * @typedef {import('@aeternity/aepp-sdk/es/channel/internal').Channel} Channel
 */

/**
 * @param {number} ms
 */
function timeout(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('timeout succeeded')), ms);
  });
}

/**
 * @type {Channel}
 */
let channel;

export class GameChannel {
  /**
   * @type {ChannelOptions}
   */
  channelConfig = {};
  channelRound = 0;
  channelId = null;
  fsmId = null;
  isOpen = false;
  isOpening = false;
  isFunded = false;
  shouldShowEndScreen = false;
  timerStartTime = -1;
  lastOffChainTxTime = -1;
  channelIsClosing = false;
  savedResultsOnChainTxHash = null;
  hasInsuffientBalance = false;
  error = null;
  balances = {
    user: undefined,
    bot: undefined,
  };
  autoplay = {
    enabled: false,
    rounds: 10,
    extraRounds: 10,
    elapsedTime: 0,
  };
  gameRound = {
    stake: new BigNumber(0),
    index: 1,
    userSelection: Selections.none,
    botSelection: Selections.none,
    isCompleted: false,
    shouldHandleBotAction: false,
    userInAction: false,
    winner: null,
  };
  contract = null;
  contractAddress = null;
  contractCreationChannelRound = -1;

  getStatus() {
    return channel.status();
  }

  getSelectionHash(selection) {
    this.gameRound.hashKey = Math.random().toString(16).substring(2, 8);
    return SHA('sha256')
      .update(this.gameRound.hashKey + selection)
      .digest('hex');
  }

  getUserSelection() {
    return this.gameRound.userSelection;
  }

  /**
   * @param {Selections} selection
   */
  async setUserSelection(selection) {
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

  /**
   * @param {Selections} selection
   */
  setBotSelection(selection) {
    this.gameRound.botSelection = selection;
  }

  /**
   *
   * @returns {Promise<ChannelOptions>}
   */
  async fetchChannelConfig() {
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
    return data;
  }

  /**
   * @param {ChannelOptions | undefined} config
   */
  async initializeChannel(config) {
    this.isOpening = true;
    if (!config) config = await this.fetchChannelConfig();
    this.channelConfig = config;
    this.isFunded = true;
    channel = await Channel.initialize({
      ...this.channelConfig,
      debug: true,
      role: 'responder',
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
        .shutdown((tx) => this.signTx('channel_close', tx))
        .then(async () => {
          this.shouldShowEndScreen = true;
          this.isOpen = false;
          channel.disconnect();

          returnCoinsToFaucet(this.getMessageToSaveOnChain()).then(
            async (txHash) => (this.savedResultsOnChainTxHash = txHash)
          );
        });
    });
    return channelClosing;
  }

  /**
   * wait for contract to be deployed and then execute callback
   * @param {Function} callback
   */
  async pollForContract(callback) {
    if (this.contractAddress) {
      callback();
    } else {
      setTimeout(() => this.pollForContract(callback), 100);
    }
  }

  /**
   * @param {string} tag
   * @param {Encoded.Transaction} tx
   * @param {Object} [options]
   * @param {Update[]} [options.updates]
   * @returns {Promise<Encoded.Transaction>}
   */
  async signTx(tag, tx, options) {
    const update = options?.updates?.[0];
    const txHash = buildTxHash(tx);

    // if we are signing the open channel tx
    if (tag === 'responder_sign') {
      const transactionLog = {
        id: txHash,
        description: 'Open state channel',
        signed: SignatureTypes.confirmed,
        onChain: true,
        timestamp: Date.now(),
      };
      addUserTransaction(transactionLog, 0);
    }

    // if we are signing the close channel tx
    if (tag === 'channel_close') {
      const transactionLog = {
        id: txHash,
        description: 'Close state channel',
        signed: SignatureTypes.proposed,
        onChain: true,
        timestamp: Date.now(),
      };
      addUserTransaction(transactionLog, 0);
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

      channel.on('stateChanged', (tx) => {
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
          updateOpenChannelTransactions(onChainTxhash);
        }
      });
    }
  }

  /**
   * @param {number} contractCreationChannelRound
   * @param {Encoded.AccountAddress} owner
   */
  async buildContract(contractCreationChannelRound, owner) {
    this.contractCreationChannelRound = contractCreationChannelRound;
    this.contract = await sdk.getContractInstance({
      source: contractSource,
    });
    this.contractAddress = encodeContractAddress(
      owner,
      contractCreationChannelRound
    );
  }

  /**
   * @param {Encoded.TxHash} th
   */
  logContractDeployment(th) {
    const transactionLog = {
      id: th,
      description: 'Deploy contract',
      signed: SignatureTypes.confirmed,
      onChain: false,
      timestamp: Date.now(),
    };
    addUserTransaction(transactionLog, 0);

    // if autoplay is enabled, make user selection automatically
    if (this.autoplay.enabled) {
      this.setUserSelection(this.getRandomSelection());
    }
  }

  /**
   * @param {Methods} method
   * @param {unknown[]} params
   * @param {number | BigNumber} [amount]
   * @returns
   */
  async callContract(method, params, amount) {
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
      async (tx, options) => {
        return this.signTx(method, tx, options);
      }
    );

    const value = typeof params === 'string' ? params : params.at(-1);

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
    this.checkHasInsuffientBalance();
  }

  async getLastEventsDecoded() {
    if (!this.contract) throw new Error('Contract is not set');
    const result = await this.fetchLastContractCall();
    return this.contract.decodeEvents(result.log);
  }

  /**
   * @param {Encoded.Transaction} tx
   * @returns
   */
  async handleOpponentCall(tx) {
    if (!this.channelConfig?.responderId)
      throw new Error('Responder id is not defined');
    if (!this.channelRound) throw new Error('Channel round is undefined');
    const decodedEvents = await this.getLastEventsDecoded();
    this.logCallUpdate(tx, {
      name: decodedEvents[0].name,
      value: decodedEvents[0].args[0],
      type: 'event',
    });

    switch (decodedEvents[0].name) {
      case ContractEvents.player1Moved:
        this.setBotSelection(decodedEvents[0].args[0]);
        this.gameRound.hasRevealed = true;
        this.saveStateToLocalStorage();
        await this.revealRoundResult();

        break;
      default:
        return;
    }
  }

  /**
   * @param {Encoded.Transaction} tx
   * @param {Object} information
   * @param {Methods | ContractEvents} name
   * @param {string} value
   * @param {'method' | 'event'} type
   */
  async logCallUpdate(tx, information) {
    const th = buildTxHash(tx);
    const transactionLog = {
      id: th,
      description: ``,
      signed: SignatureTypes.proposed,
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
      transactionLog.signed = SignatureTypes.confirmed;
      transactionLog.description = `Bot selected ${information.value}`;
    }
    addUserTransaction(transactionLog, this.gameRound.index);
  }

  /**
   * @param {Encoded.AccountAddress}
   * @param {number} round
   */
  async getRoundContractCall(caller, round) {
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

  /**
   * @param {Encoded.AccountAddress} [winner]
   */
  async finishGameRound(winner) {
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
      if (
        this.gameRound.index < this.autoplay.rounds &&
        !this.hasInsuffientBalance
      )
        this.startNewRound();
      // otherwise, show results
      else {
        this.autoplay.elapsedTime +=
          this.lastOffChainTxTime - this.timerStartTime;
        this.shouldShowEndScreen = true;
      }
    } else this.startNewRound();
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

  checkHasInsuffientBalance() {
    if (!this.channelConfig) throw new Error('Channel config is not set');
    if (!this.balances.user) throw new Error('User balance is not set');
    if (!this.balances.bot) throw new Error('Bot balance is not set');

    const { user: userBalance, bot: botBalance } = this.balances;
    const channelReserve = new BigNumber(
      this.channelConfig.channelReserve ?? 0
    );
    this.hasInsuffientBalance =
      userBalance.minus(this.gameRound.stake).isLessThan(channelReserve) ||
      botBalance.minus(this.gameRound.stake).isLessThan(channelReserve);
    return this.hasInsuffientBalance;
  }

  /**
   * @param {Obect} message
   * @param {string} message.type
   * @param {TransactionLog} message.data
   */
  handleMessage(message) {
    if (message.type === 'add_bot_transaction_log') {
      const txLog = message.data;
      let round =
        txLog.onChain || txLog.description === 'Deploy contract'
          ? 0
          : this.gameRound.index;

      if (round > 1 && transactionLogs.botTransactions[round - 1].length === 2)
        round--;
      addBotTransaction(txLog, round);
    }
  }

  getMessageToSaveOnChain() {
    if (!this.channelConfig) throw new Error('Channel config is not set');

    const initialBalance = this.channelConfig?.responderAmount;
    const balance = this.balances.user;
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
    const stateToSave = {
      keypair: getSavedState()?.keypair || keypair,
      channelId: this.channelId,
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
          transactionLogs.userTransactions
        ),
        botTransactions: this.getTrimmedTransactions(
          transactionLogs.botTransactions
        ),
      },
      contractCreationChannelRound: this.contractCreationChannelRound,
    };
    storeGameState(stateToSave);
  }

  getTrimmedTransactions(logs) {
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
   *
   * @param {Encoded.AccountAddress} [caller]
   */
  async fetchLastContractCall(caller) {
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
    setUserTransactions(savedState.transactionLogs.userTransactions);
    setBotTransactions(savedState.transactionLogs.botTransactions);
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

  /**
   * @returns {Promise<Selections>}
   */
  getRandomSelection() {
    const randomSelection = Math.floor(Math.random() * 3);
    return Object.values(Selections)[randomSelection];
  }
}

/**
 * In order to perform dom updates without bloating current code base,
 * we add a callback (middleware) to every GameChannel method which
 * updates the dom based on current game state
 */
for (const key of Object.getOwnPropertyNames(GameChannel.prototype)) {
  const method = GameChannel.prototype[key];
  const excludedMethods = ['pollForContract'];
  if (excludedMethods.includes(key)) continue;
  if (method.constructor.name === 'AsyncFunction') {
    GameChannel.prototype[key] = async function (...args) {
      let result = await method.call(this, ...args);
      DomMiddleware(this);
      return result;
    };
  } else
    GameChannel.prototype[key] = function (...args) {
      let result = method.call(this, ...args);
      DomMiddleware(this);
      return result;
    };
}

export const gameChannel = new GameChannel();
