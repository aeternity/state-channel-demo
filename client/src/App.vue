<script setup lang="ts">
import ChannelInitialization from './components/ChannelInitialization.vue';
import TransactionsList from './components/TransactionsList.vue';
import Header from './components/Header.vue';
import RockPaperScissors from './components/RockPaperScissors.vue';
import PopUp from './components/PopUp.vue';
import { useChannelStore } from './stores/channel';
import { useGameStore } from './stores/game';
import { onBeforeUnmount, onMounted, toRaw } from 'vue';
import { getSdk, returnCoinsToFaucet } from './sdk/sdkService';
import { GameChannel } from './sdk/GameChannel';
import GameManager from './game/GameManager';
import { AeSdk } from '@aeternity/aepp-sdk';

const channelStore = useChannelStore();
const gameStore = useGameStore();

async function initChannel() {
  if (!channelStore.channel) {
    throw new Error('SDK is not initialized');
  }
  await channelStore.channel.initializeChannel();
}

onMounted(async () => {
  channelStore.channel = new GameChannel(await getSdk());
  gameStore.gameManager = new GameManager();
});

onBeforeUnmount(async () => {
  if (channelStore.channel?.sdk) {
    await returnCoinsToFaucet(toRaw(channelStore.channel.sdk) as AeSdk);
  }
});
</script>

<template>
  <PopUp />
  <Header />
  <ChannelInitialization
    v-if="!channelStore.channel?.isOpen || !channelStore.channel?.contract"
    @initializeChannel="initChannel()"
  />
  <RockPaperScissors
    v-if="channelStore.channel?.isOpen && channelStore.channel.contract"
  />
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
