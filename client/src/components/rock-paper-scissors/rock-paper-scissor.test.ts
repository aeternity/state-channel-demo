import { GameChannel } from '../../utils/game-channel/game-channel';
import { render, fireEvent } from '@testing-library/vue';
import { describe, it, expect, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import RockPaperScissors from './rock-paper-scissors.vue';
import { Selections } from '../../utils/game-channel/game-channel.types';

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
    expect(() => RockPaperScissorsEl.getByTestId('botSelection')).toThrow();
  });

  it('displays only user selection if result is not revealed', async () => {
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
    expect(() => RockPaperScissorsEl.getByTestId('botsSelection')).toThrow();
    expect(() => RockPaperScissorsEl.getByText("Bot's selection")).toThrow();

    expect(gameChannelSpy).toBeCalled();
  });

  it('displays only user selection if game is not completed', async () => {
    await gameChannel.setUserSelection(Selections.rock);
    gameChannel.setBotSelection(Selections.paper);
    gameChannel.gameRound.isCompleted = true;

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
    expect(gameChannelSpy).toBeCalled();
  });

  it('resets game state if user wants to play another round', async () => {
    await gameChannel.setUserSelection(Selections.rock);
    gameChannel.setBotSelection(Selections.paper);
    gameChannel.gameRound.isCompleted = true;
    gameChannel.gameRound.winner = 'ak_test';

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

    expect(
      RockPaperScissorsEl.getByText("It's a draw").innerHTML
    ).toBeDefined();

    const resetButton = RockPaperScissorsEl.getByTestId('btn-play-again');

    await fireEvent.click(resetButton);

    const picks = ['ROCK', 'PAPER', 'SCISSORS'];

    picks.forEach(async (pick) => {
      expect(
        (RockPaperScissorsEl.getByText(pick) as HTMLButtonElement).disabled
      ).toBeFalsy();
    });
  });
});
