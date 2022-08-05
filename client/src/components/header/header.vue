<script setup lang="ts">
import { useChannelStore } from '../../stores/channel';
import PlayerInfo from '../player-info/player-info.vue';
import GameInfo from '../game-info/game-info.vue';
const channelStore = useChannelStore();
</script>

<template>
  <div class="header">
    <PlayerInfo name="You" :balance="channelStore.channel?.balances.user" />
    <div class="center">
      <GameInfo
        :stake="channelStore.channel?.game?.stake"
        :round="channelStore.channel?.game?.round.index"
        v-if="channelStore.channel?.isOpen"
      />
    </div>
    <PlayerInfo name="Bot" :balance="channelStore.channel?.balances.bot" />
  </div>
</template>

<style scoped lang="scss">
@import '../../mediaqueries.scss';

.header {
  grid-area: header;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--padding);
  padding-bottom: 5px;
  @include for-phone-only {
    height: 15%;
  }
}
</style>
