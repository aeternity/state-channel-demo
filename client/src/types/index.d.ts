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
  shouldHandleBotAction: boolean;
}

export interface Update {
  call_data: Encoded.ContractBytearray;
  contract_id: Encoded.ContractAddress;
  op: 'OffChainCallContract' | 'OffChainNewContract';
  code?: Encoded.ContractBytearray;
  owner?: Encoded.AccountAddress;
  caller_id?: Encoded.AccountAddress;
}

export interface TransactionLogGroup {
  [round: number]: Array<TransactionLog>;
}

export interface StoredState {
  // In a real application, this should be more private
  keypair: {
    publicKey: `tx_${string}`;
    secretKey: string;
  };
  channelId?: `ch_${string}`;
  fsmId?: `ba_${string}`;
  channelConfig: ChannelOptions;
  channelRound?: number;
  gameRound: GameRound;
  transactionLogs: {
    userTransactions: TransactionLogGroup;
    botTransactions: TransactionLogGroup;
  };
  contractCreationChannelRound: number;
}
