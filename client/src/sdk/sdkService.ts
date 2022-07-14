import { AeSdk, Channel } from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import { useChannelStore } from '../stores/channel';
import { getSdk, returnCoinsToFaucet } from './sdk';

export class SdkService {
  sdk?: AeSdk;
  channel?: ChannelInstance;

  async getChannelConfig(): Promise<ChannelOptions> {
    const channelStore = useChannelStore();
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
      channelStore.error = {
        status: res.status,
        statusText: res.statusText,
        message: data.error || 'Error while fetching channel config',
      };
      throw new Error(data.error);
    }
    return data as ChannelOptions;
  }

  async initializeChannel() {
    this.sdk = await getSdk();
    const channelStore = useChannelStore();

    try {
      channelStore.channelStatus = 'getting channel config...';
      const channelConfig = await this.getChannelConfig();
      if (channelConfig == null) {
        throw new Error('Channel config is null');
      }

      channelStore.channelStatus = 'initializing channel...';
      this.channel = new ChannelInstance(channelConfig, this.sdk);
      await this.channel.openChannel();
    } catch (e) {
      console.error(e);
    }
  }
}

export class ChannelInstance {
  private channelConfig: ChannelOptions;
  private channel: Channel | undefined;
  private sdk: AeSdk;

  constructor(channelConfig: ChannelOptions, sdk: AeSdk) {
    this.channelConfig = channelConfig;
    this.sdk = sdk;
  }

  async openChannel() {
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
    return this.channel.status();
  }

  async signTx(tag: string, tx: EncodedData<'tx'>): Promise<EncodedData<'tx'>> {
    // TODO show in pop up
    return new Promise((resolve, reject) => {
      resolve(Promise.resolve(this.sdk.signTransaction(tx, {})));
      reject(new Error(`Error while signing tx with tag ${tag}`));
    });
  }

  private registerEvents() {
    if (this.channel) {
      const channelStore = useChannelStore();

      this.channel.on('statusChanged', (status) => {
        channelStore.channelStatus = status;
        if (status === 'disconnected') {
          returnCoinsToFaucet(this.sdk);
        }
        if (status === 'open') {
          channelStore.channelIsOpen = true;
        }
      });
    }
  }
}
