import { Channel } from '@aeternity/aepp-sdk';
import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';

export interface GameSession {
  channel: Channel;
  contractState?: {
    instance?: ContractInstance;
    callDataToSend?: Encoded.ContractBytearray;
    address?: Encoded.ContractAddress;
  };
  participants: {
    responderId: Encoded.AccountAddress;
    initiatorId: Encoded.AccountAddress;
  };
}

export interface TransactionLog {
  id: string;
  onChain: boolean;
  description: string;
  signed: boolean;
  timestamp: number;
}
