import { SignatureType } from '../src/utils/game-channel/game-channel.types';
import { TransactionLog } from '../src/components/transaction/transaction.vue';

export const mockUserTransactions: TransactionLog[][] = [
  [
    {
      id: 'th_1',
      description: 'User Initial Transaction',
      signed: SignatureType.proposed,
      onChain: true,
      timestamp: Date.now(),
    },
    {
      id: 'th_2',
      description: 'User Deploy Contract Transaction',
      signed: SignatureType.proposed,
      onChain: true,
      timestamp: Date.now(),
    },
    {
      id: 'th_4',
      description: 'User Shutdown Transaction',
      signed: SignatureType.proposed,
      onChain: true,
      timestamp: Date.now(),
    },
  ],
  [
    {
      id: 'th_3',
      description: 'User Round 1 Transaction',
      signed: SignatureType.proposed,
      onChain: false,
      timestamp: Date.now(),
    },
  ],
];

export const mockBotTransactions: TransactionLog[][] = [
  [
    {
      id: 'th_1',
      description: 'Bot Initial Transaction',
      signed: SignatureType.proposed,
      onChain: true,
      timestamp: Date.now(),
    },
    {
      id: 'th_2',
      description: 'Bot Deploy Contract Transaction',
      signed: SignatureType.proposed,
      onChain: false,
      timestamp: Date.now(),
    },
    {
      id: 'th_4',
      description: 'Bot Shutdown Transaction',
      signed: SignatureType.proposed,
      onChain: true,
      timestamp: Date.now(),
    },
  ],
  [
    {
      id: 'th_3',
      description: 'Bot Round 1 Transaction',
      signed: SignatureType.proposed,
      onChain: false,
      timestamp: Date.now(),
    },
  ],
];
