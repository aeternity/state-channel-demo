import { setMoveSelectionDisability } from './src/js/dom-manipulation/dom-manipulation';
import { gameChannel } from './src/js/game-channel/game-channel';
import { Selections } from './src/js/game-channel/game-channel.enums';
import { initSdk } from './src/js/sdk-service/sdk-service';
import './src/js/autoplay/autoplay-btn.controler';

initSdk();

document.querySelectorAll('.selections button').forEach((button, index) => {
  button.addEventListener('click', async () => {
    if (!gameChannel.isOpen && !gameChannel.isOpening) {
      setMoveSelectionDisability(true);
      await gameChannel.initializeChannel();
    }
    const selection = Object.values(Selections)[index];
    console.log(selection);
    if (gameChannel.contractAddress)
      await gameChannel.setUserSelection(selection);
    else
      await gameChannel.pollForContract(() =>
        gameChannel.setUserSelection(selection)
      );
  });
});
