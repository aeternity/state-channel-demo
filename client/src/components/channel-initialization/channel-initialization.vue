<script setup lang="ts">
import { computed, ref } from 'vue';
import { default as Button } from '../generic-button/generic-button.vue';
import LoadingAnimation from '../loading-animation/loading-animation.vue';
import { useChannelStore } from '../../stores/channel';
import ToggleButton from '../toggle-button/toggle-button.vue';
import { getSavedState } from '../../utils/local-storage/local-storage';

const channelStore = useChannelStore();
const openChannelInitiated = ref(false);
const hasSavedState = computed(() => {
  const savedState = getSavedState();
  // in case user was in action, we're clearing the localStorage
  // and we consider reconnecting unavailable.
  return savedState && !savedState?.gameRound?.userInAction;
});
const channelIsOpening = computed(
  () => channelStore.channel?.isOpening || openChannelInitiated.value
);

const emit = defineEmits(['initializeChannel']);

const title = computed(() => {
  const prefix = hasSavedState.value ? 'Reconnecting - ' : '';

  const contractRequiredAction = hasSavedState.value
    ? 'compiled'
    : 'deployed & compiled';

  const status = !channelIsOpening.value
    ? 'Start the game by open state channel'
    : !channelStore.channel?.isFunded
    ? 'Funding accounts...'
    : !channelStore.channel?.isOpen
    ? 'Setting ‘on-chain’ operations...'
    : ` Waiting for contract to be ${contractRequiredAction}...`;

  return prefix + status;
});

const errorMessage = computed(() =>
  channelStore.channel?.error
    ? `Error ${channelStore.channel?.error.status}: ${channelStore.channel?.error.statusText}, ${channelStore.channel?.error.message}`
    : ''
);

async function openStateChannel(): Promise<void> {
  openChannelInitiated.value = true;
  emit('initializeChannel');
}

function toggleAutoplay() {
  if (channelStore.channel) {
    channelStore.channel.autoplay.enabled =
      !channelStore.channel.autoplay.enabled;
  }
}
</script>

<template>
  <div class="open-channel">
    <div
      class="container"
      :class="{ shadow: !openChannelInitiated && !hasSavedState }"
    >
      <div
        class="title"
        :style="{
          'max-width': channelIsOpening ? '100%' : '',
        }"
      >
        {{ title }}
      </div>
      <div class="info-wrapper" v-if="!channelIsOpening">
        <p class="info">
          State channels refer to the process in which users transact with one
          another directly outside of the blockchain, or ‘off-chain,’ and
          greatly minimize their use of ‘on-chain’ operations.
        </p>
        <p class="info">
          By clicking start game you are initiating state channel with our bot
          and you make the possibilities of the game practically endless. After
          the game is over, you can see every action recorded on the blockchain
          by checking our explorer.
        </p>
        <p class="info">
          When being <span class="bold">idle for 2 minutes</span>, a timeout is
          triggered and the state channel closes.
        </p>
        <div class="buttons">
          <Button
            :disabled="channelIsOpening"
            @click="openStateChannel()"
            text="Start game"
          />
          <ToggleButton
            id="autoplay"
            v-on:change="toggleAutoplay"
            label-enable-text="Autoplay"
            label-disable-text="Autoplay"
          />
        </div>
      </div>
      <LoadingAnimation v-else-if="!channelStore.channel?.error" />
      <p v-else>
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>
<style scoped lang="scss">
@import '../../mediaqueries.scss';
.open-channel {
  grid-area: body;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: var(--padding);
  .container {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    border-radius: 25px;
    @include for-phone-only {
      width: unset;
      padding: 10px;
    }
    @include for-tablet-portrait-up {
      padding: 20px 40px;
    }
    @include for-tablet-landscape-up {
      padding: 40px 150px;
    }
    &.shadow {
      width: min-content;
      box-shadow: 0 4px 8px 0 rgb(0 0 0 / 20%), 0 1px 10px 0 rgb(0 0 0 / 15%);
      @include for-phone-only {
        width: unset;
      }
    }
  }
}
.title {
  min-width: 400px;
  max-width: 40%;
  font-size: 40px;
  font-weight: 500;
  text-align: center;
  @include for-phone-only {
    font-size: 26px;
    min-width: 100%;
    max-width: 100%;
    margin: 20px;
  }
}
.info-wrapper {
  display: contents;
}
.info {
  min-width: 400px;
  max-width: 40%;
  font-size: 16px;
  font-weight: 400;
  @include for-phone-only {
    min-width: 100%;
    max-width: 100%;
    margin: 20px;
  }
  .bold {
    font-weight: 500;
  }
}
.buttons {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  @include for-phone-only {
    flex-direction: column-reverse;
  }
}
</style>
