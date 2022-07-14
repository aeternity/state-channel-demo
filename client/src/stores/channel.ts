import BigNumber from 'bignumber.js';
import { defineStore } from 'pinia';

interface ChannelState {
  channelIsOpen: boolean;
  balances: {
    user: BigNumber | undefined;
    bot: BigNumber | undefined;
  };
}

export const useChannelStore = defineStore<'channel', ChannelState>('channel', {
  state: () => {
    return {
      channelIsOpen: false,
      balances: {
        user: undefined,
        bot: undefined,
      },
    };
  },
});
