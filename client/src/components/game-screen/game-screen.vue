<script setup lang="ts">
import { useChannelStore } from '../../stores/channel';
import PlayerInfo from '../player-info/player-info.vue';
import RockPaperScissors from '../rock-paper-scissors/rock-paper-scissors.vue';
import LoadingAnimation from '../loading-animation/loading-animation.vue';

const channelStore = useChannelStore();
</script>

<template>
  <div class="channel-closing" v-if="channelStore.channel?.channelIsClosing">
    <div>Channel is closing...</div>
    <LoadingAnimation />
  </div>
  <div class="game-screen" v-else>
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

.channel-closing {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 40px;
  font-weight: 500;
  @include for-phone-only {
    font-size: 26px;
  }
}
.game-screen {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 0px 0px;
  grid-template-areas: 'user bot';
  grid-area: body;
  @include for-phone-only {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
}
.user,
.bot {
  display: grid;
  grid-template-rows: 15% 85%;
  @include for-phone-only {
    margin-top: 10px;
  }
}
.user {
  grid-area: user;
  border-right: 1px solid var(--pink);
  @include for-phone-only {
    height: 65%;
    border-right: none;
    border-bottom: 1px solid var(--pink);
  }
}
.bot {
  grid-area: bot;
  border-left: 1px solid var(--pink);
  @include for-phone-only {
    height: 35%;
    border-left: none;
  }
}
</style>
