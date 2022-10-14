import * as DOMUpdate from '../dom-manipulation/dom-manipulation';
import { gameChannel } from '../game-channel/game-channel';

/**
 * @typedef {import("../game-channel/game-channel").GameChannel} gameChannel
 */

let resetPromise = null;

/**
 * @param {gameChannel} gameChannel
 */
const handleReset = async (gameChannel) => {
  if (resetPromise) return;
  resetPromise = setTimeout(() => {
    gameChannel.shouldHandleReconnection = false;
    resetPromise = null;
  }, 1000);
};

const resetRound = async () => {
  setTimeout(() => {
    if (gameChannel.autoplay.enabled) {
      DOMUpdate.setMoveStatus('bot', '');
      DOMUpdate.hideSelections();
      return;
    }
    DOMUpdate.setMoveStatus('bot', 'Waiting for user...');
    DOMUpdate.resetSelections();
    DOMUpdate.setMoveStatus('user', '');
  }, 3000);
};

/**
 * @param {gameChannel} gameChannel
 */
export function DomMiddleware(gameChannel) {
  if (gameChannel.error) DOMUpdate.addErrorLog(gameChannel.error);
  if (gameChannel.shouldShowEndScreen) {
    DOMUpdate.showEndScreen(gameChannel);
    DOMUpdate.setResetDisability(false);
  }
  if (gameChannel.savedResultsOnChainTxHash) {
    DOMUpdate.showShareButtons(gameChannel.savedResultsOnChainTxHash);
  }
  if (gameChannel.isOpen) {
    if (gameChannel.balances.user && gameChannel.balances.bot) {
      DOMUpdate.setParticipantBalance('user', gameChannel.balances.user);
      DOMUpdate.setParticipantBalance('bot', gameChannel.balances.bot);
    }
    DOMUpdate.setGameRoundIndex(gameChannel.gameRound.index);
    DOMUpdate.setCheckExplorerBtnUrl(gameChannel.channelConfig.responderId);
    DOMUpdate.setStakeAmount(gameChannel.gameRound.stake);
    DOMUpdate.showGameInfo();

    const canReset = !gameChannel.isOpen && gameChannel.shouldShowEndScreen;
    const canClose =
      gameChannel.contractAddress &&
      gameChannel.isOpen &&
      gameChannel.isFunded &&
      !gameChannel.gameRound.userInAction &&
      !gameChannel.channelIsClosing;

    if (canReset || canClose) {
      DOMUpdate.setResetDisability(false);
    } else DOMUpdate.setResetDisability(true);
    if (canClose) {
      DOMUpdate.setEndGameDisability(false);
    } else DOMUpdate.setEndGameDisability(true);
    if (!gameChannel.autoplay.enabled) {
      if (gameChannel.gameRound.userSelection != 'none') {
        DOMUpdate.setMoveStatus('user', 'Waiting for bot...');
        DOMUpdate.setMoveStatus('bot', '');
        DOMUpdate.setFinalizedSelection(
          'user',
          gameChannel.gameRound.userSelection
        );
        DOMUpdate.setMoveSelectionDisability(true);
      }

      if (gameChannel.gameRound.isCompleted) {
        DOMUpdate.setMoveStatus('user', '');
        DOMUpdate.setFinalizedSelection(
          'bot',
          gameChannel.gameRound.botSelection
        );
        let winner = 'none';
        switch (gameChannel.gameRound.winner) {
          case gameChannel.channelConfig.initiatorId:
            winner = 'bot';
            break;
          case gameChannel.channelConfig.responderId:
            winner = 'user';
            break;
        }
        DOMUpdate.colorizeSelections(winner);
        if (winner == 'user') {
          DOMUpdate.setMoveStatus('user', 'You win!');
        } else if (winner == 'bot') {
          DOMUpdate.setMoveStatus('bot', 'Bot wins!');
        } else {
          DOMUpdate.setMoveStatus('user', "It's a draw!");
        }
        resetRound();
      }
    }
    if (!gameChannel.gameRound.isCompleted) {
      if (gameChannel.gameRound.botSelection == 'none') {
        handleReset(gameChannel);
      }
      if (gameChannel.shouldHandleReconnection) {
        handleReset(gameChannel);
      }
    }
  }
}
