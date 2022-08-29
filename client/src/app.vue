<script setup lang="ts">
import ChannelInitialization from './components/channel-initialization/channel-initialization.vue';
import TransactionsList from './components/transaction-list/transaction-list.vue';
import Header from './components/header/header.vue';
import EndScreen from './components/end-screen/end-screen.vue';
import { useChannelStore } from './stores/channel';
import { onMounted, computed, ref } from 'vue';
import { initSdk } from './utils/sdk-service/sdk-service';
import { GameChannel } from './utils/game-channel/game-channel';
import GameScreen from './components/game-screen/game-screen.vue';

const channelStore = useChannelStore();

const isOnMobile = ref(false);

async function initChannel() {
  if (!channelStore.channel) {
    throw new Error('SDK is not initialized');
  }
  await channelStore.channel.initializeChannel();
}

const showTerminal = computed(
  () =>
    channelStore.channel?.isOpen || channelStore.channel?.shouldShowEndScreen
);

const showingAutoplayTxLogs = computed(
  () =>
    channelStore.channel?.autoplay.enabled &&
    channelStore.channel?.contractAddress &&
    !channelStore.channel?.shouldShowEndScreen
);

onMounted(async () => {
  // check if is on mobile
  isOnMobile.value = window.innerWidth < 768;
  if (isOnMobile.value) return;

  await initSdk();
  const channel = new GameChannel();
  channelStore.channel = channel;
  await channelStore.channel.restoreGameState();
});
</script>

<template>
  <div v-if="isOnMobile" class="mobile">
    <p>Unfortunately this demo is not supported on mobile devices yet.</p>
    <p>Please use another device.</p>
  </div>
  <div
    v-else
    class="container"
    :class="{ noSelections: showingAutoplayTxLogs }"
  >
    <Header />
    <EndScreen v-if="channelStore.channel?.shouldShowEndScreen" />
    <ChannelInitialization
      v-else-if="
        !channelStore.channel?.isOpen || !channelStore.channel?.contractAddress
      "
      @initializeChannel="initChannel()"
    />
    <GameScreen v-else-if="!channelStore.channel.autoplay.enabled" />
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

  > .container {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 15% 55% 30%;
    gap: 0px 0px;
    grid-auto-flow: column;
    grid-template-areas:
      'header'
      'body'
      'transactions';
    height: 100vh;

    &.noSelections {
      grid-template-rows: 20% 5% 75%;
    }
    @include for-big-desktop-up {
      grid-template-rows: 20% 50% 30%;
    }
  }
  > .mobile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    text-align: center;
    padding: 10px;
    height: calc(100vh - 20px);
  }
}
:root {
  --green: #42bd65;
  --pink: #d7315b;
  --gray: #f4f4f4;
  --padding: 20px;
  @include for-big-desktop-up {
    --padding: 60px;
  }
  @include for-phone-only {
    --padding: 12px;
  }
}
body {
  margin: 0;
}
</style>
