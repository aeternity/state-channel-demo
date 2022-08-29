import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import { BigNumber } from 'bignumber.js';

export interface GameRound {
  stake: BigNumber;
  index: number;
  hashKey?: string;
  userSelection?: Selections;
  botSelection?: Selections;
  winner?: Encoded.AccountAddress;
  isCompleted?: boolean;
  hasRevealed?: boolean;
  userInAction: boolean;
}

export interface Update {
  call_data: Encoded.ContractBytearray;
  contract_id: Encoded.ContractAddress;
  op: 'OffChainCallContract' | 'OffChainNewContract';
  code?: Encoded.ContractBytearray;
  owner?: Encoded.AccountAddress;
  caller_id?: Encoded.AccountAddress;
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

export enum Selections {
  rock = 'rock',
  paper = 'paper',
  scissors = 'scissors',
  none = 'none',
}

export enum SignatureType {
  proposed = 'Signed (proposed)',
  confirmed = 'Co-signed (confirmed)',
  declined = 'Declined',
}
