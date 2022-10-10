import * as DOMUpdate from '../dom-manipulation/dom-manipulation';

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
    DOMUpdate.setMoveStatus('bot', 'Waiting for user...');
    DOMUpdate.resetSelections();
    resetPromise = null;
  }, 1000);
};

/**
 * @param {gameChannel} gameChannel
 */
export function DomMiddleware(gameChannel) {
  if (gameChannel.isOpen) {
    if (gameChannel.balances.user && gameChannel.balances.bot) {
      DOMUpdate.setParticipantBalance('user', gameChannel.balances.user);
      DOMUpdate.setParticipantBalance('bot', gameChannel.balances.bot);
    }
    DOMUpdate.setGameRoundIndex(gameChannel.gameRound.index);
    DOMUpdate.setStakeAmount(gameChannel.gameRound.stake);
    DOMUpdate.showGameInfo();

    const canReset = gameChannel.isOpen && gameChannel.shouldShowEndScreen;
    const canClose =
      gameChannel.isOpen &&
      !gameChannel.gameRound.userInAction &&
      gameChannel.channelIsClosing;

    if (canReset || canClose) {
      DOMUpdate.setResetDisability(false);
    } else DOMUpdate.setResetDisability(true);
    if (canClose) {
      DOMUpdate.setEndGameDisability(false);
    } else DOMUpdate.setEndGameDisability(true);

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
      let winner;
      switch (gameChannel.gameRound.winner) {
        case gameChannel.channelConfig.initiatorId:
          winner = 'bot';
          break;
        case gameChannel.channelConfig.responderId:
          winner = 'user';
          break;
      }
      DOMUpdate.colorizeSelections(winner);
    } else if (gameChannel.gameRound.botSelection == 'none') {
      handleReset(gameChannel);
    }
    if (gameChannel.shouldHandleReconnection) {
      handleReset(gameChannel);
    }
  }
}
