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
    <div class="info" data-testid="info" v-if="stake">
      <span class="stake">
        STAKE: {{ stake.dividedBy(1e18).toFormat(2) }} Æ
      </span>
      <span class="info-seperator" v-if="round"> / </span>
      <span v-if="round">ROUND: {{ round }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '../../mediaqueries.scss';

.round-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .title {
    font-size: 50px;
    font-weight: bold;
    @include for-phone-only {
      font-size: 26px;
    }
    @include for-tablet-portrait-up {
      font-size: 40px;
    }
  }

  .info {
    font-size: 30px;
    text-align: right;
    font-weight: 500;
    @include for-phone-only {
      font-size: 14px;
      text-align: center;
    }
    @include for-tablet-portrait-up {
      font-size: 20px;
    }
  }
  .stake,
  .info-seperator {
    color: var(--pink);
  }
}
</style>
