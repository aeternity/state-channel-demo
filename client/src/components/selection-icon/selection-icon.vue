<script setup lang="ts">
import { Selections } from '../../utils/game-channel/game-channel.types';

const props = defineProps<{
  type: Selections;
  victory?: boolean;
  defeat?: boolean;
}>();

const icon = new URL(`../../assets/images/${props.type}.png`, import.meta.url)
  .href;
</script>

<template>
  <div class="selection-icon" :class="{ victory, defeat }">
    <img :src="icon" :alt="props.type" />
  </div>
</template>

<style scoped lang="scss">
@import '../../mediaqueries.scss';

.selection-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  background-color: var(--gray);
  border-radius: 15px;
  width: 100px;
  height: 100px;
  transition: background-color 0.2s ease-in-out;
  img {
    width: 80%;
  }
  &.victory {
    background-color: var(--green);
  }
  &.defeat {
    background-color: var(--pink);
  }
  @include for-big-desktop-up {
    width: 120px;
    height: 120px;
  }
  @include for-phone-only {
    border-radius: 8px;
    width: 55px;
    height: 55px;
  }
}
</style>
