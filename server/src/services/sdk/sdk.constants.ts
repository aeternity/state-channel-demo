import { MemoryAccount } from '@aeternity/aepp-sdk';
import env from '../../env';

const ENVIRONMENT = ['development', 'test'].includes(process.env.NODE_ENV)
  ? 'development'
  : 'testnet';
export const WEBSOCKET_URL = env[ENVIRONMENT]?.WS_URL;
export const NODE_URL = env[ENVIRONMENT]?.NODE_URL;
export const COMPILER_URL = env[ENVIRONMENT]?.COMPILER_URL;
export const NETWORK_ID = env[ENVIRONMENT]?.NETWORK_ID;
export const IGNORE_NODE_VERSION = env[ENVIRONMENT]?.IGNORE_VERSION === 'true';
export const FAUCET_PUBLIC_ADDRESS = env[ENVIRONMENT]?.FAUCET_PUBLIC_ADDRESS;
export const IS_USING_LOCAL_NODE = !NODE_URL?.includes('testnet');
// ! LOCAL NODE USAGE ONLY
const FAUCET_SECRET_KEY = ENVIRONMENT === 'development' && env[ENVIRONMENT]?.FAUCET_SECRET_KEY;
export const FAUCET_ACCOUNT = IS_USING_LOCAL_NODE
  ? new MemoryAccount({
    keypair: {
      publicKey: FAUCET_PUBLIC_ADDRESS,
      secretKey: FAUCET_SECRET_KEY,
    },
  })
  : null;
