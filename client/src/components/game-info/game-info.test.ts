import { BigNumber } from 'bignumber.js';
import { render } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import GameInfo from './game-info.vue';

const initialGameInfo = {
  stake: new BigNumber(0.05e18),
  round: 0,
};
const firstRoundInfo = {
  stake: new BigNumber(0.05e18),
  round: 1,
};
describe('Game Info', () => {
  expect(GameInfo).toBeTruthy();
  it('should display only stake when round is 0', async () => {
    const gameInfo = render(GameInfo, {
      props: { ...initialGameInfo },
    });

    const roundStake = gameInfo.getByText('STAKE: 0.05 Æ');
    expect(roundStake).toBeTruthy();
    expect(() => {
      gameInfo.getByText('ROUND: 0');
    }).toThrow();
  });

  it('should display stake and round', async () => {
    const gameInfo = render(GameInfo, {
      props: { ...firstRoundInfo },
    });

    const roundStake = gameInfo.getByText('STAKE: 0.05 Æ');
    expect(roundStake).toBeTruthy();

    const playerBalance = gameInfo.getByText(`ROUND: 1`);
    expect(playerBalance).toBeTruthy();
  });

  it('formats bignumber to 2 decimals', async () => {
    const gameInfo = render(GameInfo, {
      props: { ...firstRoundInfo, stake: new BigNumber(1.23456e18) },
    });

    const roundStake = gameInfo.getByText('STAKE: 1.23 Æ');
    expect(roundStake).toBeTruthy();

    const playerBalance = gameInfo.getByText(`ROUND: 1`);
    expect(playerBalance).toBeTruthy();
  });
});
