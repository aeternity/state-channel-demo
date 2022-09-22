import { BigNumber } from 'bignumber.js';
import { render } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import PlayerInfo from './player-info.vue';

const mockPlayerInfoNoBalance = { name: 'You' };
const mockPlayerInfo = { name: 'You', balance: new BigNumber(3e18) };

describe('Show player info', () => {
  expect(PlayerInfo).toBeTruthy();
  it('should display only name', async () => {
    const playerInfo = render(PlayerInfo, {
      props: { ...mockPlayerInfoNoBalance },
    });

    const playerName = playerInfo.getByText(mockPlayerInfoNoBalance.name);
    expect(playerName).toBeTruthy();
    expect(() => {
      playerInfo.getByTestId('balance');
    }).toThrow('Unable to find an element by: [data-testid="balance"]');
  });

  it('should display player name and balance', async () => {
    const playerInfo = render(PlayerInfo, {
      props: { ...mockPlayerInfo },
    });

    const playerName = playerInfo.getByText(mockPlayerInfo.name);
    expect(playerName).toBeTruthy();

    const playerBalance = playerInfo.getByText(`3.00 æ`);
    expect(playerBalance).toBeTruthy();
  });
});
