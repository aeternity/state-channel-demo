import { defineStore } from 'pinia';
import { TransactionLog } from '../components/transaction/transaction.vue';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';

export interface TransactionLogGroup {
  [round: number]: Array<TransactionLog>;
}

interface TransactionsStore {
  userTransactions: TransactionLogGroup;
  botTransactions: TransactionLogGroup;
}

export const useTransactionsStore = defineStore('transactions', {
  state: () =>
    ({
      userTransactions: {},
      botTransactions: {},
    } as TransactionsStore),
  actions: {
    addUserTransaction(transaction: TransactionLog, round: number) {
      this.userTransactions[round] ??= [];
      this.userTransactions[round].push(transaction);
    },
    addBotTransaction(transaction: TransactionLog, round: number) {
      this.botTransactions[round] ??= [];
      this.botTransactions[round].push(transaction);
      this.pruneTransactions();
    },
    setUserTransactions(transactions: TransactionLogGroup) {
      this.userTransactions = transactions;
    },
    setBotTransactions(transactions: TransactionLogGroup) {
      this.botTransactions = transactions;
    },
    updateOpenChannelTransactions(newId: Encoded.TxHash) {
      const userTxIdx = this.userTransactions[0].findIndex(
        (transaction) => transaction.description === 'Open state channel'
      );
      if (userTxIdx !== -1) this.userTransactions[0][userTxIdx].id = newId;

      const botTxIdx = this.botTransactions[0].findIndex(
        (transaction) => transaction.description === 'Open state channel'
      );
      if (botTxIdx !== -1) this.botTransactions[0][botTxIdx].id = newId;
    },
    // only keep the last 50 rounds
    pruneTransactions() {
      if (Object.keys(this.botTransactions).length > 50) {
        const keys = Object.keys(this.botTransactions);
        // don't delete round 0, because it contains the on-chain transactions
        const firstKey = keys[1];
        delete this.botTransactions[parseInt(firstKey)];
        delete this.userTransactions[parseInt(firstKey)];
      }
    },
  },
});
