import { BigNumber } from 'bignumber.js';
import { AeSdk, Channel } from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import { returnCoinsToFaucet } from './sdkService';
import { toRaw } from 'vue';
import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import { PopUpData, usePopUpStore } from '../stores/popup';

const CONTRACT_SOURCE = `
contract FakeContract =
  entrypoint makeSelection(x : int) : int = x
`;

export class GameChannel {
  readonly sdk: AeSdk;
  channelConfig?: ChannelOptions;
  channelInstance?: Channel;
  isOpen = false;
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
  contract?: ContractInstance;
  contractAddress?: string;
  autoSign = false;

  constructor(sdk: AeSdk) {
    this.sdk = sdk;
  }

  getChannelWithoutProxy() {
    if (!this.channelInstance) {
      throw new Error('Channel is not initialized');
    }
    return toRaw(this.channelInstance);
  }
  getSdkWithoutProxy() {
    return toRaw(this.sdk);
  }

  async fetchChannelConfig(): Promise<ChannelOptions> {
    if (!this.sdk) throw new Error('SDK is not set');
    const res = await fetch(import.meta.env.VITE_BOT_SERVICE_URL + '/open', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: this.sdk.selectedAddress,
        port: import.meta.env.VITE_RESPONDER_PORT ?? '3333',
        host: import.meta.env.VITE_RESPONDER_HOST ?? 'localhost',
      }),
    });
    const data = await res.json();

    if (res.status != 200) {
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

  async signTx(
    tag: string,
    tx: EncodedData<'tx'>,
    popupData?: Partial<PopUpData>
  ): Promise<EncodedData<'tx'>> {
    if (this.autoSign) {
      return Promise.resolve(this.getSdkWithoutProxy().signTransaction(tx, {}));
    }
    const popupStore = usePopUpStore();
    return new Promise((resolve, reject) => {
      popupStore.showPopUp({
        title: popupData?.title ?? `Signing ${tag}`,
        text: popupData?.text ?? 'Do you want to sign this transaction?',
        mainBtnText: popupData?.mainBtnText ?? 'Confirm',
        secBtnText: popupData?.secBtnText ?? 'Cancel',
        mainBtnAction:
          popupData?.mainBtnAction ??
          (() => {
            popupStore.resetPopUp();
            resolve(
              Promise.resolve(this.getSdkWithoutProxy().signTransaction(tx, {}))
            );
          }),
        secBtnAction:
          popupData?.secBtnAction ??
          (() => {
            popupStore.resetPopUp();
            reject(console.log(`User didn't sign tx with tag ${tag}`));
          }),
      });
    });
  }

  private registerEvents() {
    if (this.channelInstance) {
      this.getChannelWithoutProxy().on('statusChanged', (status) => {
        if (status === 'disconnected') {
          returnCoinsToFaucet(this.getSdkWithoutProxy());
        }
        if (status === 'open') {
          this.isOpen = true;
          this.updateBalances();
        }
      });
    }
  }

  async waitForChannelReady(): Promise<void> {
    return new Promise((resolve) => {
      this.getChannelWithoutProxy().on('statusChanged', (status: string) => {
        if (status === 'open') {
          resolve();
        }
      });
    });
  }

  // TODO: remove this method as contract will be created by the bot
  async createContract() {
    if (!this.channelInstance) {
      throw new Error('Channel is not open');
    }
    this.contract = await this.getSdkWithoutProxy().getContractInstance({
      source: CONTRACT_SOURCE,
    });
    await this.contract.compile();
    const result = this.getChannelWithoutProxy().createContract(
      {
        code: this.contract.bytecode as string,
        callData: this.contract.calldata.encode('FakeContract', 'init', []),
        deposit: 1000,
        vmVersion: 5,
        abiVersion: 3,
      },
      async (tx) => this.signTx('createContract', tx)
    );
    this.contractAddress = (await result).address;
    return result;
  }

  // TODO create tests once we have a contract
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
        callData: this.contract.calldata.encode('FakeContract', method, params),
        contract: this.contractAddress,
        abiVersion: 3,
      },
      async (tx) => this.signTx(`call ${method}`, tx, popupData)
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
}
