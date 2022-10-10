import { gameChannel } from '../game-channel/game-channel';
import {
  enableAutoplayView,
  disableAutoplayView,
} from '../dom-manipulation/dom-manipulation';

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var checkbox = document.getElementById('autoplay_button');
    checkbox.addEventListener('change', function () {
      if (checkbox.checked) {
        checkbox.closest('.toggle__button').classList.add('active');
        gameChannel.engageAutoplay();
        enableAutoplayView(gameChannel);
      } else {
        checkbox.closest('.toggle__button').classList.remove('active');
        gameChannel.autoplay.enabled = false;
        disableAutoplayView(gameChannel);
      }
    });
  });
})();
