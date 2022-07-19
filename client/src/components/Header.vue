<script setup lang="ts">
import { useChannelStore } from '../stores/channel';
import PlayerInfo from './PlayerInfo.vue';
import GameInfo from './GameInfo.vue';
const channelStore = useChannelStore();
</script>

<template>
  <div class="header">
    <PlayerInfo name="You" :balance="channelStore.channel?.balances.user" />
    <div class="center">
      <GameInfo
        :stake="channelStore.channel?.game?.stake"
        :round="channelStore.channel?.game?.round"
        v-if="channelStore.channel?.isOpen"
      />
    </div>
    <PlayerInfo name="Bot" :balance="channelStore.channel?.balances.bot" />
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
