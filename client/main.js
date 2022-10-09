import './src/js/autoplay/autoplay-btn.controler';
import { initSdk } from './src/js/sdk-service/sdk-service';
import { handleAppMount } from './src/js/dom-manipulation/dom-manipulation';
import { gameChannel } from './src/js/game-channel/game-channel';

initSdk().then(async () => {
  await gameChannel.restoreGameState();
  handleAppMount(gameChannel);
});
