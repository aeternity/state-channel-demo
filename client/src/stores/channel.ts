import { ChannelService } from './../sdk/sdkService';
import { defineStore } from 'pinia';

interface ChannelStore {
  channelService?: ChannelService;
}

export const useChannelStore = defineStore<'channel', ChannelStore>('channel', {
  state: () => ({
    channelService: undefined,
  }),
});
