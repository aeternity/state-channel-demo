<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  isOpen?: boolean;
}>();

const isOpen = ref(props.isOpen ?? false);
function toggleAccordion() {
  isOpen.value = !isOpen.value;
}
</script>

<template>
  <div class="accordion">
    <button @click="toggleAccordion()" class="title" :aria-expanded="isOpen">
      <slot name="title" />
      <svg
        class="arrow"
        :class="{
          'rotate-180': isOpen,
          'rotate-0': !isOpen,
        }"
        fill="none"
        stroke="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 10"
        aria-hidden="true"
      >
        <path
          d="M15 1.2l-7 7-7-7"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <div class="accordion-content" v-show="isOpen">
      <slot name="content" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.title {
  display: flex;
  flex-direction: row;
  align-items: center;
  font-family: 'DM Mono', monospace;
  border: none;
  background-color: inherit;
  width: 100%;
  transition: background-color 0.2s ease-in-out;
  font-size: 16px;
  cursor: pointer;
  margin: 3px 0;

  &:hover {
    background-color: #f4f4f4;
  }
}
.arrow {
  width: 16px;
  height: 10px;
  margin-left: 20px;
  transition: transform 0.3s ease-in-out;
  &.rotate-180 {
    transform: rotate(180deg);
  }
  &.rotate-0 {
    transform: rotate(0deg);
  }
}
</style>
