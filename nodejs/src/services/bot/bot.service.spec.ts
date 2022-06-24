import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import { Channel } from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';
import botService from './bot.service';

interface ChannelMock {
  listeners:{
    [eventName:string]: (...args:any[]) => void
  }
  on: (eventName:string, listener: (...args:any[]) => void) => void
}

describe('botService', () => {
  const channelConfig: ChannelOptions = {
    url: process.env.WS_URL ?? 'ws://localhost:3014/channel',
    pushAmount: 3,
    initiatorAmount: new BigNumber('1e2'),
    responderAmount: new BigNumber('1e2'),
    channelReserve: 0,
    ttl: 10000,
    host: 'localhost',
    port: 3001,
    lockPeriod: 1,
    debug: false,
    role: 'initiator',
    initiatorId: 'ak_initiator' as EncodedData<'ak'>,
    responderId: 'ak_responder' as EncodedData<'ak'>,
    sign: () => Promise.resolve('tx_txdata'),
  };

  Channel.initialize = jest.fn().mockImplementation(() => ({
    listeners: {},
    on(event: string, _callback: (...args: any[]) => void) {
      if (this !== undefined) this.listeners[event] = _callback;
    },
  } as ChannelMock));

  it('should be defined', () => {
    expect(botService).toBeDefined();
  });

  it('should add a channel to botPool', async () => {
    const channel = await Channel.initialize(channelConfig);

    botService.addChannel(channel);

    expect(botService.channelPool.has(channel)).toBe(true);
  });

  it('should remove a channel from botPool', async () => {
    const channel = await Channel.initialize({
      ...channelConfig,
      role: 'initiator',
      sign: () => Promise.resolve('tx_txdata'),
    });

    botService.addChannel(channel);
    expect(botService.channelPool.has(channel)).toBe(true);
    botService.removeChannel(channel);
    expect(botService.channelPool.has(channel)).toBe(false);
  });

  it('registers events on channel', async () => {
    const channel = await Channel.initialize(channelConfig);
    botService.registerEvents(channel);
    const channelMock: ChannelMock = channel as unknown as ChannelMock;
    expect((channelMock).listeners.statusChanged).toBeDefined();
    (channelMock).listeners.statusChanged('open');
    expect(botService.channelPool.has(channel)).toBe(true);
    (channelMock).listeners.statusChanged('disconnected');
    expect(botService.channelPool.has(channel)).toBe(false);
  });
});
