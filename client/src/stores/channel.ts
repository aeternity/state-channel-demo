import { defineStore } from 'pinia';

interface ChannelStore {
  channelIsOpen: boolean;
  channelStatus: string;
  error?: {
    status: number;
    statusText: string;
    message: string;
  };
}

export const useChannelStore = defineStore('channel', {
  state: () =>
    ({
      channelIsOpen: false,
      channelStatus: '',
      error: undefined,
    } as ChannelStore),
});
