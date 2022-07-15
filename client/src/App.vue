<script setup lang="ts">
import ChannelInitialization from './components/ChannelInitialization.vue';
import TransactionsList from './components/TransactionsList.vue';
import Header from './components/Header.vue';
import RockPaperScissor from './components/RockPaperScissor.vue';
import PopUp from './components/PopUp.vue';
import { useChannelStore } from './stores/channel';
import { onBeforeUnmount, onMounted, toRaw } from 'vue';
import { getSdk, returnCoinsToFaucet } from './sdk/sdk';
import { ChannelService } from './sdk/sdkService';
import { AeSdk } from '@aeternity/aepp-sdk';

const channelStore = useChannelStore();

async function initChannel() {
  if (!channelStore.channelService) {
    throw new Error('SDK is not initialized');
  }
  await channelStore.channelService.initializeChannel();
}

onMounted(async () => {
  channelStore.channelService = new ChannelService(await getSdk());
});

onBeforeUnmount(async () => {
  if (channelStore.channelService?.sdk) {
    await returnCoinsToFaucet(toRaw(channelStore.channelService.sdk) as AeSdk);
  }
});
</script>

<template>
  <PopUp />
  <Header />
  <ChannelInitialization
    v-if="!channelStore.channelService?.isOpen"
    @initializeChannel="initChannel()"
  />
  <RockPaperScissor v-if="channelStore.channelService?.isOpen" />
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
