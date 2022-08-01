import { Channel, encodeContractAddress, unpackTx } from '@aeternity/aepp-sdk';
import contractSource from '@aeternity/rock-paper-scissors';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import { BigNumber } from 'bignumber.js';
import {
  initSdk,
  returnCoinsToFaucet,
  sdk,
  verifyContractBytecode,
} from './sdkService';
import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import { PopUpData, usePopUpStore } from '../stores/popup';

export let gameChannel: GameChannel;

export function initGameChannel() {
  if (!sdk) {
    throw new Error('SDK is not initialized');
  }
  gameChannel = new GameChannel();
}

class GameChannel {
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
  contractAddress?: EncodedData<'ct'>;
  autoSign = false;

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
    return this.channelInstance?.status();
  }

  async signTx(
    tag: string,
    tx: EncodedData<'tx'>,
    options?: any,
    popupData?: Partial<PopUpData>
  ): Promise<EncodedData<'tx'>> {
    popupData = popupData ?? {};
    const update = options?.updates?.[0];

    // if we are signing a transaction that updates the contract
    if (update?.op === 'OffChainNewContract') {
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
      this.channelInstance.on('statusChanged', (status) => {
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

  async buildContract(tx: EncodedData<'tx'>, owner: EncodedData<'ak'>) {
    // @ts-expect-error ts-mismatch
    const contractCreationRound = unpackTx(tx).tx.round;
    this.contractAddress = encodeContractAddress(owner, contractCreationRound);

    this.contract = await sdk.getContractInstance({
      source: contractSource,
    });
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
    const result = await this.channelInstance.callContract(
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
    const balances = await this.channelInstance.balances([
      initiatorId,
      responderId,
    ]);
    this.balances.user = new BigNumber(balances[responderId]);
    this.balances.bot = new BigNumber(balances[initiatorId]);
  }
}
