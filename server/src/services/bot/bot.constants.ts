import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import BigNumber from 'bignumber.js';
import { WEBSOCKET_URL } from '../sdk';

/**
 * @see {@link https://github.com/aeternity/protocol/blob/master/node/api/channels_api_usage.md#channel-establishing-parameters}
 */
export const MUTUAL_CHANNEL_CONFIGURATION: Partial<ChannelOptions> & {
  minimumDepthStrategy: 'plain' | 'txFee';
  minimumDepth: number;
} = {
  url: WEBSOCKET_URL,
  pushAmount: 0,
  initiatorAmount: new BigNumber('4.5e18'),
  responderAmount: new BigNumber('4.5e18'),
  channelReserve: 2,
  lockPeriod: 10,
  // workaround: minimize the number of node hangs
  timeoutIdle: 2 * 60 * 60 * 1000,
  debug: false,
  // How to calculate minimum depth - either txfee (default) or plain. We use
  // `plain` with `minimumDepth` in order to reduce delay.
  minimumDepthStrategy: 'plain',
  minimumDepth: 0,
} as const;
