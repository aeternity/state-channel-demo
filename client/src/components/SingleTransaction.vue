<script setup lang="ts">
export interface Transaction {
  hash: string;
  status: string;
}
defineProps<{
  transaction: Transaction;
}>();
</script>

<template>
  <div class="transaction" :class="{ failed: transaction.status === 'failed' }">
    {{ `Hash: ${transaction.hash} Status: ${transaction.status}` }}
  </div>
</template>

<style scoped lang="scss">
@import '../mediaqueries.scss';

.transaction {
  font-family: 'DM Mono', monospace;
  font-size: 16px;

  text-align: left;
  color: var(--green);
  @include for-phone-only {
    font-size: 11px;
  }
}
.failed {
  color: var(--pink);
}
</style>
