<script setup lang="ts">
import ChannelInitialization from './components/ChannelInitialization.vue';
import TransactionsList from './components/TransactionsList.vue';
import Header from './components/Header.vue';
import RockPaperScissors from './components/RockPaperScissors.vue';
import { useChannelStore } from './stores/channel';
import { onBeforeUnmount, onMounted, computed } from 'vue';
import { initSdk, returnCoinsToFaucet, sdk } from './sdk/sdkService';
import { GameChannel } from './sdk/GameChannel';

const channelStore = useChannelStore();

async function initChannel() {
  if (!channelStore.channel) {
    throw new Error('SDK is not initialized');
  }
  await channelStore.channel.initializeChannel();
}

const showTerminal = computed(() => channelStore.channel?.isOpen);

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
  <div class="container">
    <Header />
    <ChannelInitialization
      v-if="!channelStore.channel?.isOpen || !channelStore.channel?.contract"
      @initializeChannel="initChannel()"
    />
    <RockPaperScissors
      v-if="channelStore.channel?.isOpen && channelStore.channel.contract"
    />
    <TransactionsList v-if="showTerminal" />
  </div>
</template>

<style lang="scss">
@import './fonts.scss';
@import './mediaqueries.scss';

#app {
  font-family: 'Clash Display', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  scroll-behavior: smooth;

  .container {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 20% 50% 30%;
    gap: 0px 0px;
    grid-auto-flow: column;
    grid-template-areas:
      'header'
      'body'
      'transactions';
    height: 100vh;

    @include for-phone-only {
      min-height: 100vh;
      height: unset;
    }
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
