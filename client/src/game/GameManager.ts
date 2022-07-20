import { useChannelStore } from '../stores/channel';
import { PopUpData } from '../stores/popup';
export enum Selections {
  rock,
  paper,
  scissor,
  none,
}

export default class GameManager {
  private userSelection: Selections = Selections.none;
  botSelection: Selections = Selections.none;

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
      'makeSelection',
      [selection],
      popupData
    );
    if (result?.accepted) {
      this.userSelection = selection;
    }
  }
  getUserSelection(): Selections {
    return this.userSelection;
  }
}
