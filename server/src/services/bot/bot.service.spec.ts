import { Channel, generateKeyPair, MemoryAccount } from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import BigNumber from 'bignumber.js';
import axios, { AxiosError } from 'axios';
import botService from './index';
import { mockChannel, timeout } from '../../../test';
import { genesisFund, sdk } from '../sdk';

const axiosSpy = jest.spyOn(axios, 'post');
jest.setTimeout(10000);
jest.mock('../sdk/sdk.service.ts', () => ({
  ...jest.requireActual('../sdk/sdk.service.ts'),
  deployContract: jest.fn(),
}));
jest.mock('../sdk', () => ({
  ...jest.requireActual('../sdk'),
  IS_USING_LOCAL_NODE: false,
}));

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

  beforeAll(async () => {
    const keypair = generateKeyPair();
    await sdk.addAccount(new MemoryAccount({ keypair }), { select: true });
    channelConfig.initiatorId = keypair.publicKey;
  });

  mockChannel();

  it('should be defined', () => {
    expect(botService).toBeDefined();
  });

  it('should add a channel to botPool', async () => {
    const channel = await Channel.initialize(channelConfig);

    botService.addChannel(channel, channelConfig);

    expect(botService.channelPool.has(channelConfig.initiatorId)).toBe(true);
  });

  it('should remove a channel from botPool', async () => {
    const channel = await Channel.initialize({
      ...channelConfig,
      role: 'initiator',
      sign: () => Promise.resolve('tx_txdata'),
    });

    botService.addChannel(channel, channelConfig);
    expect(botService.channelPool.has(channelConfig.initiatorId)).toBe(true);
    botService.removeChannel(channelConfig.initiatorId);
    expect(botService.channelPool.has(channelConfig.initiatorId)).toBe(false);
  });

  it('registers events on channel', async () => {
    const channel = await Channel.initialize(channelConfig);
    await botService.registerEvents(channel, channelConfig);
    const channelMock: ChannelMock = channel as unknown as ChannelMock;
    expect(channelMock.listeners.statusChanged).toBeDefined();
    channelMock.listeners.statusChanged('open');
    expect(botService.channelPool.has(channelConfig.initiatorId)).toBe(true);
    channelMock.listeners.statusChanged('closed');
    await timeout(100);
    const channelRemoved = !botService.channelPool.has(
      channelConfig.initiatorId,
    );
    expect(channelRemoved).toBe(true);
  });

  describe('botService.fundThroughFaucet()', () => {
    const mockedAxios = axios as jest.Mocked<typeof axios>;
    const accountMock = generateKeyPair().publicKey;

    afterEach(() => {
      mockedAxios.post.mockClear();
    });

    it('should run without errors', async () => {
      mockedAxios.post.mockReturnValue(Promise.resolve());
      await botService.fundThroughFaucet(accountMock);
    });

    it('should throw an error if faucet greylisted account', async () => {
      mockedAxios.post.mockRejectedValueOnce(
        new AxiosError('Greylisted', '425', null, null, {
          status: 425,
          statusText: 'Greylisted',
          headers: {},
          config: {},
          request: {},
          data: [],
        }),
      );
      await expect(botService.fundThroughFaucet(accountMock)).rejects.toThrow();
      expect(axiosSpy).toHaveBeenCalledTimes(1);
    });

    it('should retry by default 1 time when error code is different than 425', async () => {
      mockedAxios.post.mockRejectedValue(
        new AxiosError('Unavailable', '500', null, null, {
          status: 500,
          statusText: 'Unavailable',
          headers: {},
          config: {},
          request: {},
          data: [],
        }),
      );
      await expect(botService.fundThroughFaucet(accountMock)).rejects.toThrow();
      expect(axiosSpy).toHaveBeenCalledTimes(2);
    });

    it('should retry 3 times with a total delay of 4.5 seconds when given maxRetries:2 and retryDelay:500', async () => {
      mockedAxios.post.mockRejectedValue(
        new AxiosError('Unavailable', '500', null, null, {
          status: 500,
          statusText: 'Unavailable',
          headers: {},
          config: {},
          request: {},
          data: [],
        }),
      );

      const startTime = performance.now();

      await expect(
        botService.fundThroughFaucet(accountMock, {
          maxRetries: 3,
          retryDelay: 500,
        }),
      ).rejects.toThrow();
      expect(axiosSpy).toHaveBeenCalledTimes(4);
      const endTime = performance.now();

      const totalDelay = endTime - startTime;
      expect(totalDelay).toBeGreaterThanOrEqual(4500);
      expect(totalDelay).toBeLessThanOrEqual(6500);
    });

    it('should not throw an error if account has enough coins', async () => {
      mockedAxios.post.mockRejectedValue(
        new AxiosError('Greylist', '425', null, null, {
          status: 425,
          statusText: 'Greylist',
          headers: {},
          config: {},
          request: {},
          data: [],
        }),
      );

      await genesisFund(accountMock);
      await botService.fundAccount(accountMock);
      expect(axiosSpy).toHaveBeenCalledTimes(1);
    });
  });
});
