<script setup lang="ts">
import { computed } from 'vue';
import { default as Button } from '../generic-button/generic-button.vue';
import { useChannelStore } from '../../stores/channel';
import BigNumber from 'bignumber.js';
import { GameChannel } from '../../utils/game-channel/game-channel';
import { resetApp } from '../../main';
import ShareButtons from '../share-buttons/share-buttons.vue';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';

const props = defineProps<{
  resultsFromSharedLink?: {
    rounds: number;
    isLastRoundCompleted: boolean;
    elapsedTime: number;
    earnings: BigNumber;
    responderId: Encoded.AccountAddress;
  };
}>();

const channel = useChannelStore().channel as GameChannel;

const roundsPlayed =
  props.resultsFromSharedLink?.rounds ?? channel.gameRound.index;
const isLastRoundCompleted =
  props.resultsFromSharedLink?.isLastRoundCompleted ??
  channel.gameRound.isCompleted;
const isAutoplayEnabled =
  !!props.resultsFromSharedLink?.elapsedTime || channel?.autoplay.enabled;
const seconds =
  (props.resultsFromSharedLink?.elapsedTime ?? channel?.autoplay.elapsedTime) /
  1000;

let offChainTxNo = 0;
// since we're not saving all the logs we can't count the current transaction logs.
offChainTxNo = roundsPlayed * 3 + 1;
if (roundsPlayed === 1 && !isLastRoundCompleted) {
  offChainTxNo -= 3;
}

const title = computed(() => {
  const user = props.resultsFromSharedLink ? 'The player' : 'You';
  return earnings.value.isZero()
    ? `${user} didn't win or lose anything`
    : earnings.value.isGreaterThan(0)
    ? `${user} won ${earnings.value.dividedBy(1e18).toFormat(2)} Æ`
    : `${user} lost ${earnings.value.abs().dividedBy(1e18).toFormat(2)} Æ`;
});
const txPerSecText = computed(
  () =>
    `${offChainTxNo} off-chain transaction${offChainTxNo > 1 ? 's' : ''} ${
      isAutoplayEnabled ? `in ${seconds}sec` : ''
    }`
);
const roundsPlayedMessage = computed(
  () => `${roundsPlayed} round${roundsPlayed > 1 ? 's' : ''} played`
);
const earnings = computed(() => {
  if (props.resultsFromSharedLink?.earnings)
    return new BigNumber(props.resultsFromSharedLink.earnings);
  const initialBalance = channel?.channelConfig?.responderAmount as BigNumber;
  const balance = channel?.balances.user as BigNumber;
  if (!initialBalance || !balance) return new BigNumber(0);
  return balance.minus(initialBalance);
});

const hasInsuffientBalance = computed(() => {
  const balance = channel?.balances.user as BigNumber;
  return balance.isLessThan(1e18);
});

function getLinkToShare() {
  return `${window.location.origin.concat(window.location.pathname)}?th=${
    channel?.savedResultsOnChainTxHash
  }`;
}

function closeChannel() {
  channel?.closeChannel();
}

function continueAutoplay() {
  channel.continueAutoplay();
}
</script>

<template>
  <div class="end-screen">
    <div class="title">
      {{ title }}
    </div>
    <div class="text">
      {{ roundsPlayedMessage }}
    </div>
    <div class="text">
      {{ txPerSecText }}
    </div>
    <div class="buttons">
      <Button
        v-if="!props.resultsFromSharedLink && isAutoplayEnabled"
        text="Continue Autoplay"
        :disabled="channel.channelIsClosing || hasInsuffientBalance"
        @click="continueAutoplay()"
        :title="
          hasInsuffientBalance
            ? 'You don\'t have enough Æ to continue autoplay'
            : ''
        "
      />
      <Button
        v-if="!props.resultsFromSharedLink && isAutoplayEnabled"
        text="Close Channel"
        :disabled="channel.channelIsClosing"
        @click="closeChannel()"
      />
      <div class="share-results" v-if="!props.resultsFromSharedLink">
        <ShareButtons v-if="!channel.isOpen" :url="getLinkToShare()" />
        <div v-else-if="channel.channelIsClosing" class="text">
          Channel is closing...
        </div>
      </div>
      <Button
        v-if="props.resultsFromSharedLink"
        text="Start your own game"
        @click="resetApp()"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '../../mediaqueries.scss';

.end-screen {
  grid-area: body;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  padding: var(--padding);
}
.title {
  font-size: 60px;
  font-weight: 600;
  color: var(--pink);
  @include for-phone-only {
    font-size: 34px;
    min-width: 100%;
    max-width: 100%;
  }
}
.text {
  margin-top: 10px;
  font-size: 35px;
  font-weight: 600;
  @include for-phone-only {
    font-size: 24px;
    min-width: 100%;
    max-width: 100%;
  }
}

.buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 20px 0px;
  grid-template-areas:
    '. .'
    'share share';
  margin-top: 10px;
  .share-results {
    grid-area: share;

    .text {
      font-size: 20px;
      font-weight: 600;
      color: var(--pink);
    }
  }
  .button {
    margin-left: 0;
    width: fit-content;
    height: fit-content;
  }
}
</style>
