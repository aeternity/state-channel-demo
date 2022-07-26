import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';

export interface Update {
  call_data: EncodedData<'cb'>;
  contract_id: EncodedData<'ct'>;
  op: 'OffChainCallContract' | 'OffChainNewContract';
}
