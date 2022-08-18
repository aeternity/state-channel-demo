<script setup lang="ts">
import { computed } from 'vue';
import { default as Button } from '../generic-button/generic-button.vue';
import { useChannelStore } from '../../stores/channel';
import BigNumber from 'bignumber.js';
import { useTransactionsStore } from '../../stores/transactions';
import { GameChannel } from '../../utils/game-channel/game-channel';

const channel = useChannelStore().channel as GameChannel;
const repoURL = 'https://github.com/aeternity/state-channel-demo';

// TODO we need to create the correct url from the channel close tx
// const explorerURL = 'https://explorer.testnet.aeternity.io/';

const transactions = useTransactionsStore().userTransactions.flat();
const seconds = (channel.channelCloseTime - channel.channelOpenTime) / 1000;
const title = computed(() =>
  earnings.value.isZero()
    ? "You didn't win or lose anything"
    : earnings.value.isGreaterThan(0)
    ? `You won ${earnings.value.dividedBy(1e18).toFormat(2)} AE`
    : `You lost ${earnings.value.abs().dividedBy(1e18).toFormat(2)} AE`
);
const text = computed(
  () => `${transactions.length} state-channel transactions in ${seconds}sec`
);
const earnings = computed(() => {
  const initialBalance = channel?.channelConfig?.responderAmount as BigNumber;
  const balance = channel?.balances.user as BigNumber;
  if (!initialBalance || !balance) return new BigNumber(0);
  return balance.minus(initialBalance);
});
</script>

<template>
  <div class="end-screen">
    <div class="title">
      {{ title }}
    </div>
    <div class="text">
      {{ text }}
    </div>
    <div class="links">
      <Button :url="repoURL" text="Fork a repo" />
      <Button text="Check Explorer" disabled />
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

.links {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  .button {
    margin-left: 0;
  }
}
</style>
