<script setup lang="ts">
import { useChannelStore } from '../../stores/channel';
import PlayerInfo from '../player-info/player-info.vue';
import RockPaperScissors from '../rock-paper-scissors/rock-paper-scissors.vue';

const channelStore = useChannelStore();
</script>

<template>
  <div class="game-screen">
    <div class="user">
      <PlayerInfo name="You" :balance="channelStore.channel?.balances.user" />
      <RockPaperScissors :isPlayerUser="true" />
    </div>
    <div class="bot">
      <PlayerInfo name="Bot" :balance="channelStore.channel?.balances.bot" />
      <RockPaperScissors />
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '../../mediaqueries.scss';

.game-screen {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 0px 0px;
  grid-template-areas: 'user bot';
  grid-area: body;
}
.user,
.bot {
  display: grid;
  grid-template-rows: 15% 85%;
}
.user {
  grid-area: user;
  border-right: 1px solid var(--pink);
}
.bot {
  grid-area: bot;
  border-left: 1px solid var(--pink);
}
</style>
