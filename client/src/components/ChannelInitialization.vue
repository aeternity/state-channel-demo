<script setup lang="ts">
import { ref } from 'vue';
import { AeSdk, Channel } from '@aeternity/aepp-sdk';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import { getSdk } from '../sdk/sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { default as Button } from './GenericButton.vue';

const channelConfig = ref<ChannelOptions>();
const loading = ref(false);
const error = ref<string>();
const channelStatus = ref<string>();
const openChannelInitiated = ref(false);

function registerEvents(channel: Channel) {
  channel.on('statusChanged', (status) => {
    channelStatus.value = status;
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
      port: '3001',
      host: 'node',
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
  loading.value = true;
  channelStatus.value = 'getting channel config';
  const sdk = await getSdk();
  try {
    channelConfig.value = await getChannelConfig(sdk);
    completeChannelConfig(channelConfig.value, sdk);
    if (channelConfig.value == null) {
      error.value = 'No channel config found';
      throw new Error('Channel config is null');
    }
    channelStatus.value = 'initializing ws';
    const responderCh = await Channel.initialize(channelConfig.value);
    registerEvents(responderCh);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <Button
      :disabled="openChannelInitiated"
      @click="openStateChannel()"
      text="Open State Channel"
    />
    <div v-if="openChannelInitiated && !error">
      Channel Status: {{ channelStatus }}
    </div>
    <div v-if="!loading && channelConfig">
      <pre>{{ JSON.stringify(channelConfig, null, 2) }}</pre>
    </div>

    <p v-if="loading && openChannelInitiated">Loading...</p>
    <p v-if="error && openChannelInitiated">Error: {{ error }}</p>
  </div>
</template>

<style scoped></style>
