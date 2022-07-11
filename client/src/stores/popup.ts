import { defineStore } from 'pinia';

export interface PopUpData {
  title: string;
  text?: string;
  mainBtnText: string;
  secBtnText?: string;
  mainBtnAction: () => void;
  secBtnAction?: () => void;
}

export const usePopUpStore = defineStore('popup', {
  state: () =>
    ({
      title: '',
      text: '',
      mainBtnText: '',
      secBtnText: '',
      mainBtnAction: () => void 0,
      secBtnAction: () => void 0,
    } as PopUpData),
  actions: {
    showPopUp(options: PopUpData) {
      this.resetPopUp();
      this.title = options.title;
      this.text = options.text ?? '';
      this.mainBtnText = options.mainBtnText;
      this.secBtnText = options.secBtnText ?? '';
      this.mainBtnAction = options.mainBtnAction;
      this.secBtnAction = options.secBtnAction;
    },
    resetPopUp() {
      this.title = '';
      this.text = '';
      this.mainBtnText = '';
      this.secBtnText = '';
      this.mainBtnAction = () => void 0;
      this.secBtnAction = () => void 0;
    },
  },
});
