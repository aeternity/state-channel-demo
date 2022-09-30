<script setup lang="ts">
import { BigNumber } from 'bignumber.js';

defineProps<{
  name: string;
  balance?: Omit<BigNumber, '_isBigNumber'>;
}>();
</script>

<template>
  <div class="player-info">
    <span class="name">{{ name }}</span>
    <span class="balance" data-testid="balance" v-if="balance">
      {{ balance.dividedBy(1e18).toFormat(2) }} æ
    </span>
  </div>
</template>

<style scoped lang="scss">
@import '../../mediaqueries.scss';

.player-info {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr;
  grid-template-areas: 'empty name balance';
  align-items: baseline;
  gap: 0px 0px;

  .name {
    grid-area: name;
    font-size: 50px;
    font-weight: bold;
    text-align: center;
    @include for-phone-only {
      font-size: 26px;
    }
  }

  .balance {
    grid-area: balance;
    font-size: 30px;
    text-align: right;
    margin-right: 20px;
    font-weight: 500;
    color: var(--pink);
    @include for-phone-only {
      font-size: 16px;
    }
  }
}
</style>
