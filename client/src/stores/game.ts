import { defineStore } from 'pinia';
import GameManager from '../game/GameManager';

interface GameStore {
  gameManager?: GameManager;
}

export const useGameStore = defineStore<'game', GameStore>('game', {
  state: () => {
    return {
      gameManager: undefined,
    };
  },
});
