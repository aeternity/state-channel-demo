<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useChannelStore } from '../../stores/channel';
import { useTransactionsStore } from '../../stores/transactions';
import SingleTransaction from '../transaction/transaction.vue';

const EXPAND_ICON = new URL('../assets/svg/expand.svg', import.meta.url).href;
const MINIMISE_ICON = new URL('../assets/minimize.png', import.meta.url).href;

const channelStore = useChannelStore();
const transactionStore = useTransactionsStore();
const { userTransactions, botTransactions } = storeToRefs(transactionStore);

const isFullscreen = ref(false);
</script>

<template>
  <div
    class="transactions"
    data-testid="transactions"
    :class="{ fullscreen: isFullscreen }"
  >
    <div class="terminals">
      <!-- User Terminal  -->
      <div class="terminal">
        <div class="header">
          <div class="title">Your Terminal</div>
          <button
            class="expand mobile-only"
            aria-label="expand_button_mobile"
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
        <div class="transactions-list" v-if="userTransactions.length > 0">
          <SingleTransaction
            v-for="transaction in userTransactions"
            :transaction="transaction"
            :key="transaction.id"
          />
        </div>
        <div class="transactions-list" v-else>
          <div class="empty-list">No transactions yet</div>
        </div>
      </div>
      <!-- Bot Terminal  -->
      <div class="terminal">
        <div class="header">
          <div class="title">
            Bot Terminal
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
        </div>
        <div class="transactions-list" v-if="botTransactions.length > 0">
          <SingleTransaction
            v-for="transaction in botTransactions"
            :transaction="transaction"
            :key="transaction.id"
          />
        </div>
        <div class="transactions-list" v-else>
          <div class="empty-list">No transactions yet</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '../../mediaqueries.scss';

.transactions {
  grid-area: transactions;
  background-color: #f4f4f4;
  padding: var(--padding);
  padding-bottom: min(20px, var(--padding));
  max-width: 100%;
  transition: height 0.6s cubic-bezier(0.25, 1, 0.5, 1);
  display: flex;
  flex-direction: column;

  &.fullscreen {
    position: absolute;
    z-index: 1;
    bottom: 0;
    right: 0;
    padding-bottom: var(--padding);
    width: calc(100% - var(--padding) * 2);
    height: calc(100vh - var(--padding) * 2);
  }
  .header {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-bottom: 10px;
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: #f4f4f4;
    .title {
      font-weight: 500;
      width: 100%;
      display: flex;
      justify-content: space-between;
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
        display: none;
      }
      &.mobile-only {
        display: none;
        @include for-phone-only {
          display: flex;
          span {
            font-size: 16px;
          }
        }
      }
      .icon {
        width: 28px;
        height: 28px;
        margin-right: 15px;
        @include for-phone-only {
          width: 16px;
          height: 16px;
        }
        @include for-tablet-portrait-up {
          width: 18px;
          height: 18px;
          margin-right: 5px;
        }
        @include for-tablet-landscape-up {
          width: 24px;
          height: 24px;
          margin-right: 10px;
        }
        @include for-desktop-up {
          width: 28px;
          height: 28px;
          margin-right: 15px;
        }
      }
    }
    .title,
    .expand {
      @include for-phone-only {
        font-size: 16px;
      }
      @include for-tablet-portrait-up {
        font-size: 18px;
      }
      @include for-tablet-landscape-up {
        font-size: 24px;
      }
      @include for-desktop-up {
        font-size: 28px;
      }
    }
  }
  .terminals {
    display: flex;
    overflow-y: auto;
    .terminal {
      width: 50%;
      height: max-content;
      .transactions-list {
        display: flex;
        flex-direction: column-reverse;
        .empty-list {
          font-family: 'DM Mono', monospace;
          font-size: 16px;
        }
      }
    }
    @include for-phone-only {
      flex-direction: column;
      overflow-y: unset;
      height: 100%;
      .terminal {
        width: 100%;
        height: 50%;
        overflow-y: auto;
      }
    }
  }
}
</style>
