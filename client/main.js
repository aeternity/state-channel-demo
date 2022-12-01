import { initSdk, refreshSdkAccount } from './src/js/sdk-service/sdk-service';
import {
  handleAppMount,
  handleSharedResults,
} from './src/js/dom-manipulation/dom-manipulation';
import { gameChannel } from './src/js/game-channel/game-channel';
import { getSavedState } from './src/js/local-storage/local-storage';

export async function init() {
  handleSharedResults();
  await initSdk();
  const savedState = getSavedState();
  if (!savedState) {
    refreshSdkAccount();
  } else if (savedState?.gameRound.userInAction) {
    localStorage.clear();
    refreshSdkAccount();
  } else {
    await gameChannel.restoreGameState(savedState);
  }
  await gameChannel.buildContract();
  handleAppMount(gameChannel);
}

if (!(import.meta.env.MODE === 'test')) {
  init();
}
