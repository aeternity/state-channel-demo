<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>

<template>
  <div class="tooltip" data-testid="tooltip">
    <img src="../assets/svg/info.svg" alt="?" />
    <div class="tooltip-text">
      {{ text }}
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '../mediaqueries.scss';

.tooltip {
  display: block;
  position: relative;
  margin-left: 5px;
  float: right;
  img {
    width: 20px;
    height: 20px;
  }
  .tooltip-text {
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.2s;
    background-color: black;
    color: #fff;
    padding: 16px;
    width: 300px;
    background: #4e4e56;
    border-radius: 8px 8px 0px 8px;
    font-size: 14px;
    line-height: 1.2;

    position: absolute;
    z-index: 1;
    bottom: calc(100% + 15px);
    right: calc(100% - 20px);

    &::after {
      content: url('../assets/svg/rectangle.svg');
      position: absolute;
      transform: scaleX(-1);
      top: calc(100% - 1px);
      right: 0;
    }
    @include for-desktop-up {
      width: 300px;
      bottom: calc(100% + 15px);
      border-radius: 8px 8px 8px 0px;
      left: 0;
      &::after {
        content: url('../assets/svg/rectangle.svg');
        position: absolute;
        transform: unset;
        top: calc(100% - 1px);
        right: unset;
        left: 0;
      }
    }
    @include for-phone-only {
      width: 70vw;
      max-width: 300px;
    }
  }

  img:hover ~ .tooltip-text {
    visibility: visible;
    opacity: 1;
  }
}
</style>
