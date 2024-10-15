import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';

export interface Update {
  call_data: Encoded.ContractBytearray;
  contract_id: Encoded.ContractAddress;
  op: 'OffChainCallContract' | 'OffChainNewContract';
  code?: Encoded.ContractBytearray;
  owner?: Encoded.AccountAddress;
  caller_id?: Encoded.AccountAddress;
}

export interface Keypair {
  publicKey: `ak_${string}`;
  secretKey: string;
}
