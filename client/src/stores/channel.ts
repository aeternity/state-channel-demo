import { GameChannel } from '../sdk/GameChannel';
import { defineStore } from 'pinia';

interface ChannelStore {
  channel?: GameChannel;
}

export const useChannelStore = defineStore<'channel', ChannelStore>('channel', {
  state: () => ({
    channel: undefined,
  }),
});
