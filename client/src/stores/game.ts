import { defineStore } from 'pinia';
export enum Selections {
  rock,
  paper,
  scissor,
  none,
}

export const useGameStore = defineStore('game', {
  state: () => {
    return {
      userSelection: Selections.none,
      botSelection: Selections.none,
    };
  },
  actions: {
    userSelect(selection: Selections) {
      this.userSelection = selection;
    },
  },
});
