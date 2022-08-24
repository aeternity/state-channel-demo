export const mockUserTransactions = [
  [
    {
      id: '1',
      description: 'User Initial Transaction',
      signed: true,
      onChain: true,
      timestamp: Date.now(),
    },
    {
      id: '2',
      description: 'User Deploy Contract Transaction',
      signed: true,
      onChain: true,
      timestamp: Date.now(),
    },
    {
      id: '4',
      description: 'User Shutdown Transaction',
      signed: true,
      onChain: true,
      timestamp: Date.now(),
    },
  ],
  [
    {
      id: '3',
      description: 'User Round 1 Transaction',
      signed: true,
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
      signed: true,
      onChain: true,
      timestamp: Date.now(),
    },
    {
      id: '2',
      description: 'Bot Deploy Contract Transaction',
      signed: true,
      onChain: false,
      timestamp: Date.now(),
    },
    {
      id: '4',
      description: 'Bot Shutdown Transaction',
      signed: true,
      onChain: true,
      timestamp: Date.now(),
    },
  ],
  [
    {
      id: '3',
      description: 'Bot Round 1 Transaction',
      signed: true,
      onChain: false,
      timestamp: Date.now(),
    },
  ],
];
