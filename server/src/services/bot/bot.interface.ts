import { BigNumber } from 'bignumber.js';
import { Channel } from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import ChannelSpend from '@aeternity/aepp-sdk/es/channel/Spend';
import { type RockPaperScissorsContract } from '../contract';
import { Moves } from '../contract/contract.constants';
import { ENVIRONMENT_CONFIG } from '../sdk';

export interface GameSession {
  channelWrapper: {
    instance: Channel;
    fsmId: Encoded.Bytearray;
    channelId: Encoded.Channel;
    round: number;
    poi?: Awaited<ReturnType<ChannelSpend['poi']>>;
    state?: Awaited<ReturnType<Channel['state']>>;
    configuration: ChannelOptions;
    balances?: {
      responderAmount: BigNumber;
      initiatorAmount: BigNumber;
    };
  };
  contractState?: {
    instance?: RockPaperScissorsContract;
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
  runningSince: number;
  lastReset: number;
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
