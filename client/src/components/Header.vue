<script setup lang="ts">
import PlayerInfo from './PlayerInfo.vue';
import GameInfo from './GameInfo.vue';
import { gameChannel } from '../sdk/GameChannel';
</script>

<template>
  <div class="header">
    <PlayerInfo name="You" :balance="gameChannel.balances.user" />
    <div class="center">
      <GameInfo
        :stake="gameChannel.game?.stake"
        :round="gameChannel.game?.round"
        v-if="gameChannel.isOpen"
      />
    </div>
    <PlayerInfo name="Bot" :balance="gameChannel.balances.bot" />
  </div>
</template>

<style scoped lang="scss">
@import '../mediaqueries.scss';

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--padding);
  padding-bottom: 5px;
  height: 10%;
  @include for-phone-only {
    height: 15%;
  }
}
</style>
