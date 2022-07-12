<script setup lang="ts">
import { usePopUpStore } from '../stores/popup';
import GenericButton from './GenericButton.vue';
const store = usePopUpStore();
</script>

<template>
  <div v-if="store.title" class="popup__wrapper">
    <div class="popup">
      <div class="title">{{ store.title }}</div>
      <div class="text" v-if="store.text" data-testid="popup-text">
        {{ store.text }}
      </div>
      <div class="buttons">
        <GenericButton
          :text="store.secBtnText"
          v-if="store.secBtnText"
          @click="() => (store.secBtnAction ? store.secBtnAction() : null)"
          data-testid="popup-sec-btn"
        />
        <GenericButton
          :text="store.mainBtnText"
          v-if="store.mainBtnText"
          @click="() => store.mainBtnAction()"
          data-testid="popup-main-btn"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '../mediaqueries.scss';

.popup {
  width: 50%;
  min-height: 200px;
  border-radius: 15px;
  background-color: white;
  padding: 50px;
  padding-bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(3px 2px 15px rgba(0, 0, 0, 0.25));
  z-index: 1200;
  &__wrapper {
    backdrop-filter: blur(2px);
    background-color: rgba(0, 0, 0, 0.25);
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    position: absolute;
    top: 0;
  }
  & > .title {
    text-align: center;
    font-size: 50px;
    color: var(--pink);
    font-weight: 600;
    margin-bottom: 10px;
  }
  & > .text {
    text-align: center;
    font-size: 30px;
    font-weight: 500;
    margin-bottom: 10px;
  }
  & > .buttons {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }
  @include for-phone-only {
    width: 100%;
    margin: 0 10px;
    height: unset;
    padding: 15px;
    & > .title {
      font-size: 44px;
    }

    & > .text {
      font-size: 24px;
    }
    & > .buttons {
      button {
        font-size: 24px;
      }
    }
  }
}
</style>
