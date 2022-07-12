<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useChannelStore } from '../stores/channel';
import { AeSdk, Channel } from '@aeternity/aepp-sdk';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import { getSdk, returnCoinsToFaucet } from '../sdk/sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { default as Button } from './GenericButton.vue';
import LoadingAnimation from './LoadingAnimation.vue';

const channelConfig = ref<ChannelOptions>();
const error = ref<string>();
const channelStatus = ref<string>();
const openChannelInitiated = ref(false);
let sdk: AeSdk;
const channelStore = useChannelStore();

const title = computed(() =>
  !openChannelInitiated.value
    ? 'Start the game by open state channel'
    : 'Setting ‘on-chain’ operations...'
);

onBeforeUnmount(async () => {
  if (!sdk) return;
  await returnCoinsToFaucet(sdk);
});

async function registerEvents(channel: Channel, sdk: AeSdk) {
  channel.on('statusChanged', (status) => {
    channelStatus.value = status;
    if (status === 'closed') {
      void returnCoinsToFaucet(sdk);
    }
    if (status === 'open') {
      channelStore.channelIsOpen = true;
    }
  });
}

async function getChannelConfig(sdk: AeSdk): Promise<ChannelOptions> {
  const res = await fetch(import.meta.env.VITE_BOT_SERVICE_URL + '/open', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address: sdk.selectedAddress,
      port: import.meta.env.VITE_RESPONDER_PORT ?? '3333',
      host: import.meta.env.VITE_RESPONDER_HOST ?? 'localhost',
    }),
  });
  const data = await res.json();

  if (res.status != 200) {
    error.value = 'Error while fetching channel config';
    throw new Error(data.message);
  }
  return data as ChannelOptions;
}

function completeChannelConfig(channelConf: ChannelOptions, sdk: AeSdk) {
  Object.assign(channelConf, {
    role: 'responder',
    sign: (_tag: string, tx: EncodedData<'tx'>) => sdk.signTransaction(tx),
    url:
      import.meta.env.VITE_NODE_ENV == 'development'
        ? import.meta.env.VITE_WS_URL
        : channelConf.url,
  });
}

async function openStateChannel(): Promise<void> {
  openChannelInitiated.value = true;
  channelStatus.value = 'getting channel config';
  sdk = await getSdk();
  try {
    channelConfig.value = await getChannelConfig(sdk);
    completeChannelConfig(channelConfig.value, sdk);
    if (channelConfig.value == null) {
      error.value = 'No channel config found';
      throw new Error('Channel config is null');
    }
    channelStatus.value = 'initializing ws';
    const responderCh = await Channel.initialize(channelConfig.value);
    registerEvents(responderCh, sdk);
  } catch (e) {
    console.error(e);
  }
}
</script>

<template>
  <div class="open-channel">
    <div
      class="title"
      :style="{
        'max-width': openChannelInitiated ? '100%' : '',
      }"
    >
      {{ title }}
    </div>
    <div class="info-wrapper" v-if="!openChannelInitiated">
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
        :disabled="openChannelInitiated"
        @click="openStateChannel()"
        text="Start game"
      />
    </div>
    <LoadingAnimation v-else-if="!error" />
    <div v-else>Error: {{ error }}</div>
  </div>
</template>

<style scoped lang="scss">
@import '../mediaqueries.scss';

.open-channel {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: var(--padding);
  height: 60%;
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
