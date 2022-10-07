import * as DOMUpdate from '../dom-manipulation/dom-manipulation';

export function DomMiddleware(gameChannel) {
  if (gameChannel.isOpen) {
    DOMUpdate.setParticipantBalance('user', gameChannel.balances.user);
    DOMUpdate.setParticipantBalance('bot', gameChannel.balances.bot);
  }

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
}
