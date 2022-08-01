<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useChannelStore } from '../stores/channel';
import { useTransactionsStore } from '../stores/transactions';
import SingleTransaction from './SingleTransaction.vue';

const EXPAND_ICON = new URL('../assets/svg/expand.svg', import.meta.url).href;
const MINIMISE_ICON = new URL('../assets/minimize.png', import.meta.url).href;

const channelStore = useChannelStore();
const transactionStore = useTransactionsStore();
const { userTransactions, botTransactions } = storeToRefs(transactionStore);

const isFullscreen = ref(false);
const isMinimized = computed(() => !channelStore.channel?.isOpen);
</script>

<template>
  <div
    class="transactions"
    data-testid="transactions"
    :class="{ minimized: isMinimized, fullscreen: isFullscreen }"
  >
    <!-- User Terminal  -->
    <div class="terminal">
      <div class="header">
        <div class="title">Your Terminal</div>
      </div>
      <div
        class="transactions-list"
        v-if="!isMinimized && userTransactions.length > 0"
      >
        <SingleTransaction
          v-for="transaction in userTransactions"
          :transaction="transaction"
          :key="transaction.hash"
        />
      </div>
      <div class="transactions-list" v-else-if="!isMinimized">
        <div class="empty-list">No transactions yet</div>
      </div>
    </div>
    <!-- Bot Terminal  -->
    <div class="terminal">
      <div class="header">
        <div class="title">Bot Terminal</div>
        <button
          class="expand"
          aria-label="expand_button"
          :disabled="!channelStore.channel?.isOpen"
          @click="isFullscreen = !isFullscreen"
        >
          <img
            class="icon"
            :src="isFullscreen ? MINIMISE_ICON : EXPAND_ICON"
            alt="Expand icon"
          />
          <span> {{ isFullscreen ? 'Minimize' : 'Expand' }} </span>
        </button>
      </div>
      <div
        class="transactions-list"
        v-if="!isMinimized && botTransactions.length > 0"
      >
        <SingleTransaction
          v-for="transaction in botTransactions"
          :transaction="transaction"
          :key="transaction.hash"
        />
      </div>
      <div class="transactions-list" v-else-if="!isMinimized">
        <div class="empty-list">No transactions yet</div>
      </div>
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
  display: flex;
  flex-direction: row;

  &.fullscreen {
    position: absolute;
    z-index: 1;
    bottom: 0;
    right: 0;
    width: calc(100% - var(--padding) * 2);
    height: calc(100vh - var(--padding) * 2);
  }

  &.minimized {
    height: 4%;
    padding: 20px var(--padding);
    & .header {
      margin-bottom: 0;
      & .title,
      & .expand {
        opacity: 0.25;
      }
    }
  }
  .terminal {
    width: 50%;
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
          font-size: 16px;
        }
      }
      .expand {
        user-select: none;
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
          span {
            display: none;
          }
        }
        .icon {
          width: 28px;
          height: 28px;
          margin-right: 15px;
          @include for-phone-only {
            width: 16px;
            height: 16px;
            margin-right: 0px;
          }
        }
      }
    }
  }
  .transactions-list {
    display: flex;
    flex-direction: column-reverse;
    .empty-list {
      font-family: 'DM Mono', monospace;
      font-size: 16px;
    }
  }
}
</style>
