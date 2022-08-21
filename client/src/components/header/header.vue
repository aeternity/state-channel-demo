<script setup lang="ts">
import { useChannelStore } from '../../stores/channel';
import PlayerInfo from '../player-info/player-info.vue';
import GameInfo from '../game-info/game-info.vue';
import { resetApp } from '../../main';

const channelStore = useChannelStore();

function reset() {
  resetApp();
}
</script>

<template>
  <div class="header" v-if="!channelStore.channel?.isClosedByUser">
    <PlayerInfo name="You" :balance="channelStore.channel?.balances.user" />
    <div class="center">
      <GameInfo
        :stake="channelStore.channel?.gameRound?.stake"
        :round="channelStore.channel?.gameRound?.index"
        v-if="channelStore.channel?.isOpen"
      />
    </div>
    <PlayerInfo name="Bot" :balance="channelStore.channel?.balances.bot" />
  </div>
  <div v-else class="header end-screen">
    <img src="../../assets/logo.png" alt="?" @click="reset()" />
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

  &.end-screen {
    img {
      width: 110px;
      cursor: pointer;
    }
  }
}
</style>
