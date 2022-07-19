import { Selections } from '../src/game/gameManager';

export class MockGameManager {
  private userSelection: Selections;
  botSelection: Selections;

  constructor() {
    this.botSelection = Selections.none;
    this.userSelection = Selections.none;
  }

  async setUserSelection(selection: Selections) {
    this.userSelection = selection;
  }
  getUserSelection(): Selections {
    return this.userSelection;
  }
}
