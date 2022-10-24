import { gameChannel } from '../game-channel/game-channel';
import { BigNumber } from 'bignumber.js';
import { resetApp } from '../local-storage/local-storage';
/**
 * @typedef { import("../game-channel/game-channel").GameChannel } GameChannel
 * @typedef { import('../../types').SharedResults } SharedResults
 *
 */

/**
 *
 * @param {SharedResults} sharedResults
 */
export function getRoundsPlayed(sharedResults) {
  let rounds = sharedResults?.rounds ?? gameChannel.gameRound.index;
  rounds = isLastRoundCompleted(sharedResults) ? rounds : rounds - 1;
  return rounds;
}

/**
 *
 * @param {SharedResults} sharedResults
 */
function isLastRoundCompleted(sharedResults) {
  return (
    sharedResults?.isLastRoundCompleted ?? gameChannel.gameRound.isCompleted
  );
}

/**
 *
 * @param {SharedResults} sharedResults
 */
function getOffChainTxNo(sharedResults) {
  return getRoundsPlayed(sharedResults) * 3 + 1;
}

/**
 *
 * @param {SharedResults} sharedResults
 */
export const getOffChainTxMessage = (sharedResults) => `${getOffChainTxNo(
  sharedResults
)} off-chain 
  transaction${getOffChainTxNo(sharedResults) > 1 ? 's' : ''}`;

/**
 *
 * @param {SharedResults} sharedResults
 */
const getRoundsPlayedMessage = (sharedResults) => `${getRoundsPlayed(
  sharedResults
)} 
  round${getRoundsPlayed(sharedResults) > 1 ? 's' : ''} played`;

/**
 *
 * @param {SharedResults} sharedResults
 * @returns {BigNumber} earnings
 */
function getEarnings(sharedResults) {
  if (sharedResults?.earnings) return new BigNumber(sharedResults.earnings);
  const initialBalance = gameChannel?.channelConfig?.responderAmount;
  const balance = gameChannel?.balances.user;
  if (!initialBalance || !balance) return new BigNumber(0);
  return balance.minus(initialBalance);
}

/**
 *
 * @returns {string} earnings message
 */
export function getEarningsMessage() {
  const earnings = getEarnings();
  return earnings.isZero()
    ? `The user didn't win or lose anything`
    : `The ${earnings.isGreaterThan(0) ? 'user' : 'bot'} won
    ${earnings.dividedBy(1e18).abs().toFormat(2)}Æ`;
}

/**
 *
 * @param {SharedResults} sharedResults
 */
function getTitle(sharedResults) {
  const user = sharedResults ? 'The player' : 'You';
  const earnings = getEarnings(sharedResults);
  return earnings.isZero()
    ? `${user} didn't win or lose anything`
    : earnings.isGreaterThan(0)
    ? `${user} won ${earnings.dividedBy(1e18).toFormat(2)}Æ`
    : `${user} lost ${earnings.abs().dividedBy(1e18).toFormat(2)}Æ`;
}

/**
 *
 * @param {SharedResults} sharedResults
 */
const getEndScreenHtml = (sharedResults) => `
  <div class="title">
    ${getTitle(sharedResults)}
  </div>
  <div class="text">
    ${getRoundsPlayedMessage(sharedResults)}
  </div>
  <div class="text">
    ${getOffChainTxMessage(sharedResults)}
  </div>
    ${
      !sharedResults
        ? `<div class="share-results">        
        <div class="text" id="saving-results" >
          Saving results...
        </div>
      </div>`
        : `<button class="button" id="start-your-own-game">
        Start your own game
      </button>`
    }`;

/**
 *
 * @param {SharedResults} sharedResults
 */
export function renderEndScreen(sharedResults) {
  const endScreen = document.getElementById('end-screen');
  const gameScreen = document.querySelector('.game-screen');
  endScreen.innerHTML = getEndScreenHtml(sharedResults);
  if (sharedResults) {
    // hide terminal
    document
      .querySelector('#app')
      .removeChild(document.querySelector('.transactions'));
    document
      .getElementById('start-your-own-game')
      .addEventListener('click', () => resetApp());
  }
  gameScreen.style.display = 'none';
  endScreen.style.display = 'flex';
}
