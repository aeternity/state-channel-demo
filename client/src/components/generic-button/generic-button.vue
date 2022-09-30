<script setup lang="ts">
defineProps<{
  text: string;
  url?: string;
}>();
</script>

<template>
  <a class="button" v-if="url" :href="url" target="_blank">{{ text }}</a>
  <button class="button" v-else>{{ text }}</button>
</template>

<style scoped lang="scss">
@import '../../mediaqueries.scss';

.button {
  display: inline-block;
  font-family: unset;
  font-size: 16px;
  font-weight: 400;
  border: none;
  user-select: none;
  cursor: pointer;
  padding: 10px;
  text-align: center;
  border-radius: 10px;
  margin: 10px;
  background-color: black;
  color: white;
  transition: background-color 50ms ease-in-out;
  text-decoration: none;

  &:hover {
    background-color: var(--green);
  }
  &:disabled {
    background-color: gray;
    cursor: not-allowed;
  }
  @include for-phone-only {
    font-size: 22px;
  }
}
</style>
