import { BigNumber } from 'bignumber.js';
import { Channel } from '@aeternity/aepp-sdk';
import { ChannelState } from '@aeternity/aepp-sdk/es/channel/internal';
import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import { Moves } from '../contract/contract.constants';
import { ENVIRONMENT_CONFIG } from '../sdk';

export interface GameSession {
  channelWrapper: {
    instance: Channel;
    poi?: Encoded.Poi;
    state?: ChannelState;
    balances?: {
      responderAmount: BigNumber;
      initiatorAmount: BigNumber;
    };
  };
  contractState?: {
    instance?: ContractInstance;
    callDataToSend?: Encoded.ContractBytearray;
    address?: Encoded.ContractAddress;
    lastCaller?: Encoded.AccountAddress;
    botMove?: Moves;
  };
  participants: {
    responderId: Encoded.AccountAddress;
    initiatorId: Encoded.AccountAddress;
  };
}

export interface ServiceStatus {
  channelsOpenCurrently: number;
  channelsInitialized: number;
  channelsOpened: number;
  timestamp: Date;
  env: typeof ENVIRONMENT_CONFIG;
}

export enum SignatureType {
  proposed = 'Signed (proposed)',
  confirmed = 'Co-signed (confirmed)',
  declined = 'Declined',
}
export interface TransactionLog {
  id: Encoded.TxHash;
  onChain: boolean;
  description: string;
  signed: SignatureType;
  timestamp: number;
}
