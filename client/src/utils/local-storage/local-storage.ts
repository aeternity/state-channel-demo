import { GameRound } from '../game-channel/game-channel.types';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import { resetApp } from '../../main';
import { TransactionLogGroup } from '../../stores/transactions';

export interface StoredState {
  // In a real application, this should be more private
  keypair: {
    publicKey: Encoded.AccountAddress;
    secretKey: string;
  };
  channelId?: Encoded.Channel;
  fsmId?: string;
  channelConfig: ChannelOptions;
  channelRound?: number;
  gameRound: GameRound;
  transactionLogs: {
    userTransactions: TransactionLogGroup;
    botTransactions: TransactionLogGroup;
  };
  contractCreationChannelRound: number;
}

export function getSavedState() {
  try {
    const state = JSON.parse(localStorage.getItem('gameState') || '{}');
    if (Object.keys(state).length === 0) return null;
    if (!state.keypair || state.contractCreationChannelRound == null) {
      throw new Error('Corrupted localstorage.');
    }
    return state as StoredState;
  } catch (e) {
    localStorage.removeItem('gameState');
    alert('Corrupted localStorage. App will reset.');
    resetApp();
  }
}

export function storeGameState(state: StoredState) {
  try {
    localStorage.setItem('gameState', JSON.stringify(state));
  } catch (e) {
    console.info('Error saving state to local storage', e);
  }
}
