import { AeSdk, Channel, generateKeyPair } from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import BigNumber from 'bignumber.js';
import botService from './index';
import { mockChannel, timeout } from '../../../test';
import { getSdk } from '../sdk/sdk.service';

interface ChannelMock {
  listeners: {
    [eventName: string]: (...args: any[]) => void;
  };
  on: (eventName: string, listener: (...args: any[]) => void) => void;
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

  mockChannel();

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
    const sdk = await getSdk(generateKeyPair());
    const { transferFunds, ...mockedSdk } = sdk;
    Object.assign(mockedSdk, {
      transferFunds: jest.fn(
        (
          amount: number | string,
          address: EncodedData<'ak'>,
          options: unknown,
        ) => Promise.resolve({ amount, address, options }),
      ),
    });
    const channel = await Channel.initialize(channelConfig);
    await botService.registerEvents(channel, mockedSdk as AeSdk);
    const channelMock: ChannelMock = channel as unknown as ChannelMock;
    expect(channelMock.listeners.statusChanged).toBeDefined();
    channelMock.listeners.statusChanged('open');
    expect(botService.channelPool.has(channel)).toBe(true);
    channelMock.listeners.statusChanged('closed');
    await timeout(100);
    const channelRemoved = !botService.channelPool.has(channel);
    expect(channelRemoved).toBe(true);
  });
});
