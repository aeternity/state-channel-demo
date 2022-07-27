import BigNumber from 'bignumber.js';
import { WEBSOCKET_URL } from '../sdk';

export const MUTUAL_CHANNEL_CONFIGURATION = {
  url: WEBSOCKET_URL,
  pushAmount: 0,
  initiatorAmount: new BigNumber('4.5e18'),
  responderAmount: new BigNumber('4.5e18'),
  channelReserve: 2,
  lockPeriod: 10,
  debug: false,
  timeoutIdle: 60000,
  minimumDepthStrategy: 'plain',
  minimumDepth: 0,
} as const;
