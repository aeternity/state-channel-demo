import { BigNumber } from 'bignumber.js';
import { AeSdk, Channel } from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import { returnCoinsToFaucet } from './sdk';
import { toRaw } from 'vue';

export class ChannelService {
  readonly sdk: AeSdk;
  channelConfig?: ChannelOptions;
  channel?: Channel;
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

  constructor(sdk: AeSdk) {
    this.sdk = sdk;
  }

  getChannelWithoutProxy() {
    if (!this.channel) {
      throw new Error('Channel is not initialized');
    }
    return toRaw(this.channel);
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
    try {
      this.channelConfig = await this.fetchChannelConfig();
      if (this.channelConfig == null) {
        throw new Error('Channel config is null');
      }

      await this.openChannel();
    } catch (e) {
      console.error(e);
    }
  }

  async openChannel() {
    if (!this.channelConfig) throw new Error('Channel config is not set');

    this.channel = await Channel.initialize({
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
    if (!this.channel) {
      throw new Error('Channel is not open');
    }
    this.channel.disconnect();
  }

  getStatus() {
    if (!this.channel) {
      throw new Error('Channel is not open');
    }
    return this.getChannelWithoutProxy().status();
  }

  async signTx(tag: string, tx: EncodedData<'tx'>): Promise<EncodedData<'tx'>> {
    // TODO show in pop up
    return new Promise((resolve, reject) => {
      resolve(Promise.resolve(toRaw(this.sdk).signTransaction(tx, {})));
      reject(new Error(`Error while signing tx with tag ${tag}`));
    });
  }

  private registerEvents() {
    if (this.channel) {
      this.getChannelWithoutProxy().on('statusChanged', (status) => {
        if (status === 'disconnected') {
          returnCoinsToFaucet(this.sdk);
        }
        if (status === 'open') {
          this.isOpen = true;
          // this.updateBalances();
        }
      });
    }
  }

  // async updateBalances() {
  //   const { initiatorId, responderId } = this.channelConfig;
  //   if (!this.channel) throw new Error('Channel is not open');
  //   const balances = await toRaw(this.channel).balances([
  //     initiatorId,
  //     responderId,
  //   ]);
  //   this.balances.user = new BigNumber(balances[responderId]);
  //   this.balances.bot = new BigNumber(balances[initiatorId]);
  // }
}
