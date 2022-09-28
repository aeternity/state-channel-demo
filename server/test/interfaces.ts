export interface ChannelMock {
  listeners: {
    [eventName: string]: (...args: any[]) => void;
  };
  on: (eventName: string, listener: (...args: any[]) => void) => void;
  disconnect: () => void;
}
