import { Channel } from '@aeternity/aepp-sdk';
import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';

export interface GameSession {
  channel: Channel;
  contractState?: {
    instance?: ContractInstance;
    callDataToSend?: EncodedData<'cb'>;
    address?: EncodedData<'ct'>;
  };
  participants: {
    responderId: EncodedData<'ak'>;
    initiatorId: EncodedData<'ak'>;
  };
}
