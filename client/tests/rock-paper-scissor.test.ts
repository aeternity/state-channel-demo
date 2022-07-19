import { render } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import RockPaperScissor from '../src/components/RockPaperScissor.vue';
import { Selections } from '../src/game/gameManager';
import { MockGameManager } from './mocks';

const mockGameManager = new MockGameManager();

describe('Rock Paper Scissor Component', () => {
  it('displays Rock Paper Scissor buttons', async () => {
    const RockPaperScissorEl = render(RockPaperScissor, {
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

    expect(RockPaperScissorEl.getByText('Choose one')).toBeTruthy();
    const rockBtn = RockPaperScissorEl.getByText('ROCK');
    const paperBtn = RockPaperScissorEl.getByText('PAPER');
    const scissorBtn = RockPaperScissorEl.getByText('SCISSOR');
    expect(rockBtn).toBeTruthy();
    expect(paperBtn).toBeTruthy();
    expect(scissorBtn).toBeTruthy();
    expect(RockPaperScissorEl.getByTestId('userSelection').innerHTML).toBe('');
    expect(RockPaperScissorEl.getByTestId('botSelection').innerHTML).toBe('');
  });

  it('displays user and bot selections', async () => {
    await mockGameManager?.setUserSelection(Selections.rock);
    mockGameManager.botSelection = Selections.paper;

    const RockPaperScissorEl = render(RockPaperScissor, {
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

    expect(RockPaperScissorEl.getByTestId('userSelection').innerHTML).toBe(
      'rock'
    );
    expect(RockPaperScissorEl.getByTestId('botSelection').innerHTML).toBe(
      'paper'
    );
    expect(RockPaperScissorEl.getByText("Bot's selection")).toBeTruthy();
  });
});
