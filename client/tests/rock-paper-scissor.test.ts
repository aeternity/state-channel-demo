import { GameChannel, Selections } from './../src/sdk/GameChannel';
import { render } from '@testing-library/vue';
import { describe, it, expect, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import RockPaperScissors from '../src/components/RockPaperScissors.vue';

describe('Rock Paper Scissors Component', () => {
  const gameChannel = new GameChannel();

  const gameChannelSpy = vi
    .spyOn(gameChannel, 'callContract')
    .mockResolvedValue({
      accepted: true,
      signedTx: 'tx_l',
    });
  it('displays Rock Paper Scissors buttons', async () => {
    const RockPaperScissorsEl = render(RockPaperScissors, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              channel: {
                channel: gameChannel,
              },
            },
          }),
        ],
      },
    });

    expect(RockPaperScissorsEl.getByText('Choose one')).toBeTruthy();
    const rockBtn = RockPaperScissorsEl.getByText('ROCK');
    const paperBtn = RockPaperScissorsEl.getByText('PAPER');
    const scissorsBtn = RockPaperScissorsEl.getByText('SCISSORS');
    expect(rockBtn).toBeTruthy();
    expect(paperBtn).toBeTruthy();
    expect(scissorsBtn).toBeTruthy();
    expect(RockPaperScissorsEl.getByTestId('userSelection').innerHTML).toBe('');
    expect(RockPaperScissorsEl.getByTestId('botSelection').innerHTML).toBe('');
  });

  it('displays user and bot selections', async () => {
    await gameChannel.setUserSelection(Selections.rock);
    gameChannel.setBotSelection(Selections.paper);

    const RockPaperScissorsEl = render(RockPaperScissors, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              channel: {
                channel: gameChannel,
              },
            },
          }),
        ],
      },
    });

    expect(RockPaperScissorsEl.getByTestId('userSelection').innerHTML).toBe(
      'rock'
    );
    expect(RockPaperScissorsEl.getByTestId('botSelection').innerHTML).toBe(
      'paper'
    );
    expect(RockPaperScissorsEl.getByText("Bot's selection")).toBeTruthy();

    expect(gameChannelSpy).toBeCalled();
  });
});
