import {
  renderTransactionLog,
  renderTransactionLogs,
  removeTransactionsPair,
} from '../dom-manipulation/dom-manipulation.js';

export const transactionLogs = {
  userTransactions: {},
  botTransactions: {},
};

/**
 * @typedef {import("../../types").TransactionLog} TransactionLog
 * @typedef {import("../../types").TransactionLogGroup} TransactionLogGroup
 * @typedef {import('@aeternity/aepp-sdk/es/utils/encoder').Encoded} Encoded
 */

/**
 * @param {TransactionLog} transaction
 * @param {number} round
 */
export function addUserTransaction(transaction, round) {
  transactionLogs.userTransactions[round] ??= [];
  transactionLogs.userTransactions[round].push(transaction);
  renderTransactionLog(transaction, true);
}

/**
 * @param {TransactionLog} transaction
 * @param {number} round
 */
export function addBotTransaction(transaction, round) {
  transactionLogs.botTransactions[round] ??= [];
  transactionLogs.botTransactions[round].push(transaction);
  renderTransactionLog(transaction, false);
  pruneTransactions();
}

/**
 * @param {TransactionLogGroup} transactionLogGroup
 */
export function setUserTransactions(transactionLogGroup) {
  transactionLogs.userTransactions = transactionLogGroup;
  renderTransactionLogs(transactionLogGroup, true);
}

/**
 * @param {TransactionLogGroup} transactionLogGroup
 */
export function setBotTransactions(transactionLogGroup) {
  transactionLogs.botTransactions = transactionLogGroup;
  renderTransactionLogs(transactionLogGroup, false);
}

/**
 * @param {Encoded.TxHash} newId
 */
export function updateOpenChannelTransactions(newId) {
  const userTxIdx = transactionLogs.userTransactions[0].findIndex(
    (transaction) =>
      transaction.description ===
      'User co-signed bot’s transaction to initialise a state channel connection'
  );
  if (userTxIdx !== -1)
    transactionLogs.userTransactions[0][userTxIdx].id = newId;

  const botTxIdx = transactionLogs.botTransactions[0].findIndex(
    (transaction) =>
      transaction.description ===
      'Bot signed a transaction to initialise state channel connection'
  );
  if (botTxIdx !== -1) transactionLogs.botTransactions[0][botTxIdx].id = newId;
}

// only keep the last 50 rounds
export function pruneTransactions() {
  if (Object.keys(transactionLogs.botTransactions).length > 50) {
    const keys = Object.keys(transactionLogs.botTransactions);
    // don't delete round 0, because it contains the on-chain transactionLogs
    const firstKey = keys[1];

    for (const transaction of Object.values(
      transactionLogs.botTransactions[parseInt(firstKey)]
    )) {
      removeTransactionsPair(transaction.id);
    }
    delete transactionLogs.botTransactions[parseInt(firstKey)];
    delete transactionLogs.userTransactions[parseInt(firstKey)];
  }
}
