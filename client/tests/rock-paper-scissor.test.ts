import { render } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import RockPaperScissors from '../src/components/RockPaperScissors.vue';
import { Selections } from '../src/game/GameManager';
import { MockGameManager } from './mocks';

const mockGameManager = new MockGameManager();

describe('Rock Paper Scissors Component', () => {
  it('displays Rock Paper Scissors buttons', async () => {
    const RockPaperScissorsEl = render(RockPaperScissors, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              game: {
                gameManager: mockGameManager,
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
    await mockGameManager?.setUserSelection(Selections.rock);
    mockGameManager.botSelection = Selections.paper;

    const RockPaperScissorsEl = render(RockPaperScissors, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              game: {
                gameManager: mockGameManager,
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
  });
});
