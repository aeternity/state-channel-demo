<script setup lang="ts">
import ChannelInitialization from './components/ChannelInitialization.vue';
import TransactionsList from './components/TransactionsList.vue';
import Header from './components/Header.vue';
import RockPaperScissors from './components/RockPaperScissors.vue';
import PopUp from './components/PopUp.vue';
import { useGameStore } from './stores/game';
import { onBeforeUnmount, onMounted } from 'vue';
import { initSdk, returnCoinsToFaucet, sdk } from './sdk/sdkService';
import { gameChannel, initGameChannel } from './sdk/GameChannel';
import GameManager from './game/GameManager';

const gameStore = useGameStore();

onMounted(async () => {
  await initSdk();
  gameStore.gameManager = new GameManager();
});

onBeforeUnmount(async () => {
  if (sdk) {
    await returnCoinsToFaucet();
  }
});
</script>

<template>
  <PopUp />
  <Header />
  <ChannelInitialization
    v-if="!gameChannel.isOpen || !gameChannel.contract"
    @initializeChannel="initGameChannel()"
  />
  <RockPaperScissors v-if="gameChannel.isOpen && gameChannel.contract" />
  <TransactionsList />
</template>

<style lang="scss">
@import './fonts.scss';
@import './mediaqueries.scss';

#app {
  font-family: 'Clash Display', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  display: flex;
  flex-direction: column;
  height: 100vh;
  justify-content: space-between;
  @include for-phone-only {
    min-height: 100vh;
    height: unset;
  }
}
:root {
  --green: #42bd65;
  --pink: #d7315b;
  --padding: 60px;
  @include for-phone-only {
    --padding: 12px;
  }
}
body {
  margin: 0;
}
</style>
