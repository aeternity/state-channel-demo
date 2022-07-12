<script setup lang="ts">
import { computed, ref } from 'vue';
import { useChannelStore } from '../stores/channel';
import SingleTransaction, { Transaction } from './SingleTransaction.vue';

const transactions = ref<Transaction[]>([]);
const channelStore = useChannelStore();
const isMinimized = computed(() => !channelStore.channelIsOpen);
</script>

<template>
  <div class="transactions" :class="{ minimized: isMinimized }">
    <div class="header">
      <div class="title">Transactions</div>
      <button
        class="autoplay"
        aria-label="autoplay_button"
        :disabled="!channelStore.channelIsOpen"
      >
        <img
          class="icon"
          src="../assets/svg/autoplay.svg"
          alt="Auto play icon"
        />
        <span> Auto play </span>
      </button>
    </div>
    <div
      class="transactions-list"
      v-if="!isMinimized && transactions.length > 0"
    >
      <SingleTransaction
        v-for="transaction in transactions"
        :transaction="transaction"
        :key="transaction.hash"
      />
    </div>
    <div class="transactions-list" v-else-if="!isMinimized">
      <div class="empty-list">No transactions yet</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '../mediaqueries.scss';

.transactions {
  background-color: #f4f4f4;
  padding: var(--padding);
  height: 30%;
  transition: height 0.6s cubic-bezier(0.25, 1, 0.5, 1);
  &.minimized {
    height: 4%;
    padding: 20px var(--padding);
    & .header {
      margin-bottom: 0;
      & .title,
      & .autoplay {
        opacity: 0.25;
      }
    }
  }
  .header {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-bottom: 20px;
    .title {
      font-size: 28px;
      font-weight: 500;
      @include for-phone-only {
        font-size: 22px;
      }
    }
    .autoplay {
      display: flex;
      flex-direction: row;
      align-items: center;
      font-size: 28px;
      font-weight: 500;

      background: unset;
      border: unset;
      font-family: unset;
      color: unset;

      &:hover {
        cursor: pointer;
      }
      &:disabled {
        cursor: not-allowed;
      }
      @include for-phone-only {
        font-size: 22px;
      }
      .icon {
        width: 28px;
        height: 28px;
        margin-right: 15px;
        @include for-phone-only {
          width: 22px;
          height: 22px;
        }
      }
    }
  }
  .transactions-list {
    .empty-list {
      font-family: 'DM Mono', monospace;
      font-size: 16px;
    }
  }
}
</style>
