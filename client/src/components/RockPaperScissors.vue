<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../stores/game';
import { Selections } from '../game/GameManager';

const gameStore = useGameStore();

const userHasSelected = computed(() => {
  return gameStore.gameManager?.getUserSelection() != Selections.none
    ? true
    : false;
});
const botIsMakingSelection = computed(() => {
  return gameStore.gameManager?.getUserSelection() != Selections.none
    ? gameStore.gameManager?.getUserSelection() === Selections.none
      ? true
      : false
    : false;
});

const userSelection = computed(() =>
  userHasSelected.value
    ? Selections[gameStore.gameManager?.getUserSelection() ?? Selections.none]
    : ''
);

const botSelection = computed(() =>
  gameStore.gameManager?.botSelection != Selections.none
    ? Selections[gameStore.gameManager?.botSelection ?? Selections.none]
    : ''
);

const status = computed(() => {
  if (!userHasSelected.value) {
    return 'Choose one';
  } else if (botIsMakingSelection.value) {
    return 'Bot is selecting';
  } else {
    return "Bot's selection";
  }
});

async function makeSelection(selection: Selections) {
  if (userHasSelected.value) return;
  try {
    await gameStore.gameManager?.setUserSelection(selection);
  } catch (e) {
    console.info((e as Error).message);
    return;
  }
}
</script>

<template>
  <div class="rock-paper-scissors">
    <div class="header">
      <div class="finalized-selection" data-testid="userSelection">
        {{ userSelection }}
      </div>
      <h1 class="title">{{ status }}</h1>
      <div class="finalized-selection bot" data-testid="botSelection">
        {{ botSelection }}
      </div>
    </div>
    <div class="selections">
      <button
        class="button"
        :class="{
          'bot-selecting': botIsMakingSelection,
          'user-selecting': !userHasSelected,
        }"
        @click="makeSelection(Selections.rock)"
      >
        ROCK
      </button>
      <button
        class="button"
        :class="{
          'bot-selecting': botIsMakingSelection,
          'user-selecting': !userHasSelected,
        }"
        @click="makeSelection(Selections.paper)"
      >
        PAPER
      </button>
      <button
        class="button"
        :class="{
          'bot-selecting': botIsMakingSelection,
          'user-selecting': !userHasSelected,
        }"
        @click="makeSelection(Selections.scissors)"
      >
        SCISSORS
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '../mediaqueries.scss';

.header {
  width: 100%;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  margin-bottom: 20px;

  & > .finalized-selection {
    text-align: center;
    text-transform: uppercase;
    font-size: 60px;
    min-width: 270px;
    font-weight: 600;
    color: var(--pink);
    &.bot {
      color: var(--green);
    }
    @media (max-width: 768px) {
      display: none;
    }
    @include for-tablet-portrait-up {
      font-size: 46px;
      min-width: 210px;
    }
    @include for-desktop-up {
      font-size: 60px;
      min-width: 270px;
    }
  }
  & > .title {
    min-width: 400px;
    max-width: 40%;
    font-size: 40px;
    font-weight: 500;
    text-align: center;
    margin: 0px;
    @include for-phone-only {
      font-size: 28px;
      min-width: 100%;
      max-width: 100%;
    }
    @include for-tablet-portrait-up {
      font-size: 34px;
      min-width: 320px;
    }
    @include for-tablet-landscape-up {
      font-size: 40px;
      min-width: 400px;
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 var(--padding);
  height: 60%;
}
</style>
