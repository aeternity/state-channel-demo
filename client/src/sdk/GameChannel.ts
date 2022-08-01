import { Channel, encodeContractAddress, unpackTx } from '@aeternity/aepp-sdk';
import contractSource from '@aeternity/rock-paper-scissors';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import { BigNumber } from 'bignumber.js';
import { toRaw } from 'vue';
import {
  decodeCallData,
  initSdk,
  returnCoinsToFaucet,
  sdk,
  verifyContractBytecode,
} from './sdkService';
import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import { PopUpData, usePopUpStore } from '../stores/popup';
import { useGameStore } from '../stores/game';
import { Selections } from '../game/GameManager';

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

export class GameChannel {
  channelConfig?: ChannelOptions;
  channelInstance?: Channel;
  isOpen = false;
  isFunded = false;
  error?: {
    status: number;
    statusText: string;
    message: string;
  } = undefined;
  balances: {
    user?: BigNumber;
    bot?: BigNumber;
  } = {
    user: undefined,
    bot: undefined,
  };
  game?: {
    stake?: BigNumber;
    round?: number;
  };
  contract?: ContractInstance;
  contractAddress?: Encoded.ContractAddress;
  nextCallData?: Encoded.ContractBytearray;
  autoSign = false;

  getChannelWithoutProxy() {
    if (!this.channelInstance) {
      throw new Error('Channel is not initialized');
    }
    return toRaw(this.channelInstance);
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
    this.game = {
      stake: new BigNumber(data.gameStake),
    };
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
    await this.fetchChannelConfig()
      .then(async (config) => {
        this.channelConfig = config;
        this.isFunded = true;
        await this.openChannel();
      })
      .catch((e) => console.error(e));
  }

  async openChannel() {
    if (!this.channelConfig) throw new Error('Channel config is not set');

    this.channelInstance = await Channel.initialize({
      ...this.channelConfig,
      role: 'responder',
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
    this.channelInstance.disconnect();
  }

  getStatus() {
    return this.getChannelWithoutProxy().status();
  }

  /**
   * Triggered when channel operation is `OffChainCallContract`.
   * Decodes the call data provided by the opponent and generates
   * the next calldata to be sent to the opponent.
   */
  async handleOpponentCallUpdate(update: Update) {
    this.nextCallData = await this.getNextCallData(
      update,
      this.channelInstance
    );
  }

  async signTx(
    tag: string,
    tx: Encoded.Transaction,
    options?: {
      updates: Update[];
    },
    popupData?: Partial<PopUpData>
  ): Promise<Encoded.Transaction> {
    popupData = popupData ?? {};
    const update = options?.updates?.[0];

    // if we are signing a transaction that updates the contract
    if (update?.op === 'OffChainNewContract' && update?.code && update?.owner) {
      const proposedBytecode = update.code;
      const isContractValid = await verifyContractBytecode(proposedBytecode);
      popupData.title = 'Contract validation';
      popupData.text = `Contract bytecode is 
      ${isContractValid ? 'matching' : 'not matching'}`;
      popupData.mainBtnText = 'Accept Contract';
      popupData.secBtnText = 'Decline Contract';
      popupData.mainBtnAction = async () => {
        await this.buildContract(tx, update.owner);
      };
    }

    if (
      options?.updates[0]?.op === 'OffChainCallContract' &&
      options?.updates[0]?.caller_id !== sdk.selectedAddress
    ) {
      popupData.mainBtnAction = () =>
        this.handleOpponentCallUpdate(options.updates[0]);
    }

    if (this.autoSign) {
      return new Promise((resolve) => {
        resolve(sdk.signTransaction(tx, {}));
        // call the callback if it exists
        popupData?.mainBtnAction?.();
      });
    }
    const popupStore = usePopUpStore();
    return new Promise((resolve) => {
      popupStore.showPopUp({
        title: popupData?.title ?? `Signing ${tag}`,
        text: popupData?.text ?? 'Do you want to sign this transaction?',
        mainBtnText: popupData?.mainBtnText ?? 'Confirm',
        secBtnText: popupData?.secBtnText ?? 'Cancel',
        mainBtnAction: () => {
          popupStore.resetPopUp();
          resolve(sdk.signTransaction(tx, {}));
          // call the callback if it exists
          popupData?.mainBtnAction?.();
        },
        secBtnAction: () => {
          popupStore.resetPopUp();
          // @ts-expect-error reject the promise
          resolve(1);
          // call the callback if it exists
          popupData?.secBtnAction?.();
        },
      });
    });
  }

  private registerEvents() {
    if (this.channelInstance) {
      this.getChannelWithoutProxy().on('statusChanged', (status) => {
        if (status === 'disconnected') {
          returnCoinsToFaucet();
        }
        if (status === 'open') {
          this.isOpen = true;
          this.updateBalances();
        }
      });
    }
  }

  async buildContract(tx: Encoded.Transaction, owner: Encoded.AccountAddress) {
    // @ts-expect-error ts-mismatch
    const contractCreationRound = unpackTx(tx).tx.round;
    this.contractAddress = encodeContractAddress(owner, contractCreationRound);

    this.contract = await sdk.getContractInstance({
      source: contractSource,
    });
    await this.contract.compile();
  }

  async callContract(
    method: string,
    params: unknown[],
    popupData?: Partial<PopUpData>
  ) {
    if (!this.channelInstance) {
      throw new Error('Channel is not open');
    }
    if (!this.contract || !this.contractAddress) {
      throw new Error('Contract is not set');
    }
    const result = await this.getChannelWithoutProxy().callContract(
      {
        amount: 0,
        callData: this.contract.calldata.encode(
          'RockPaperScissors',
          method,
          params
        ),
        contract: this.contractAddress,
        abiVersion: 3,
      },
      async (tx, options) =>
        this.signTx(`call ${method}`, tx, options, popupData)
    );
    return result;
  }

  async updateBalances() {
    if (!this.channelInstance || !this.channelConfig)
      throw new Error('Channel is not open');
    const { initiatorId, responderId } = this.channelConfig;
    const balances = await this.getChannelWithoutProxy().balances([
      initiatorId,
      responderId,
    ]);
    this.balances.user = new BigNumber(balances[responderId]);
    this.balances.bot = new BigNumber(balances[initiatorId]);
  }

  /**
   * extracts latest callData and generates returns next callData to be sent
   */
  async getNextCallData(update: Update) {
    if (!this.contract) throw new Error('Contract is not set');
    if (!this.contract.bytecode) throw new Error('Contract is not compiled');
    const data = await decodeCallData(update.call_data, this.contract.bytecode);
    const popupStore = usePopUpStore();
    const gameStore = useGameStore();
    switch (data.function) {
      case Methods.player1_move:
        if (!this.autoSign)
          return new Promise((resolve) => {
            popupStore.showPopUp({
              title: `Bot has picked. Reveal?`,
              text: 'Do you want to reveal the winner?',
              mainBtnText: 'Confirm',
              secBtnText: 'Cancel',
              mainBtnAction: () => {
                popupStore.resetPopUp();
                gameStore.gameManager?.setBotSelection(
                  data.arguments[0].value as Selections
                );
                resolve(1);
              },
              secBtnAction: () => {
                popupStore.resetPopUp();
                resolve(1);
              },
            });
          });
        return;
      default:
        throw new Error(`Unhandled method: ${data.function}`);
    }
  }
}
