import { Selections, SignatureTypes } from '../game-channel/game-channel.enums';
import { formatDate, formatTxId, openShareWindow } from '../utils/utils';
import { resetApp } from '../local-storage/local-storage';
import { renderEndScreen } from './end-screen';
import { decode, Node } from '@aeternity/aepp-sdk';
import { NODE_URL } from '../sdk-service/sdk-service';
import facebookSVG from '../../assets/svg/facebook.svg';
import linkedinSVG from '../../assets/svg/linkedin.svg';
import twitterSVG from '../../assets/svg/twitter.svg';
import whatsappSVG from '../../assets/svg/whatsapp.svg';
import paperIMG from '../../assets/images/paper.png';
import scissorsIMG from '../../assets/images/scissors.png';
import rockIMG from '../../assets/images/rock.png';
import { gameChannel } from '../game-channel/game-channel';
/**
 * @typedef {import("bignumber.js").BigNumber} BigNumber
 * @typedef {import('@aeternity/aepp-sdk/es/utils/encoder').Encoded} Encoded
 * @typedef {import("../../types").TransactionLog} TransactionLog
 * @typedef {import("../../types").TransactionLogGroup} TransactionLogGroup
 * @typedef {import("../../types").ErrorLog} ErrorLog
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
  element.style.display = 'flex';
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
 * @param {boolean} isDisabled
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
 * @param {Encoded.AccountAddress} responderId
 */
export function setCheckExplorerBtnUrl(responderId) {
  const checkExplorerBtn = document.querySelector('#check-explorer-btn');
  checkExplorerBtn.href = `https://testnet.aenalytics.org/accounts/${responderId}`;
  checkExplorerBtn.classList.remove('disabled');
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
    balance.dividedBy(1e18).toFormat(2) + 'Æ';
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

  let icon = '';
  switch (selection) {
    case 'rock':
      icon = rockIMG;
      break;
    case 'paper':
      icon = paperIMG;
      break;
    case 'scissors':
      icon = scissorsIMG;
      break;
    default:
      return;
  }

  wrapper.style.display = 'flex';
  image.src = new URL(icon, import.meta.url).href;
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
        toggleAutoplayBtn(false);
      }
    });
  } else if (gameChannel.isOpen) {
    setMoveStatus('user', '');
    showElement('.selections');
    toggleAutoplayBtn(false);
  }
}

/**
 *
 * @param {TransactionLog} transaction
 * @param {'user' | 'bot' | 'info'} type
 */
export function renderTransactionLog(transaction, type, round) {
  const transactionsList = document.querySelector('.transactions-list');
  const roundGroup =
    document.querySelector(`#round-group-${round}`) ??
    createNewRoundGroup(round);
  const transactionPair =
    document.querySelector(`#tx-pair-${transaction.id}`) ??
    createNewTransactionPair(transaction.id, roundGroup);
  const tx = createNewTransaction(transaction, type);
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
 * @param {HTMLElement} roundGroup
 * @returns {HTMLDivElement} transactionPair
 */
function createNewTransactionPair(id, roundGroup) {
  const txPair = document.createElement('div');
  roundGroup
    ? roundGroup.appendChild(txPair)
    : document.querySelector('.transactions-list').appendChild(txPair);
  txPair.classList.add('transaction-pair');
  txPair.id = `tx-pair-${id ?? Math.floor(Math.random() * 1000)}`;

  return txPair;
}
/**
 *
 * @param {number} round
 * @returns HTMLDivElement
 */
function createNewRoundGroup(round) {
  const transactionsList = document.querySelector('.transactions-list');
  const roundGroup = document.createElement('div');
  roundGroup.id = `round-group-${round}`;
  transactionsList.appendChild(roundGroup);

  return roundGroup;
}

/**
 *
 * @param {TransactionLog} transaction
 * @param {'user' | 'bot' | 'info'} type
 * @returns {HTMLDivElement} transaction
 */
function createNewTransaction(transaction, type) {
  const txEl = document.createElement('div');
  txEl.classList.add('transaction');
  let id = transaction.id;
  if (transaction.onChain) txEl.classList.add('on-chain');
  if (type === 'user') txEl.classList.add('is-user');
  else if (type === 'info') {
    txEl.classList.add('is-info');
    id = transaction.id ? `round-${transaction.id}` : '';
  }
  txEl.id = id;
  txEl.innerHTML = `
    <span>[${type.toUpperCase()}]</span>
    <span> - ${formatDate(transaction.timestamp)} -</span>
    <span title="${id ?? ''}">
      ${id ? `${formatTxId(id)} -` : ''}
    </span>
    <span>
      ${transaction.description} 
    </span>
    ${
      transaction.onChain != undefined
        ? transaction.onChain
          ? '<span class="on-chain-pill">on-chain</span>'
          : '<span class="off-chain-pill">off-chain</span>'
        : ''
    }`;

  return txEl;
}

/**
 * @param {number} round
 */
export function removeRoundGroup(round) {
  try {
    const roundGroup = document.querySelector(`#round-group-${round}`);
    roundGroup.remove();
  } catch (e) {
    return;
  }
}

/**
 *
 * @param {TransactionLogGroup} transactionLogGroup
 * @param {'user' | 'bot' | 'info'} type
 */
export function renderTransactionLogs(transactionLogGroup, type) {
  const roundIndexes = Object.keys(transactionLogGroup);
  for (const rounds of Object.values(transactionLogGroup)) {
    for (const transaction of rounds) {
      renderTransactionLog(transaction, type, roundIndexes[0]);
    }
    roundIndexes.shift();
  }
}

/**
 * @param {ErrorLog} error
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

export function showEndScreen() {
  renderEndScreen();
}

/**
 *
 * @param {Encoded.TxHash} hash
 */
export function showShareButtons(hash) {
  const linkToShare = window.location.origin.concat(
    window.location.pathname,
    '?th=',
    hash
  );
  const message =
    'I just played a game of rock-paper-scissors on the æternity blockchain.\n';
  const twitterΜessage =
    message.replace('æternity', '@aeternity') +
    '#Æ #æternity #AE #aeternityblockchain #web3 #blockchaintechnology\n';

  const fbUrl = `https://www.facebook.com/sharer/sharer.php?&u=${encodeURIComponent(
    linkToShare
  )}`;

  const linkedInUrl = `https://www.linkedin.com/shareArticle?url=${encodeURIComponent(
    linkToShare
  )}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    twitterΜessage
  )}&url=${encodeURIComponent(linkToShare)}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    message + linkToShare
  )}`;

  const html = ` 
    <div class="share-buttons">
      <span class="text">Share your results </span>
      <div class="button" id="fb" >
        <img src="${
          new URL(facebookSVG, import.meta.url).href
        }" alt="Facebook" />
      </div>
      <div class="button" id="linkedin" >
        <img src="
        ${new URL(linkedinSVG, import.meta.url).href}" alt="LinkedIn" />
      </div>
      <div class="button" id="twitter" >
        <img src="
        ${new URL(twitterSVG, import.meta.url).href}" alt="Twitter" />
      </div>
      <div class="button" id="whatsapp" >
        <img src="
        ${new URL(whatsappSVG, import.meta.url).href}" alt="WhatsApp" />
      </div>
    </div>`;
  const shareResults = document.querySelector('.share-results');
  const shareButtons = document.createElement('div');
  shareButtons.innerHTML = html;
  shareButtons.querySelector('#fb').onclick = () => openShareWindow(fbUrl);
  shareButtons.querySelector('#linkedin').onclick = () =>
    openShareWindow(linkedInUrl);
  shareButtons.querySelector('#twitter').onclick = () =>
    openShareWindow(twitterUrl);
  shareButtons.querySelector('#whatsapp').onclick = () =>
    openShareWindow(whatsappUrl);

  shareResults.removeChild(shareResults.querySelector('#saving-results'));
  shareResults.appendChild(shareButtons);
}

/**
 *
 * @param {GameChannel} gameChannel
 */
function addAutoplayListener(gameChannel) {
  const checkbox = document.getElementById('autoplay_button');
  checkbox.addEventListener('change', function () {
    if (checkbox.checked) {
      toggleAutoplayBtn(true);
      gameChannel.engageAutoplay();
      enableAutoplayView(gameChannel);
    } else {
      toggleAutoplayBtn(false);
      gameChannel.autoplay.enabled = false;
      disableAutoplayView(gameChannel);
    }
  });
}

/**
 *
 * @param {boolean} isChecked
 */
function toggleAutoplayBtn(isChecked) {
  if (gameChannel.gameRound.userInAction) setMoveSelectionDisability(true);

  const checkbox = document.getElementById('autoplay_button');
  if (isChecked) {
    checkbox.closest('.toggle__button').classList.add('active');
  } else {
    checkbox.closest('.toggle__button').classList.remove('active');
    document.getElementById('autoplay_button').checked = false;
  }
}

function addErrorListener() {
  window.addEventListener('error', function (error) {
    console.error(error);
    addErrorLog({
      message: error,
      timestamp: Date.now(),
    });
  });

  window.addEventListener('unhandledrejection', function (error) {
    if (
      [
        'UnexpectedChannelMessageError',
        'ChannelCallError',
        'UnknownChannelStateError',
      ].includes(error.reason.name)
    )
      return gameChannel.handleLastContractCall();
    console.error(error);
    addErrorLog({
      message:
        error.reason.message ?? 'Unhandled rejection, see browser console',
      timestamp: Date.now(),
    });
  });
}

function showChannelIsClosing() {
  hideSelections();
  setMoveSelectionDisability(true);
  document.querySelector('.autoplay').style.display = 'none';
  setMoveStatus('user', 'Channel is closing...');
  setMoveStatus('bot', '');
}

/**
 *
 * @param {GameChannel} gameChannel
 */
export function handleAppMount(gameChannel) {
  addErrorListener(gameChannel);
  addAutoplayListener(gameChannel);
  document
    .querySelector('#logs-notification-close')
    .addEventListener('click', () => setLogsNotificationVisible(false));
  document.getElementById('end-game').addEventListener('click', async () => {
    showChannelIsClosing();
    await gameChannel.closeChannel();
    document.getElementById('end-game').textContent = 'Start Over';
    document.getElementById('end-game').onclick = resetApp;
    enableButton('end-game');
  });
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

export function handleSharedResults() {
  const urlParams = new URLSearchParams(window.location.search);
  const th = urlParams.get('th');
  let resultsFromSharedLink = '';
  if (th) {
    // if we have a th, we need to show the end-screen
    const node = new Node(NODE_URL);
    node
      .getTransactionByHash(th)
      .then((tx) => {
        resultsFromSharedLink = JSON.parse(decode(tx.tx.payload).toString());
        renderEndScreen(resultsFromSharedLink);
        setCheckExplorerBtnUrl(resultsFromSharedLink.responderId);
        hideElement('#end-game');
      })
      .catch((e) => {
        console.error(e);
      });
  }
}
