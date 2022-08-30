<script setup lang="ts">
import { Selections } from '../../utils/game-channel/game-channel.types';

const props = defineProps<{
  type: Selections;
}>();

const icon = new URL(`../../assets/images/${props.type}.png`, import.meta.url)
  .href;
</script>

<template>
  <div class="selection-icon">
    <img :src="icon" :alt="props.type" />
  </div>
</template>

<style scoped lang="scss">
@import '../../mediaqueries.scss';

.selection-icon {
  user-select: none;
  background-color: var(--gray);
  border-radius: 15px;
  padding: 10px;
  img {
    width: 80px;
  }
  @include for-big-desktop-up {
    padding: 20px;
    img {
      width: 100px;
    }
  }
  @include for-phone-only {
    padding: 10px;
    img {
      width: 60px;
    }
  }
}
</style>
