import { defineStore } from 'pinia';
import { TransactionLog } from '../components/transaction/transaction.vue';

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
    },
    setUserTransactions(transactions: TransactionLogGroup) {
      this.userTransactions = transactions;
    },
    setBotTransactions(transactions: TransactionLogGroup) {
      this.botTransactions = transactions;
    },
  },
});
