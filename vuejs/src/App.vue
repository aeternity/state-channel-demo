<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue';
</script>

<template>
  <img
    alt="Aeternity logo"
    src="./assets/logo.png"
    :style="{ width: '100px' }"
  />
  <HelloWorld msg="State Channel Demo Front" />
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
