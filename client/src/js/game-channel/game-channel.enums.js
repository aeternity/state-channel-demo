/**
 * @enum {'rock'
 * |'paper'
 * |'scissors'
 * |'none'
 * }
 */
export const Selections = {
  rock: 'rock',
  paper: 'paper',
  scissors: 'scissors',
  none: 'none',
};

/**
 * @enum {'init'
 * |'provide_hash'
 * |'get_state'
 * |'reveal'
 * |'player0_dispute_no_reveal'
 * |'player1_dispute_no_reveal'
 * |'set_timestamp'
 * }
 */
export const Methods = {
  init: 'init',
  provide_hash: 'provide_hash',
  get_state: 'get_state',
  player1_move: 'player1_move',
  reveal: 'reveal',
  player1_dispute_no_reveal: 'player1_dispute_no_reveal',
  player0_dispute_no_move: 'player0_dispute_no_move',
  set_timestamp: 'set_timestamp',
};

/**
 * @enum {'Signed (proposed)'
 * |'Co-signed (confirmed)'
 * |'Declined'
 * }
 */
export const SignatureTypes = {
  proposed: 'Signed (proposed)',
  confirmed: 'Co-signed (confirmed)',
  declined: 'Declined',
};

/**
 * @enum {'Player0Won'
 * |'Player1Won'
 * |'Draw'
 * |'Player0ProvidedHash'
 * |'Player0Revealed'
 * |'Player1Moved'
 * |'Player0WonDispute'
 * |'Player1WonDispute
 * }
 */
export const ContractEvents = {
  player0Won: 'Player0Won',
  player1Won: 'Player1Won',
  draw: 'Draw',
  player0ProvidedHash: 'Player0ProvidedHash',
  player0Revealed: 'Player0Revealed',
  player1Moved: 'Player1Moved',
  player0WonDispute: 'Player0WonDispute',
  player1WonDispute: 'Player1WonDispute',
};
