<script setup lang="ts">
import PlayerInfo from './PlayerInfo.vue';

const userBalance = undefined;
const botBalance = undefined;
</script>

<template>
  <div class="header">
    <PlayerInfo name="You" :balance="userBalance" />
    <div class="center"></div>
    <PlayerInfo name="Bot" :balance="botBalance" />
  </div>
</template>

<style scoped lang="scss">
.header {
  display: flex;
  justify-content: space-between;
  padding: var(--padding);
  padding-bottom: 0;
  height: 10%;
}

.center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
