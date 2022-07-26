import { render } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import PopUp from '../src/components/PopUp.vue';
import { PopUpData } from '../src/stores/popup';
import { ref } from 'vue';

const renderPopUp = (fakePopUpData: PopUpData) =>
  render(PopUp, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            popup: { ...fakePopUpData },
          },
        }),
      ],
    },
  });

const counter = ref(0);

const fakePopUpData: Required<PopUpData> = {
  title: 'Test',
  text: 'Text here',
  mainBtnText: 'Main button',
  secBtnText: 'Second button',
  mainBtnAction: () => counter.value++,
  secBtnAction: () => counter.value--,
  tooltipText: 'This is a tooltip',
};

const singleButtonPopUpData: PopUpData = {
  title: 'Test',
  mainBtnText: 'Main button',
  mainBtnAction: () => counter.value++,
};

describe('PopUp', () => {
  it('displays pop-up title,text and buttons', async () => {
    const popUpEl = renderPopUp(fakePopUpData);
    expect(popUpEl.getByText(fakePopUpData.title)).toBeTruthy();
    expect(popUpEl.getByText(fakePopUpData.text)).toBeTruthy();
    expect(popUpEl.getByText(fakePopUpData.mainBtnText)).toBeTruthy();
    expect(popUpEl.getByText(fakePopUpData.secBtnText)).toBeTruthy();
  });

  it('calls button actions on click', async () => {
    const popUpEl = renderPopUp(fakePopUpData);

    const mainBtn = popUpEl.getByTestId('popup-main-btn');
    const secBtn = popUpEl.getByTestId('popup-sec-btn');
    mainBtn.click();
    expect(counter.value).toBe(1);
    secBtn.click();
    expect(counter.value).toBe(0);
  });

  it('displays single button and title', async () => {
    const popUpEl = renderPopUp(singleButtonPopUpData);

    expect(popUpEl.getByText(singleButtonPopUpData.title)).toBeTruthy();
    expect(popUpEl.getByTestId('popup-main-btn')).toBeTruthy();
    expect(() => {
      popUpEl.getByTestId('popup-sec-btn');
    }).toThrow('Unable to find an element by: [data-testid="popup-sec-btn"]');
    expect(() => {
      popUpEl.getByTestId('popup-text');
    }).toThrow('Unable to find an element by: [data-testid="popup-text"]');
    expect(() => {
      popUpEl.getByTestId('tooltip');
    }).toThrow('Unable to find an element by: [data-testid="tooltip"]');
  });

  it('displays popup with tooltip', async () => {
    const popUpEl = renderPopUp(fakePopUpData);
    expect(popUpEl.getByTestId('tooltip')).toBeTruthy();
    const tooltipTextEl = popUpEl.getByText(fakePopUpData.tooltipText);
    expect(tooltipTextEl).toBeTruthy();
  });
});
