<script setup lang="ts">
import { useChannelStore } from '../stores/channel';
import PlayerInfo from './PlayerInfo.vue';
const channelStore = useChannelStore();
</script>

<template>
  <div class="header">
    <PlayerInfo
      name="You"
      :balance="channelStore.channelService?.balances.user"
    />
    <div class="center"></div>
    <PlayerInfo
      name="Bot"
      :balance="channelStore.channelService?.balances.bot"
    />
  </div>
</template>

<style scoped lang="scss">
.header {
  display: flex;
  justify-content: space-between;
  padding: var(--padding);
  padding-bottom: 5px;
  height: 10%;
}

.center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
