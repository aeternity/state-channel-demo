import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';

export interface ResponderBaseChannelConfig {
  address: Encoded.AccountAddress;
  port: number;
  host: string;
}
