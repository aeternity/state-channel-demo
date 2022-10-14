import './src/js/autoplay/autoplay-btn.controler';
import { initSdk, refreshSdkAccount } from './src/js/sdk-service/sdk-service';
import { handleAppMount } from './src/js/dom-manipulation/dom-manipulation';
import { gameChannel } from './src/js/game-channel/game-channel';
import { getSavedState } from './src/js/local-storage/local-storage';

initSdk().then(async () => {
  const savedState = getSavedState();
  if (!savedState) {
    refreshSdkAccount();
  } else if (savedState?.gameRound.userInAction) {
    localStorage.clear();
    refreshSdkAccount();
  } else {
    await gameChannel.restoreGameState(savedState);
  }
  handleAppMount(gameChannel);
});
