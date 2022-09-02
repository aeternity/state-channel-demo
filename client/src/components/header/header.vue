<script setup lang="ts">
import { useChannelStore } from '../../stores/channel';
import { default as Button } from '../generic-button/generic-button.vue';
import GameInfo from '../game-info/game-info.vue';
import { resetApp } from '../../main';
import { computed } from 'vue';
import {
  IS_USING_LOCAL_NODE,
  NODE_URL,
} from '../../utils/sdk-service/sdk-service';

const channelStore = useChannelStore();
const repoUrl = 'https://github.com/aeternity/state-channel-demo';

const explorerUrl = computed(() => {
  if (IS_USING_LOCAL_NODE) {
    return `${NODE_URL}/v2/channels/${channelStore.channel?.channelId}`;
  } else
    return `https://testnet.aenalytics.org/accounts/${channelStore.channel?.channelConfig?.responderId}`;
});

const canCloseChannel = computed(() => {
  return (
    channelStore.channel?.contractAddress &&
    channelStore.channel.isOpen &&
    channelStore.channel.isFunded &&
    !channelStore.channel.gameRound.userInAction &&
    !channelStore.channel.channelIsClosing
  );
});
const canResetApp = computed(() => {
  return (
    !channelStore.channel?.isOpen && channelStore.channel?.shouldShowEndScreen
  );
});

async function reset() {
  // if channel is already closed and we are on the end-screen,
  // just reset the app
  if (canResetApp.value) resetApp();

  // if we want to reset the app mid-game,
  // we need to close the channel and then reset the app
  if (canCloseChannel.value) {
    channelStore.channel
      ?.closeChannel()
      .then((didClose) => (didClose ? resetApp() : null));
  }
}
</script>

<template>
  <div class="header">
    <img
      src="../../assets/images/logo.png"
      :class="{ clickable: canCloseChannel || canResetApp }"
      alt="Aeternity"
      @click="reset()"
    />
    <div class="center">
      <GameInfo
        :stake="channelStore.channel?.gameRound?.stake"
        :round="channelStore.channel?.gameRound?.index"
        v-if="channelStore.channel?.isOpen"
      />
    </div>
    <div
      v-if="
        channelStore.channel?.isOpen ||
        channelStore.channel?.shouldShowEndScreen
      "
      class="links"
    >
      <Button :url="repoUrl" text="Fork repo" />
      <Button
        :url="explorerUrl"
        text="Check Explorer"
        :disabled="explorerUrl"
      />
      <Button
        text="End Game"
        :disabled="!canCloseChannel"
        @click="channelStore.channel?.closeChannel()"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '../../mediaqueries.scss';

.header {
  grid-area: header;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
  padding: var(--padding);
  padding-bottom: 5px;
  img {
    width: 110px;
    &.clickable {
      cursor: pointer;
    }
  }
  @include for-phone-only {
    height: 15%;
  }
  @include for-big-desktop-up {
    align-items: flex-start;
  }

  &.end-screen {
    img {
      width: 110px;
      cursor: pointer;
    }
  }
}

.links {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  .button {
    margin-left: 0;
  }
}
</style>
