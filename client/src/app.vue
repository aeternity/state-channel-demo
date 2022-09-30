<script setup lang="ts">
import ChannelInitialization from './components/channel-initialization/channel-initialization.vue';
import TransactionsList from './components/transaction-list/transaction-list.vue';
import Header from './components/header/header.vue';
import EndScreen from './components/end-screen/end-screen.vue';
import { useChannelStore } from './stores/channel';
import { onMounted, computed, ref } from 'vue';
import { initSdk, NODE_URL } from './utils/sdk-service/sdk-service';
import { GameChannel } from './utils/game-channel/game-channel';
import GameScreen from './components/game-screen/game-screen.vue';
import { decode, Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import { Node } from '@aeternity/aepp-sdk';
import { useIsOnMobileStore } from './stores/is-on-mobile';

const channelStore = useChannelStore();

const error = ref();

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

// check if we have a transaction hash in the url
const urlParams = new URLSearchParams(window.location.search);
const th = urlParams.get('th') as Encoded.TxHash;
const resultsFromSharedLink = ref();

onMounted(async () => {
  if (window.innerWidth < 599) useIsOnMobileStore().isOnMobile = true;
  if (th) {
    // if we have a th, we need to show the end-screen
    const node = new Node(NODE_URL);
    node
      .getTransactionByHash(th)
      .then((tx) => {
        resultsFromSharedLink.value = JSON.parse(
          decode(tx.tx.payload as Encoded.Bytearray).toString()
        );
      })
      .catch((e) => {
        console.error(e);
        error.value = e;
      });
  } else {
    await initSdk();
    const channel = new GameChannel();
    channelStore.channel = channel;
    await channelStore.channel.restoreGameState();
  }
});
</script>

<template>
  <div class="container" :class="{ noSelections: showingAutoplayTxLogs }">
    <Header :responderId="resultsFromSharedLink?.responderId" />
    <div class="error" v-if="error">
      <p>
        {{
          error.message.includes('Invalid hash')
            ? "The given transaction hash doesn't exist"
            : 'Something went wrong.'
        }}
      </p>
      <p>
        {{ error }}
      </p>
    </div>
    <EndScreen
      v-else-if="
        channelStore.channel?.shouldShowEndScreen || resultsFromSharedLink
      "
      :resultsFromSharedLink="resultsFromSharedLink"
    />
    <ChannelInitialization
      v-else-if="
        !th &&
        (!channelStore.channel?.isOpen ||
          !channelStore.channel?.contractAddress)
      "
      @initializeChannel="initChannel()"
    />
    <GameScreen v-else-if="!th && !channelStore.channel?.autoplay.enabled" />
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
    > .error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 25px;
      text-align: center;
    }
    @include for-big-desktop-up {
      grid-template-rows: 20% 50% 30%;
    }
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
