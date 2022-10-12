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
  document.getElementById(`${participant}-balance`).textContent =
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
  const image = wrapper.querySelector('img');

  wrapper.style.display = 'flex';
  image.src = `./src/assets/images/${selection}.png`;
  image.style.display = 'block';
}

export function hideSelections() {
  const userSelection = _getParticipantSelectionIcon('user');
  const botSelection = _getParticipantSelectionIcon('bot');
  userSelection.classList.remove('victory', 'defeat', 'draw');
  botSelection.classList.remove('victory', 'defeat', 'draw');
  userSelection.style.display = 'none';
  botSelection.style.display = 'none';
}

export function resetSelections() {
  hideSelections();
  setMoveSelectionDisability(false);
}

/**
 * @param {'user' | 'bot' | 'none'} winner
 */
export function colorizeSelections(winner) {
  if (winner !== 'user' && winner !== 'bot' && winner !== 'none') {
    throw new Error('invalid winner selector');
  }
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
export async function enableAutoplayView(gameChannel) {
  setMoveStatus('bot', '');
  hideElement('.selections'); //* these do different things
  hideSelections();

  if (!gameChannel.isOpen) {
    setMoveStatus('user', 'Initializing channel...');
    gameChannel.pollForContract(() => {
      // we need to check again because autoplay could be toggled in the meantime
      if (gameChannel.autoplay.enabled) {
        setMoveStatus('user', 'Autoplay engaged');
      } else disableAutoplayView(gameChannel);
    });
  } else setMoveStatus('user', 'Autoplay engaged');
}

/**
 *
 * @param {GameChannel} gameChannel
 */
export function disableAutoplayView(gameChannel) {
  if (!gameChannel.isOpen && !gameChannel.autoplay.enabled) {
    gameChannel.pollForContract(() => {
      // we need to check again because autoplay could be toggled in the meantime
      if (!gameChannel.autoplay.enabled) {
        showElement('.selections');
        setMoveStatus('user', '');
      }
    });
  }
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
        setMoveStatus('user', 'Initializing channel...');
        await gameChannel.initializeChannel();
      }
      gameChannel.gameRound.userInAction = true;
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