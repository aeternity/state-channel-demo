import { defineStore } from 'pinia';
import { TransactionLog } from '../components/transaction/transaction.vue';

interface TransactionsStore {
  userTransactions: Array<TransactionLog>;
  botTransactions: Array<TransactionLog>;
}

export const useTransactionsStore = defineStore('transactions', {
  state: () =>
    ({
      userTransactions: [],
      botTransactions: [],
    } as TransactionsStore),
  actions: {
    addUserTransaction(transaction: TransactionLog) {
      this.userTransactions.push(transaction);
    },
    addBotTransaction(transaction: TransactionLog) {
      this.botTransactions.push(transaction);
    },
  },
});
