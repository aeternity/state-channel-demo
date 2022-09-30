import { defineStore } from 'pinia';

export const useIsOnMobileStore = defineStore('isOnMobile', {
  state: () => ({
    isOnMobile: false,
  }),
});
