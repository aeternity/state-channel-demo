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
    <span class="balance" data-testid="balance" v-if="balance"
      >{{ balance.dividedBy(1e18) }} ae</span
    >
  </div>
</template>

<style scoped lang="scss">
.player-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;

  .name {
    font-size: 50px;
    font-weight: bold;
  }

  .balance {
    font-size: 30px;
    text-align: right;
    font-weight: 500;
    color: var(--pink);
  }
}
</style>
