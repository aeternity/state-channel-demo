<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  text: string;
  type: 'success' | 'error' | 'info';
}>();

const isOpen = ref(true);

function closeNotification() {
  isOpen.value = false;
}
</script>

<template>
  <div class="notification" :class="type" v-if="isOpen">
    <div class="notification-text">
      {{ text }}
    </div>
    <img
      src="../../assets/svg/close.svg"
      alt="x"
      @click="closeNotification()"
    />
  </div>
</template>

<style scoped lang="scss">
@import '../../mediaqueries.scss';

.notification {
  display: flex;
  padding: 10px;
  border-radius: 5px;
  width: max-content;
  max-width: 90%;

  img {
    width: 16px;
    height: 16px;
    margin-left: 10px;
    cursor: pointer;
  }

  .notification-text {
    font-size: 16px;
  }

  @include for-phone-only {
    padding: 5px 10px;
    width: 100%;
    .notification-text {
      font-size: 14px;
    }
  }

  &.success {
    background-color: var(--green);
  }
  &.error {
    background-color: var(--pink);
  }
  &.info {
    background-color: orange;
  }
}
</style>
