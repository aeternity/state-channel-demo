import { Channel } from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';
import { randomUUID } from 'crypto';
import { ChannelMock } from './interfaces';

export const mockChannel = () => {
  Channel.initialize = jest.fn().mockImplementation(
    () => ({
      listeners: {},
      on(event: string, _callback: (...args: any[]) => void) {
        if (this !== undefined) this.listeners[event] = _callback;
      },
      id() {
        return `ch_${randomUUID()}`;
      },
      poi() {
        return `pi_${randomUUID()}`;
      },
      balances() {
        return {
          responderAmount: new BigNumber(0),
          initiatorAmount: new BigNumber(0),
        };
      },
      state() {
        return {};
      },
      createContract: jest.fn(),
    } as ChannelMock),
  );
};
