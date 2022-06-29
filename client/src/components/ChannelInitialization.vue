<script setup lang="ts">
import { ref } from 'vue';
import { Channel } from '@aeternity/aepp-sdk';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import { createAccount } from '../sdk/sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { default as Button } from './GenericButton.vue';

const account = await createAccount();

const channelConfig = ref<ChannelOptions>();
const loading = ref(true);
const error = ref<{ message?: string }>({});
const channelStatus = ref('Initializing');
const openChannelInitiated = ref(false);

function registerEvents(channel: Channel) {
  channel.on('statusChanged', (status) => {
    channelStatus.value = status;
  });
}

async function getChannelConfig() {
  loading.value = true;
  return fetch(import.meta.env.VITE_BOT_SERVICE_URL + '/open', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address: account.selectedAddress,
      port: '3001',
      host: 'node',
    }),
  })
    .then((res) => {
      // a non-200 response code
      if (!res.ok) {
        // create error instance with HTTP status text
        const error: Error & { json?: Promise<unknown> } = new Error(
          res.statusText
        );
        error.json = res.json();
        throw error;
      }
      return res.json();
    })
    .then((json) => {
      // set the response data
      completeChannelConfig(json);
      channelConfig.value = json;
    })
    .catch((err) => {
      error.value = err;
      // In case a custom JSON error response was provided
      if (err.json) {
        return err.json.then((json: any) => {
          // set the JSON response message
          error.value.message = json.message;
        });
      }
    })
    .then(() => {
      loading.value = false;
    });
}

function completeChannelConfig(channelConf: ChannelOptions) {
  Object.assign(channelConf, {
    role: 'responder',
    sign: (_tag: string, tx: EncodedData<'tx'>) => account.signTransaction(tx),
    url:
      import.meta.env.VITE_NODE_ENV == 'development'
        ? import.meta.env.VITE_WS_URL
        : channelConf.url,
  });
}

async function openStateChannel(): Promise<void> {
  openChannelInitiated.value = true;
  await getChannelConfig();
  if (channelConfig.value == null) {
    error.value = { message: 'No channel config found' };
    throw new Error('Channel config is null');
  }
  const responderCh = await Channel.initialize(channelConfig.value);
  registerEvents(responderCh);
}
</script>

<template>
  <br />
  <Button
    :disabled="openChannelInitiated"
    @click="openStateChannel()"
    text="Open State Channel"
  />
  <div v-if="openChannelInitiated">Channel Status: {{ channelStatus }}</div>
  <div v-if="!loading && channelConfig">
    <pre>{{ JSON.stringify(channelConfig, null, 2) }}</pre>
  </div>

  <p v-if="loading && openChannelInitiated">Loading...</p>
  <p v-if="error && openChannelInitiated">{{ error.message }}</p>
</template>

<style scoped></style>
