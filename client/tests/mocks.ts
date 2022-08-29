import { SignatureType } from '../src/utils/game-channel/game-channel.types';

export const mockUserTransactions = [
  [
    {
      id: '1',
      description: 'User Initial Transaction',
      signed: SignatureType.proposed,
      onChain: true,
      timestamp: Date.now(),
    },
    {
      id: '2',
      description: 'User Deploy Contract Transaction',
      signed: SignatureType.proposed,
      onChain: true,
      timestamp: Date.now(),
    },
    {
      id: '4',
      description: 'User Shutdown Transaction',
      signed: SignatureType.proposed,
      onChain: true,
      timestamp: Date.now(),
    },
  ],
  [
    {
      id: '3',
      description: 'User Round 1 Transaction',
      signed: SignatureType.proposed,
      onChain: false,
      timestamp: Date.now(),
    },
  ],
];

export const mockBotTransactions = [
  [
    {
      id: '1',
      description: 'Bot Initial Transaction',
      signed: SignatureType.proposed,
      onChain: true,
      timestamp: Date.now(),
    },
    {
      id: '2',
      description: 'Bot Deploy Contract Transaction',
      signed: SignatureType.proposed,
      onChain: false,
      timestamp: Date.now(),
    },
    {
      id: '4',
      description: 'Bot Shutdown Transaction',
      signed: SignatureType.proposed,
      onChain: true,
      timestamp: Date.now(),
    },
  ],
  [
    {
      id: '3',
      description: 'Bot Round 1 Transaction',
      signed: SignatureType.proposed,
      onChain: false,
      timestamp: Date.now(),
    },
  ],
];
