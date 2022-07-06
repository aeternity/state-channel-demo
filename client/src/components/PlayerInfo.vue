<script setup lang="ts">
defineProps<{
  name: string;
  balance?: number;
}>();
</script>

<template>
  <div class="player-info">
    <span class="name">{{ name }}</span>
    <span class="balance" data-testid="balance" v-if="balance"
      >{{ balance }} ae</span
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
    font-size: 20px;
    color: #de3f6b;
  }
}
</style>
