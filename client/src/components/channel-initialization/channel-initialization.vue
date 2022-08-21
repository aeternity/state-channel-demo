<script setup lang="ts">
import { computed, ref } from 'vue';
import { default as Button } from '../generic-button/generic-button.vue';
import LoadingAnimation from '../loading-animation/loading-animation.vue';
import { useChannelStore } from '../../stores/channel';

const channelStore = useChannelStore();
const openChannelInitiated = ref(false);
const channelisOpening = computed(
  () => channelStore.channel?.isOpening || openChannelInitiated.value
);

const emit = defineEmits(['initializeChannel']);
const hasSavedState = !!localStorage.getItem('gameState');

const title = computed(() => {
  const prefix = hasSavedState ? 'Reconnecting - ' : '';

  const contractRequiredAction = hasSavedState
    ? 'compiled'
    : 'deployed & compiled';

  const status = !channelisOpening.value
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
</script>

<template>
  <div class="open-channel">
    <div
      class="title"
      :style="{
        'max-width': channelisOpening ? '100%' : '',
      }"
    >
      {{ title }}
    </div>
    <div class="info-wrapper" v-if="!channelisOpening">
      <p class="info">
        State channels refer to the process in which users transact with one
        another directly outside of the blockchain, or ‘off-chain,’ and greatly
        minimize their use of ‘on-chain’ operations.
      </p>
      <p class="info">
        By clicking start game you are initiating state channel with our bot and
        you make the possibilities of the game practically endless. After the
        game is over, you can see every action recorded on the blockchain by
        checking our explorer.
      </p>
      <Button
        :disabled="channelisOpening"
        @click="openStateChannel()"
        text="Start game"
      />
    </div>
    <LoadingAnimation v-else-if="!channelStore.channel?.error" />
    <p v-else>
      {{ errorMessage }}
    </p>
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
}
.title {
  min-width: 400px;
  max-width: 40%;
  font-size: 40px;
  font-weight: 500;
  text-align: center;
  @include for-phone-only {
    font-size: 28px;
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
}
</style>
