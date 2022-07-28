import BigNumber from 'bignumber.js';

export const CONTRACT_CONFIGURATION = {
  deposit: 0e18,
  vmVersion: 5,
  abiVersion: 3,
} as const;

export const CONTRACT_NAME = 'RockPaperScissors';
export const GAME_STAKE = new BigNumber('0.01e18');
export enum Moves {
  rock = 'rock',
  paper = 'paper',
  scissors = 'scissors',
}

export enum Methods {
  init = 'init',
  provide_hash = 'provide_hash',
  get_state = 'get_state',
  player1_move = 'player1_move',
  reveal = 'reveal',
  player1_dispute_no_reveal = 'player1_dispute_no_reveal',
  player0_dispute_no_move = 'player0_dispute_no_move',
  set_timestamp = 'set_timestamp',
}
