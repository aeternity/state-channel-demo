import { defineStore } from 'pinia';

export const useChannelStore = defineStore('channel', {
  state: () => {
    return {
      channelIsOpen: false,
    };
  },
});
