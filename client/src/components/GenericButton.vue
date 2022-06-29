<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>

<template>
  <button>{{ text }}</button>
</template>

<style scoped lang="scss">
button {
  font-family: unset;
  border: none;
  user-select: none;
  cursor: pointer;
  padding: 10px;
  text-align: center;
  border-radius: 10px;
  margin: 10px;
  background-color: black;
  color: white;
  transition: background-color 200ms ease-in-out;

  &:hover {
    background-color: green;
  }
  &:disabled {
    background-color: gray;
    cursor: not-allowed;
  }
}
</style>
