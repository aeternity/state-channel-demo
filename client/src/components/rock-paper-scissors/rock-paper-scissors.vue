<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Selections } from '../../utils/game-channel/game-channel.types';
import { useChannelStore } from '../../stores/channel';
import GenericButton from '../generic-button/generic-button.vue';
import SelectionIcon from '../selection-icon/selection-icon.vue';
import { useIsOnMobileStore } from '../../stores/is-on-mobile';

const props = defineProps<{
  isPlayerUser?: boolean;
}>();

const gameChannel = useChannelStore();

const selectionClicked = ref(false);
const channelIsClosing = ref(false);
const isOnMobile = useIsOnMobileStore().isOnMobile;

const userHasSelected = computed(() => {
  return gameChannel.channel?.getUserSelection() != Selections.none
    ? true
    : false;
});

const isSelectingDisabled = computed(() => {
  return userHasSelected.value || selectionClicked.value;
});

const userSelection = computed(() =>
  userHasSelected.value
    ? Selections[gameChannel.channel?.getUserSelection() ?? Selections.none]
    : ''
);

const botSelection = computed(() =>
  gameChannel.channel?.gameRound.botSelection != Selections.none
    ? Selections[gameChannel.channel?.gameRound.botSelection ?? Selections.none]
    : ''
);

const result = computed(() => {
  if (gameChannel.channel?.gameRound.isCompleted) {
    switch (gameChannel.channel?.gameRound.winner) {
      case gameChannel.channel.channelConfig?.responderId:
        return 1;
      case gameChannel.channel.channelConfig?.initiatorId:
        return 0;
      default:
        return -1;
    }
  } else {
    return -1;
  }
});

const status = computed(() => {
  if (!isSelectingDisabled.value) {
    return props.isPlayerUser ? 'Choose one' : 'User is selecting…';
  }
  if (gameChannel.channel?.gameRound.isCompleted) {
    switch (result.value) {
      case 1:
        return props.isPlayerUser ? 'You won' : 'User won';
      case 0:
        return props.isPlayerUser ? 'You lost' : 'User lost';
      default:
        return "It's a draw";
    }
  }
  return props.isPlayerUser ? 'Bot is selecting…' : 'You are selecting…';
});

async function makeSelection(selection: Selections) {
  selectionClicked.value = true;
  if (userHasSelected.value) return;
  try {
    await gameChannel.channel?.setUserSelection(selection);
    selectionClicked.value = false;
  } catch (e) {
    console.info((e as Error).message);
  }
}

function closeChannel() {
  channelIsClosing.value = true;
  gameChannel.channel?.closeChannel();
}
</script>

<template>
  <div class="rock-paper-scissors">
    <div class="header">
      <div class="finalized-selection" data-testid="botSelection">
        <SelectionIcon
          v-if="
            !isOnMobile &&
            !isPlayerUser &&
            gameChannel.channel?.gameRound.isCompleted &&
            botSelection !== Selections.none &&
            botSelection !== ''
          "
          :victory="result === 0"
          :defeat="result === 1"
          :type="botSelection"
        />
      </div>
      <h1 class="title">{{ status }}</h1>
      <div class="finalized-selection" data-testid="userSelection">
        <SelectionIcon
          v-if="
            isPlayerUser &&
            userSelection !== Selections.none &&
            userSelection !== ''
          "
          :victory="result === 1"
          :defeat="result === 0"
          :type="userSelection"
        />
        <SelectionIcon
          v-if="
            isOnMobile &&
            !isPlayerUser &&
            gameChannel.channel?.gameRound.isCompleted &&
            botSelection !== Selections.none &&
            botSelection !== ''
          "
          :victory="result === 0"
          :defeat="result === 1"
          :type="botSelection"
        />
      </div>
    </div>
    <div v-if="isPlayerUser && !isSelectingDisabled" class="selections">
      <button
        data-testid="rock-btn"
        :disabled="isSelectingDisabled"
        class="button"
        @click="makeSelection(Selections.rock)"
      >
        <SelectionIcon :type="Selections.rock" />
      </button>
      <button
        data-testid="paper-btn"
        :disabled="isSelectingDisabled"
        class="button"
        @click="makeSelection(Selections.paper)"
      >
        <SelectionIcon :type="Selections.paper" />
      </button>
      <button
        data-testid="scissors-btn"
        :disabled="isSelectingDisabled"
        class="button"
        @click="makeSelection(Selections.scissors)"
      >
        <SelectionIcon :type="Selections.scissors" />
      </button>
    </div>
    <div
      v-if="gameChannel.channel?.gameRound.isCompleted && isPlayerUser"
      class="round-controls"
    >
      <GenericButton
        text="Play again"
        data-testid="btn-play-again"
        @click="gameChannel.channel?.startNewRound()"
        :disabled="channelIsClosing"
      />
      <GenericButton
        text="End game"
        data-testid="btn-end-game"
        @click="closeChannel()"
        :disabled="channelIsClosing"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '../../mediaqueries.scss';

.header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  margin-bottom: 20px;
  @include for-phone-only {
    width: 100%;
  }

  & > .finalized-selection {
    text-align: center;
    text-transform: uppercase;
    justify-self: center;
    font-size: 60px;
    font-weight: 600;
    color: var(--pink);
    &.bot {
      color: var(--green);
    }
    @media (max-width: 768px) {
      font-size: 20px;
    }
    @include for-tablet-portrait-up {
      font-size: 46px;
    }
    @include for-desktop-up {
      font-size: 60px;
    }
  }
  & > .title {
    font-size: 40px;
    font-weight: 500;
    text-align: center;
    margin: 0px;
    @include for-phone-only {
      width: 100%;
      font-size: 22px;
    }
    @include for-tablet-portrait-up {
      font-size: 34px;
      width: 250px;
    }
    @include for-tablet-landscape-up {
      font-size: 40px;
      width: 290px;
    }
  }
}

.selections {
  display: flex;
  justify-content: space-around;
  align-items: center;

  @include for-tablet-landscape-up {
    flex-direction: row;
  }
  & > .button {
    font-size: 50px;
    font-family: 'Clash Display', sans-serif;
    border: none;
    background-color: transparent;
    padding: 0;
    margin: 0 10px;
    cursor: pointer;
    .selection-icon {
      transition: background-color 0.1s ease-in-out;
      &:hover {
        background-color: var(--green);
      }
    }
  }
}
.rock-paper-scissors {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  margin-top: 40px;
  padding: 0 5px;
  @include for-phone-only {
    margin-top: 20px;
  }
}

.round-controls {
  display: flex;
}
</style>
