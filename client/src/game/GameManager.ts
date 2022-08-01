import { PopUpData } from '../stores/popup';
import { sha256hash } from '@aeternity/aepp-sdk';
import { gameChannel } from '../sdk/GameChannel';

export enum Selections {
  rock = 'rock',
  paper = 'paper',
  scissors = 'scissors',
  none = 'none',
}

export default class GameManager {
  private userSelection: Selections = Selections.none;
  botSelection: Selections = Selections.none;
  private hashKey = '';

  async setUserSelection(selection: Selections) {
    if (selection === Selections.none) {
      throw new Error('Selection should not be none');
    }
    const popupData: Partial<PopUpData> = {
      title: Selections[selection].toUpperCase(),
      text: 'Confirm your selection',
    };

    const result = await gameChannel.callContract(
      'provide_hash',
      [this.hashSelection(selection)],
      popupData
    );
    if (result?.accepted) this.userSelection = selection;
    else throw new Error('Selection was not accepted');
  }

  hashSelection(selection: Selections): Buffer {
    this.hashKey = Math.random().toString(16).substring(2, 8);
    return sha256hash(selection + this.hashKey);
  }

  getUserSelection(): Selections {
    return this.userSelection;
  }
}
