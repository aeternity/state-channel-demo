import { Selections } from '../game-channel/game-channel.enums';

/**
 * @typedef {import("bignumber.js").BigNumber} BigNumber
 * @typedef {'user' | 'bot'} Participant
 * @typedef {import("../game-channel/game-channel.enums").Selections} Selections
 * @typedef {import("../game-channel/game-channel").GameChannel} GameChannel
 */

import { resetApp } from '../local-storage/local-storage';

/**
 * @param {Participant} participant
 */
function _getParticipantSelectionIcon(participant) {
  if (participant !== 'user' && participant !== 'bot')
    throw new Error('Invalid participant');

  return document.querySelector(
    `.${participant} .finalized-selection .selection-icon`
  );
}

/**
 * @param {string} id
 */
export function disableButton(id) {
  const button = document.getElementById(id);
  if (!button) {
    throw new Error(`Button with id ${id} not found`);
  }
  button.disabled = true;
}

/**
 * @param {string} id
 */
export function enableButton(id) {
  const button = document.getElementById(id);
  if (!button) {
    throw new Error(`Button with id ${id} not found`);
  }
  button.disabled = false;
}

/**
 * @param {string} selector
 * @param {string} className
 */
export function addClassToElement(selector, className) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element with selector ${selector} not found`);
  }
  element.classList.add(className);
}

/**
 * @param {string} selector
 * @param {string} className
 */
export function removeClassFromElement(selector, className) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element with selector ${selector} not found`);
  }
  element.classList.remove(className);
}

/**
 * @param {string} selector
 */
export function showElement(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element with selector ${selector} not found`);
  }
  element.style.display = 'initial';
}

/**
 * @param {string} selector
 */
export function hideElement(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element with selector ${selector} not found`);
  }
  element.style.display = 'none';
}

export function showGameInfo() {
  document.querySelector('.info').style.opacity = '1';
}

/**
 * @param {boolean} disability
 */
export function setMoveSelectionDisability(isDisabled) {
  document.querySelector('.selections').style.display = isDisabled
    ? 'none'
    : 'flex';
}
/**
 * @param {BigNumber} amount
 */
export function setStakeAmount(amount) {
  document.querySelector('.stake-value').textContent = amount
    .dividedBy(1e18)
    .toFormat(2);
}

/**
 * @param {number} round
 */
export function setGameRoundIndex(index) {
  document.querySelector('.round-index').textContent = index;
}

/**
 * @param {Participant} participant
 * @param {BigNumber} balance
 */
export function setParticipantBalance(participant, balance) {
  if (participant != 'user' && participant != 'bot') {
    throw new Error('invalid participant selector');
  }
  document.querySelector(`.${participant} .balance`).textContent =
    balance.dividedBy(1e18).toFormat(2) + 'æ';
}

/**
 * @param {Participant} participant
 * @param {Selections} selection
 */
export function setFinalizedSelection(participant, selection) {
  if (participant != 'user' && participant != 'bot') {
    throw new Error('invalid participant selector');
  }
  const wrapper = _getParticipantSelectionIcon(participant);

  wrapper.style.display = 'flex';
  wrapper.querySelector('img').src = `./src/assets/images/${selection}.png`;
}

export function resetSelections() {
  const userSelection = _getParticipantSelectionIcon('user');
  const botSelection = _getParticipantSelectionIcon('bot');
  userSelection.classList.remove('victory', 'defeat', 'draw');
  botSelection.classList.remove('victory', 'defeat', 'draw');
  userSelection.style.display = 'none';
  botSelection.style.display = 'none';
  setMoveSelectionDisability(false);
}

/**
 * @param {'user' | 'bot' | 'none'} result
 */
export function colorizeSelections(winner) {
  const userSelection = _getParticipantSelectionIcon('user');
  const botSelection = _getParticipantSelectionIcon('bot');
  if (winner == 'user') {
    userSelection.classList.add('victory');
    botSelection.classList.add('defeat');
  } else if (winner == 'bot') {
    userSelection.classList.add('defeat');
    botSelection.classList.add('victory');
  }
}

/**
 * @param {Participant} participant
 * @param {string} status
 */
export function setMoveStatus(participant, status) {
  if (participant != 'user' && participant != 'bot') {
    throw new Error('invalid participant selector');
  }
  const statusElement = document.querySelector(`.${participant} .status`);
  statusElement.textContent = status;
}

/**
 * @param {boolean} isDisabled
 */
export function setResetDisability(isDisabled) {
  document.querySelector('#reset').disabled = isDisabled;
}

/**
 * @param {boolean} isDisabled
 */
export function setEndGameDisability(isDisabled) {
  document.querySelector('#end-game').disabled = isDisabled;
}

/**
 *
 * @param {GameChannel} gameChannel
 */
export function handleAppMount(gameChannel) {
  document.getElementById('reset').addEventListener('click', resetApp);
  document.querySelectorAll('.selections button').forEach((button, index) => {
    button.addEventListener('click', async () => {
      if (!gameChannel.isOpen && !gameChannel.isOpening) {
        setMoveSelectionDisability(true);
        await gameChannel.initializeChannel();
      }
      const selection = Object.values(Selections)[index];
      if (gameChannel.contractAddress)
        await gameChannel.setUserSelection(selection);
      else
        await gameChannel.pollForContract(() =>
          gameChannel.setUserSelection(selection)
        );
    });
  });
}
