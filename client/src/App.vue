<script setup lang="ts">
import ChannelInitialization from './components/ChannelInitialization.vue';
</script>

<template>
  <img
    alt="Aeternity logo"
    src="./assets/logo.png"
    :style="{ width: '100px' }"
  />
  <Suspense>
    <ChannelInitialization />
  </Suspense>
</template>

<style>
@import url('http://fonts.cdnfonts.com/css/clash-display');
#app {
  font-family: 'Clash Display', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
