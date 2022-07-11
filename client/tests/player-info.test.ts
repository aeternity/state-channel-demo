import { render } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import PlayerInfo from '../src/components/PlayerInfo.vue';

const mockPlayerInfoNoBalance = { name: 'You' };
const mockPlayerInfo = { name: 'You', balance: 100 };

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

    const playerBalance = playerInfo.getByText(`${mockPlayerInfo.balance} ae`);
    expect(playerBalance).toBeTruthy();
  });
});
