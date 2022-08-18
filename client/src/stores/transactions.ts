import { defineStore } from 'pinia';
import { TransactionLog } from '../components/transaction/transaction.vue';

interface TransactionsStore {
  userTransactions: Array<Array<TransactionLog>>;
  botTransactions: Array<Array<TransactionLog>>;
}

export const useTransactionsStore = defineStore('transactions', {
  state: () =>
    ({
      userTransactions: [],
      botTransactions: [],
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
  },
});
