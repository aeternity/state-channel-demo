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
 * @param {transaction} TransactionLog
 * @param {number} round
 */
export function addUserTransaction(transaction, round) {
  transactionLogs.userTransactions[round] ??= [];
  transactionLogs.userTransactions[round].push(transaction);
}

/**
 * @param {transaction} TransactionLog
 * @param {number} round
 */
export function addBotTransaction(transaction, round) {
  transactionLogs.botTransactions[round] ??= [];
  transactionLogs.botTransactions[round].push(transaction);
}

/**
 * @param {TransactionLogGroup} transactionLogs
 */
export function setUserTransactions(transactionLogs) {
  transactionLogs.userTransactions = transactionLogs;
}

/**
 * @param {TransactionLogGroup} transactionLogs
 */
export function setBotTransactions(transactionLogs) {
  transactionLogs.botTransactions = transactionLogs;
}

/**
 * @param {Encoded.TxHash} newId
 */
export function updateOpenChannelTransactions(newId) {
  const userTxIdx = transactionLogs.userTransactions[0].findIndex(
    (transaction) => transaction.description === 'Open state channel'
  );
  if (userTxIdx !== -1)
    transactionLogs.userTransactions[0][userTxIdx].id = newId;

  const botTxIdx = transactionLogs.botTransactions[0].findIndex(
    (transaction) => transaction.description === 'Open state channel'
  );
  if (botTxIdx !== -1) transactionLogs.botTransactions[0][botTxIdx].id = newId;
}

// only keep the last 50 rounds
export function pruneTransactions() {
  if (Object.keys(transactionLogs.botTransactions).length > 50) {
    const keys = Object.keys(transactionLogs.botTransactions);
    // don't delete round 0, because it contains the on-chain transactionLogs
    const firstKey = keys[1];
    delete transactionLogs.botTransactions[parseInt(firstKey)];
    delete transactionLogs.userTransactions[parseInt(firstKey)];
  }
}
