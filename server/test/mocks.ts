import { Channel } from '@aeternity/aepp-sdk';
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
      createContract: jest.fn(),
    } as ChannelMock),
  );
};
