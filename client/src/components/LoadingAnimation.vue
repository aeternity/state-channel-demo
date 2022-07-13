<script setup lang="ts"></script>

<template>
  <div class="loading-wrapper">
    <div class="loading">
      <div style="left: 38px; top: 38px; animation-delay: 0s"></div>
      <div style="left: 80px; top: 38px; animation-delay: 0.125s"></div>
      <div style="left: 122px; top: 38px; animation-delay: 0.25s"></div>
      <div style="left: 38px; top: 80px; animation-delay: 0.875s"></div>
      <div style="left: 122px; top: 80px; animation-delay: 0.375s"></div>
      <div style="left: 38px; top: 122px; animation-delay: 0.75s"></div>
      <div style="left: 80px; top: 122px; animation-delay: 0.625s"></div>
      <div style="left: 122px; top: 122px; animation-delay: 0.5s"></div>
      <div style="left: 122px; top: 122px; animation-delay: 0.5s"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '../mediaqueries.scss';

.loading div {
  position: absolute;
  width: 40px;
  height: 40px;
  background: var(--pink);
  animation: loadingAnimation 1s linear infinite;
}
.loading-wrapper {
  width: 200px;
  height: 200px;
  display: inline-block;
  overflow: hidden;
  background: none;
}
.loading {
  width: 100%;
  height: 100%;
  position: relative;
  transform: translateZ(0) scale(1);
  backface-visibility: hidden;
  transform-origin: 0 0;
}
.loading div {
  box-sizing: content-box;
}

@keyframes loadingAnimation {
  0% {
    background: rgba(255, 255, 255, 0);
  }
  12.5% {
    background: rgba(255, 255, 255, 0);
  }
  12.625% {
    background: var(--pink);
  }
  100% {
    background: var(--pink);
  }
}
</style>
