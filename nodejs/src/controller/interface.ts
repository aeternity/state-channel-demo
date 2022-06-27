import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';

export interface ResponderBaseChannelConfig {
  address: EncodedData<'ak'>;
  port: number;
  host: string;
}
