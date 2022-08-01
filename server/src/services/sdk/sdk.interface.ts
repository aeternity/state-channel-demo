import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';

export interface Update {
  call_data: Encoded.ContractBytearray;
  contract_id: Encoded.ContractAddress;
  op: 'OffChainCallContract' | 'OffChainNewContract';
}
