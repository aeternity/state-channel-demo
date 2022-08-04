<script setup lang="ts">
import ChannelInitialization from './components/ChannelInitialization.vue';
import TransactionsList from './components/TransactionsList.vue';
import Header from './components/Header.vue';
import RockPaperScissors from './components/RockPaperScissors.vue';
import { useChannelStore } from './stores/channel';
import { onBeforeUnmount, onMounted } from 'vue';
import { initSdk, returnCoinsToFaucet, sdk } from './sdk/sdkService';
import { GameChannel } from './sdk/GameChannel';

const channelStore = useChannelStore();

async function initChannel() {
  if (!channelStore.channel) {
    throw new Error('SDK is not initialized');
  }
  await channelStore.channel.initializeChannel();
}

onMounted(async () => {
  await initSdk();
  channelStore.channel = new GameChannel();
});

onBeforeUnmount(async () => {
  if (sdk) {
    await returnCoinsToFaucet();
  }
});
</script>

<template>
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
