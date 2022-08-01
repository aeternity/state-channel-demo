import { useChannelStore } from '../stores/channel';
import { PopUpData } from '../stores/popup';
import SHA from 'sha.js';

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

  async setBotSelection(selection: Selections) {
    this.botSelection = selection;
  }

  async setUserSelection(selection: Selections) {
    if (selection === Selections.none) {
      throw new Error('Selection should not be none');
    }
    const channelStore = useChannelStore();
    const popupData: Partial<PopUpData> = {
      title: Selections[selection].toUpperCase(),
      text: 'Confirm your selection',
    };

    const result = await channelStore.channel?.callContract(
      'provide_hash',
      [this.hashSelection(selection)],
      popupData
    );
    if (result?.accepted) this.userSelection = selection;
    else throw new Error('Selection was not accepted');
  }

  hashSelection(selection: Selections): string {
    this.hashKey = Math.random().toString(16).substring(2, 8);
    return SHA('sha256')
      .update(this.hashKey + selection)
      .digest('hex');
  }

  getUserSelection(): Selections {
    return this.userSelection;
  }
}
