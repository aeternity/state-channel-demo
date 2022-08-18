<script setup lang="ts">
import { computed, ref } from 'vue';
import { Selections } from '../../utils/game-channel/game-channel';
import { useChannelStore } from '../../stores/channel';
import GenericButton from '../generic-button/generic-button.vue';

const gameChannel = useChannelStore();

const selectionClicked = ref(false);
const channelIsClosing = ref(false);

const userHasSelected = computed(() => {
  return gameChannel.channel?.getUserSelection() != Selections.none
    ? true
    : false;
});

const selectionsAreDisabled = computed(() => {
  return userHasSelected.value || selectionClicked.value;
});

const botIsMakingSelection = computed(() => {
  return gameChannel.channel?.getUserSelection() != Selections.none
    ? gameChannel.channel?.getUserSelection() === Selections.none
      ? true
      : false
    : false;
});

const userSelection = computed(() =>
  userHasSelected.value
    ? Selections[gameChannel.channel?.getUserSelection() ?? Selections.none]
    : ''
);

const botSelection = computed(() =>
  gameChannel.channel?.game.round.botSelection != Selections.none
    ? Selections[
        gameChannel.channel?.game.round.botSelection ?? Selections.none
      ]
    : ''
);

const status = computed(() => {
  if (!userHasSelected.value) {
    return 'Choose one';
  }
  if (botIsMakingSelection.value) {
    return 'Bot is selecting';
  }
  if (gameChannel.channel?.game.round.isCompleted) {
    switch (gameChannel.channel?.game.round.winner) {
      case gameChannel.channel.channelConfig?.responderId:
        return 'You won';
      case gameChannel.channel.channelConfig?.initiatorId:
        return 'You lost';
      default:
        return "It's a draw";
    }
  }
  return 'Waiting for bot';
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
      <div class="finalized-selection" data-testid="userSelection">
        {{ userSelection }}
      </div>
      <h1 class="title">{{ status }}</h1>
      <div
        v-if="gameChannel.channel?.game.round.isCompleted"
        class="finalized-selection bot"
        data-testid="botSelection"
      >
        {{ botSelection }}
      </div>
    </div>
    <div v-if="!gameChannel.channel?.game.round.isCompleted" class="selections">
      <button
        :disabled="selectionsAreDisabled"
        class="button"
        :class="{
          'bot-selecting': botIsMakingSelection,
          'user-selecting': !selectionsAreDisabled,
        }"
        @click="makeSelection(Selections.rock)"
      >
        ROCK
      </button>
      <button
        :disabled="selectionsAreDisabled"
        class="button"
        :class="{
          'bot-selecting': botIsMakingSelection,
          'user-selecting': !selectionsAreDisabled,
        }"
        @click="makeSelection(Selections.paper)"
      >
        PAPER
      </button>
      <button
        :disabled="selectionsAreDisabled"
        class="button"
        :class="{
          'bot-selecting': botIsMakingSelection,
          'user-selecting': !selectionsAreDisabled,
        }"
        @click="makeSelection(Selections.scissors)"
      >
        SCISSORS
      </button>
    </div>
    <div
      v-if="gameChannel.channel?.game.round.isCompleted"
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
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  margin-bottom: 20px;

  & > .finalized-selection {
    text-align: center;
    text-transform: uppercase;
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
      font-size: 28px;
    }
    @include for-tablet-portrait-up {
      font-size: 34px;
    }
    @include for-tablet-landscape-up {
      font-size: 40px;
    }
  }
}

.selections {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: center;

  @include for-tablet-landscape-up {
    flex-direction: row;
  }
  & > .button {
    font-size: 50px;
    font-family: 'Clash Display', sans-serif;
    width: 250px;
    border: none;
    background-color: transparent;
    @include for-tablet-portrait-up {
      font-size: 50px;
    }
    @include for-tablet-landscape-up {
      font-size: 55px;
      width: 260px;
    }
    @include for-desktop-up {
      font-size: 60px;
      width: 300px;
    }
  }
  & > .button.user-selecting {
    cursor: pointer;
    &:hover {
      color: var(--pink);
      font-weight: 500;
    }
  }
  & > .button.bot-selecting {
    color: var(--green);
    cursor: default;
  }
}
.rock-paper-scissors {
  grid-area: body;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.round-controls {
  display: flex;
}
</style>
