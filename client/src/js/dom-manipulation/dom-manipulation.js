/**
 * @typedef {import("bignumber.js").BigNumber} BigNumber
 * @typedef {'user' | 'bot'} Participant
 * @typedef {import("../game-channel/game-channel.enums").Selections} Selections
 */

import { resetApp } from '../local-storage/local-storage';

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

/**
 * @param {boolean} disability
 */
export function setMoveSelectionDisability(isDisabled) {
  document.querySelector('.selections').style.display = isDisabled
    ? 'none'
    : 'initial';
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
  const wrapper = document.querySelector(
    `.${participant} .finalized-selection .selection-icon`
  );
  wrapper.querySelector('img').src = `./src/assets/images/${selection}.png`;
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

export function handleAppMount() {
  document.getElementById('reset').addEventListener('click', resetApp);
}
