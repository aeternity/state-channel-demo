<script setup lang="ts">
import ChannelInitialization from './components/ChannelInitialization.vue';
import TransactionsList from './components/TransactionsList.vue';
import Header from './components/Header.vue';
import RockPaperScissor from './components/RockPaperScissor.vue';
import PopUp from './components/PopUp.vue';
import { useChannelStore } from './stores/channel';

const channelStore = useChannelStore();
</script>

<template>
  <PopUp />
  <Header />
  <ChannelInitialization v-if="!channelStore.channelIsOpen" />
  <RockPaperScissor v-if="channelStore.channelIsOpen" />
  <TransactionsList />
</template>

<style lang="scss">
@import url('http://fonts.cdnfonts.com/css/clash-display');
@import url('https://fonts.googleapis.com/css2?family=DM+Mono&display=swap');

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
