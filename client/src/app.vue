<script setup lang="ts">
import ChannelInitialization from './components/channel-initialization/channel-initialization.vue';
import TransactionsList from './components/transaction-list/transaction-list.vue';
import Header from './components/header/header.vue';
import RockPaperScissors from './components/rock-paper-scissors/rock-paper-scissors.vue';
import EndScreen from './components/end-screen/end-screen.vue';
import { useChannelStore } from './stores/channel';
import { onBeforeUnmount, onMounted, computed } from 'vue';
import {
  initSdk,
  returnCoinsToFaucet,
  sdk,
} from './utils/sdk-service/sdk-service';
import { GameChannel } from './utils/game-channel/game-channel';

const channelStore = useChannelStore();

async function initChannel() {
  if (!channelStore.channel) {
    throw new Error('SDK is not initialized');
  }
  await channelStore.channel.initializeChannel();
}

const showTerminal = computed(
  () => channelStore.channel?.isOpen || channelStore.channel?.isClosedByUser
);

onMounted(async () => {
  await initSdk();
  const channel = new GameChannel();
  channelStore.channel = channel;
  await channelStore.channel.restoreGameState();
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
    <EndScreen v-if="channelStore.channel?.isClosedByUser" />
    <ChannelInitialization
      v-else-if="
        !channelStore.channel?.isOpen || !channelStore.channel?.contractAddress
      "
      @initializeChannel="initChannel()"
    />
    <RockPaperScissors v-else />
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
