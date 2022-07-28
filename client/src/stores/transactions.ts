import { defineStore } from 'pinia';
import { Transaction } from '../components/SingleTransaction.vue';

interface TransactionsStore {
  userTransactions: Array<Transaction>;
  botTransactions: Array<Transaction>;
}

export const useTransactionsStore = defineStore('transactions', {
  state: () =>
    ({
      userTransactions: [],
      botTransactions: [],
    } as TransactionsStore),
  actions: {
    addUserTransaction(transaction: Transaction) {
      this.userTransactions.push(transaction);
    },
    addBotTransaction(transaction: Transaction) {
      this.botTransactions.push(transaction);
    },
  },
});
