import { Selections, SignatureTypes } from '../game-channel/game-channel.enums';
import { formatDate, formatTxId } from '../utils/utils';
import { resetApp } from '../local-storage/local-storage';

/**
 * @typedef {import("bignumber.js").BigNumber} BigNumber
 * @typedef {import("../../types").TransactionLog} TransactionLog
 * @typedef {import("../../types").TransactionLogGroup} TransactionLogGroup
 * @typedef {'user' | 'bot'} Participant
 * @typedef {import("../game-channel/game-channel.enums").Selections} Selections
 * @typedef {import("../game-channel/game-channel").GameChannel} GameChannel
 */

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
 * @param {TransactionLog} transaction
 * @param {boolean} isUser
 */
export function renderTransactionLog(transaction, isUser) {
  const transactionsList = document.querySelector('.transactions-list');
  const transactionPair =
    document.querySelector(`#tx-pair-${transaction.id}`) ??
    createNewTransactionPair(transaction.id);
  const tx = createNewTransaction(transaction, isUser);
  if (transaction.signed === SignatureTypes.proposed) {
    transactionPair.prepend(tx);
  } else {
    transactionPair.append(tx);
  }
  transactionsList.scrollIntoView(false);
}

/**
 *
 * @param {string} id
 * @returns {HTMLDivElement} transactionPair
 */
function createNewTransactionPair(id) {
  const transactionsList = document.querySelector('.transactions-list');
  const txPair = document.createElement('div');
  transactionsList.appendChild(txPair);
  txPair.classList.add('transaction-pair');
  txPair.id = `tx-pair-${id}`;

  return txPair;
}

/**
 *
 * @param {TransactionLog} transaction
 * @param {boolean} isUser
 * @returns {HTMLDivElement} transaction
 */
function createNewTransaction(transaction, isUser) {
  const txEl = document.createElement('div');
  txEl.classList.add('transaction');
  if (transaction.onChain) txEl.classList.add('on-chain');
  if (isUser) txEl.classList.add('is-user');
  txEl.id = transaction.id;
  txEl.innerHTML = `
    <span>${isUser ? '[USER]' : '[BOT]'}</span>
    <span> - ${formatDate(transaction.timestamp)} -</span>
    <span title="${transaction.id ?? ''}">
      ${transaction.id ? `${formatTxId(transaction.id)} -` : ''}
    </span>
    <span>
      ${transaction.description} 
    </span>
    ${
      transaction.onChain ? '<span class="on-chain-pill">on-chain</span>' : ''
    }`;

  return txEl;
}

/**
 *
 * @param {string} id
 */
export function removeTransactionsPair(id) {
  const transactionsList = document.querySelector('.transactions-list');
  const transactionPair = document.querySelector(`#tx-pair-${id}`);
  transactionsList.removeChild(transactionPair);
  console.warn('removed transaction pair', id);
}

/**
 *
 * @param {TransactionLogGroup} transactionLogGroup
 * @param {boolean} isUser
 */
export function renderTransactionLogs(transactionLogGroup, isUser) {
  for (const rounds of Object.values(transactionLogGroup)) {
    for (const transaction of rounds) {
      renderTransactionLog(transaction, isUser);
    }
  }
}

/**
 *
 * @param {object} error
 */
export function addErrorLog(error) {
  if (document.querySelector(`#tx-pair-error-${error.timestamp}`)) return;

  const transactionsList = document.querySelector('.transactions-list');
  const errorEl = document.createElement('div');
  errorEl.classList.add('error', 'transaction');
  errorEl.innerHTML = `
    <span>${'[ERROR]'}</span>
    <span> - ${formatDate(error.timestamp)} -</span>
    <span>${error.message}</span>
    `;

  const txPair = createNewTransactionPair(`error-${error.timestamp}`);
  txPair.append(errorEl);
  transactionsList.appendChild(txPair);
  transactionsList.scrollIntoView(false);
}

/**
 *
 * @param {boolean} isVisible
 */
export function setLogsNotificationVisible(isVisible) {
  const notification = document.querySelector('#logs-notification');
  if (isVisible) {
    notification.style.display = 'flex';
  } else {
    notification.style.display = 'none';
  }
}

function handleTerminalExpand() {
  const terminal = document.querySelector('.transactions');
  const expandBtnIcon = document.querySelector('#expand-terminal-icon');
  terminal.classList.toggle('fullscreen');
  const icon = terminal.classList.contains('fullscreen')
    ? 'images/minimize.png'
    : 'svg/expand.svg';
  expandBtnIcon.src = `./src/assets/${icon}`;
}

/**
 *
 * @param {GameChannel} gameChannel
 */
export function handleAppMount(gameChannel) {
  document
    .querySelector('#logs-notification-close')
    .addEventListener('click', () => setLogsNotificationVisible(false));
  document
    .querySelector('#expand-terminal')
    .addEventListener('click', handleTerminalExpand);
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
