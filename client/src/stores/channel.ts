import { GameChannel } from '../utils/game-channel/game-channel';
import { defineStore } from 'pinia';

interface ChannelStore {
  channel?: GameChannel;
}

export const useChannelStore = defineStore<'channel', ChannelStore>('channel', {
  state: () => ({
    channel: undefined,
  }),
});
