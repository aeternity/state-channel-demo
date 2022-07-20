<script setup lang="ts">
import { BigNumber } from 'bignumber.js';

defineProps<{
  stake?: Omit<BigNumber, '_isBigNumber'>;
  round?: number;
}>();
</script>

<template>
  <div class="round-info">
    <span class="title">Game</span>
    <span class="info" data-testid="info" v-if="stake">
      <span class="stake"
        >STAKE: {{ stake.dividedBy(1e18).toFormat(2) }} AE</span
      >
      <span class="info-seperator" v-if="round"> / </span>
      <span v-if="round">ROUND: {{ round }}</span></span
    >
  </div>
</template>

<style scoped lang="scss">
.round-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .title {
    font-size: 50px;
    font-weight: bold;
  }

  .info {
    font-size: 30px;
    text-align: right;
    font-weight: 500;
  }
  .stake,
  .info-seperator {
    color: var(--pink);
  }
}
</style>
