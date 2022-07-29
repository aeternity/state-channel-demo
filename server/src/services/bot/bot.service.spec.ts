import { Channel, generateKeyPair, MemoryAccount } from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import BigNumber from 'bignumber.js';
import { mockChannel, timeout } from '../../../test';
import { ContractService } from '../contract';
import { sdk } from '../sdk';
import botService from './index';

jest.setTimeout(10000);

ContractService.deployContract = jest.fn().mockResolvedValue({
  instance: {} as any,
  address: 'ct_test',
});

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
    initiatorId: 'ak_initiator' as Encoded.AccountAddress,
    responderId: 'ak_responder' as Encoded.AccountAddress,
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

    await botService.addGameSession(channel, channelConfig);

    expect(botService.gameSessionPool.has(channelConfig.initiatorId)).toBe(
      true,
    );
  });

  it('should remove a channel from botPool', async () => {
    const channel = await Channel.initialize({
      ...channelConfig,
      role: 'initiator',
      sign: () => Promise.resolve('tx_txdata'),
    });

    await botService.addGameSession(channel, channelConfig);
    expect(botService.gameSessionPool.has(channelConfig.initiatorId)).toBe(
      true,
    );
    botService.removeGameSession(channelConfig.initiatorId);
    expect(botService.gameSessionPool.has(channelConfig.initiatorId)).toBe(
      false,
    );
  });

  it('registers events on channel', async () => {
    const channel = await Channel.initialize(channelConfig);
    await botService.registerEvents(channel, channelConfig);
    const channelMock: ChannelMock = channel as unknown as ChannelMock;
    expect(channelMock.listeners.statusChanged).toBeDefined();
    channelMock.listeners.statusChanged('open');
    await timeout(100);
    expect(botService.gameSessionPool.has(channelConfig.initiatorId)).toBe(
      true,
    );
    channelMock.listeners.statusChanged('closed');
    await timeout(500);
    const channelRemoved = !botService.gameSessionPool.has(
      channelConfig.initiatorId,
    );
    expect(channelRemoved).toBe(true);
  });
});
