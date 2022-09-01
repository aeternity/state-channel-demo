<script setup lang="ts">
import { computed } from 'vue';
import { default as Button } from '../generic-button/generic-button.vue';
import { useChannelStore } from '../../stores/channel';
import BigNumber from 'bignumber.js';
import { GameChannel } from '../../utils/game-channel/game-channel';
import { TransactionLog } from '../transaction/transaction.vue';
import { useTransactionsStore } from '../../stores/transactions';

const channel = useChannelStore().channel as GameChannel;

let offChainTxNo = 0;
const didReconnect = !!localStorage.getItem('gameState');
if (didReconnect) {
  // since we're not saving all the logs we can't just count the current transaction logs.
  offChainTxNo = channel.gameRound.index * 3 + 1;
  if (channel.gameRound.index === 1 && !channel.gameRound.isCompleted) {
    offChainTxNo -= 3;
  }
} else {
  for (const round of Object.values(useTransactionsStore().userTransactions)) {
    offChainTxNo += round.filter(
      (tx: TransactionLog) => tx.onChain === false
    ).length;
  }
}

const seconds = channel.autoplay.elapsedTime / 1000;
const title = computed(() =>
  earnings.value.isZero()
    ? "You didn't win or lose anything"
    : earnings.value.isGreaterThan(0)
    ? `You won ${earnings.value.dividedBy(1e18).toFormat(2)} AE`
    : `You lost ${earnings.value.abs().dividedBy(1e18).toFormat(2)} AE`
);
const txPerSecText = computed(
  () =>
    `${offChainTxNo} off-chain transaction${offChainTxNo > 1 ? 's' : ''} ${
      channel.autoplay.enabled ? `in ${seconds}sec` : ''
    }`
);
const roundsPlayed = computed(
  () =>
    `${channel.gameRound.index} round${
      channel.gameRound.index > 1 ? 's' : ''
    } played`
);
const earnings = computed(() => {
  const initialBalance = channel?.channelConfig?.responderAmount as BigNumber;
  const balance = channel?.balances.user as BigNumber;
  if (!initialBalance || !balance) return new BigNumber(0);
  return balance.minus(initialBalance);
});

const hasInsuffientBalance = computed(() => {
  const balance = channel?.balances.user as BigNumber;
  return balance.isLessThan(1e18);
});

function closeChannel() {
  channel?.closeChannel();
}

function continueAutoplay() {
  channel.continueAutoplay();
}
</script>

<template>
  <div class="end-screen">
    <div class="title">
      {{ title }}
    </div>
    <div class="text">
      {{ roundsPlayed }}
    </div>
    <div class="text">
      {{ txPerSecText }}
    </div>
    <div class="buttons">
      <Button
        v-if="channel.autoplay.enabled"
        text="Continue Autoplay"
        :disabled="channel.channelIsClosing || hasInsuffientBalance"
        @click="continueAutoplay()"
        :title="
          hasInsuffientBalance
            ? 'You don\'t have enough AE to continue autoplay'
            : ''
        "
      />
      <Button
        v-if="channel.autoplay.enabled"
        text="Close Channel"
        :disabled="channel.channelIsClosing"
        @click="closeChannel()"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '../../mediaqueries.scss';

.end-screen {
  grid-area: body;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  padding: var(--padding);
}
.title {
  font-size: 60px;
  font-weight: 600;
  color: var(--pink);
  @include for-phone-only {
    font-size: 34px;
    min-width: 100%;
    max-width: 100%;
  }
}
.text {
  margin-top: 10px;
  font-size: 35px;
  font-weight: 600;
  @include for-phone-only {
    font-size: 24px;
    min-width: 100%;
    max-width: 100%;
  }
}

.buttons {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  flex-wrap: wrap;
  .button {
    margin-left: 0;
  }
}
</style>
