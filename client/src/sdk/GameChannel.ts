import { AeSdk, Channel } from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import { BigNumber } from 'bignumber.js';
import { toRaw } from 'vue';
import {
  getSdk,
  returnCoinsToFaucet,
  verifyContractBytecode,
} from './sdkService';

export class GameChannel {
  sdk: AeSdk;
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
  game?: {
    stake?: BigNumber;
    round?: number;
  };

  constructor(sdk: AeSdk) {
    this.sdk = sdk;
  }

  getChannelWithoutProxy() {
    if (!this.channelInstance) {
      throw new Error('Channel is not initialized');
    }
    return toRaw(this.channelInstance);
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
    this.game = {
      stake: new BigNumber(data.gameStake),
    };
    if (res.status != 200) {
      this.error = {
        status: res.status,
        statusText: res.statusText,
        message: data.error || 'Error while fetching channel config',
      };
      if (this?.error?.message?.includes('greylisted')) {
        console.log('Greylisted account, retrying with new account');
        this.sdk = await getSdk();
        return this.fetchChannelConfig();
      }
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
    if (!this.channelInstance) {
      throw new Error('Channel is not open');
    }
    return this.getChannelWithoutProxy().status();
  }

  async signTx(
    tag: string,
    tx: EncodedData<'tx'>,
    options?: any
  ): Promise<EncodedData<'tx'>> {
    const update = options?.updates?.[0];
    if (update?.op === 'OffChainNewContract') {
      const proposedBytecode = update.code;
      await verifyContractBytecode(toRaw(this.sdk), proposedBytecode);
    }
    // TODO show in pop up
    return new Promise((resolve, reject) => {
      resolve(Promise.resolve(toRaw(this.sdk).signTransaction(tx, {})));
      reject(new Error(`Error while signing tx with tag ${tag}`));
    });
  }

  private registerEvents() {
    if (this.channelInstance) {
      this.getChannelWithoutProxy().on('statusChanged', (status) => {
        if (status === 'disconnected') {
          returnCoinsToFaucet(toRaw(this.sdk));
        }
        if (status === 'open') {
          this.isOpen = true;
          this.updateBalances();
        }
      });
    }
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
