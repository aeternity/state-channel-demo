import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import BigNumber from 'bignumber.js';
import { WEBSOCKET_URL } from '../sdk';

export const INITIALIZATION_TIMEOUT = 40 * 1000;

/**
 * @see {@link https://github.com/aeternity/protocol/blob/master/node/api/channels_api_usage.md#channel-establishing-parameters}
 */
export const MUTUAL_CHANNEL_CONFIGURATION: Partial<ChannelOptions> & {
  minimumDepthStrategy: 'plain' | 'txFee';
  minimumDepth: number;
  fee: BigNumber;
} = {
  url: WEBSOCKET_URL,
  pushAmount: 0,
  // we provide a big enough fee in order for the tx to be picked earlier
  fee: new BigNumber('0.3e18'),
  initiatorAmount: new BigNumber('4.5e18'),
  responderAmount: new BigNumber('4.5e18'),
  channelReserve: 2,
  // We're using 0 for lockPeriod in order to quickly close the channel
  // in cases where the initiator needs to solo close it and finally.
  // execute channel_settle transaction
  // read more: https://github.com/aeternity/protocol/blob/master/channels/ON-CHAIN.md#channel_settle
  lockPeriod: 0,
  // peers need to respond in maximum 2 minutes
  timeoutIdle: 2 * 60 * 1000,
  // if channel is not open after 40 seconds, we should trigger a timeout
  // and retry
  timeoutInitialized: INITIALIZATION_TIMEOUT,
  timeoutAwaitingOpen: INITIALIZATION_TIMEOUT,
  timeoutFundingCreate: INITIALIZATION_TIMEOUT,
  timeoutFundingLock: INITIALIZATION_TIMEOUT,

  debug: false,
  // How to calculate minimum depth - either txfee (default) or plain. We use
  // `plain` with `minimumDepth` in order to reduce delay.
  minimumDepthStrategy: 'plain',
  minimumDepth: 0,
} as const;
