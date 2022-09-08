import { MemoryAccount } from '@aeternity/aepp-sdk';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import env from '../../env';

const ENVIRONMENT = process.env.NODE_ENV as keyof typeof env;
export const WEBSOCKET_URL = env[ENVIRONMENT]?.WS_URL ?? process.env.WS_URL;
export const NODE_URL = env[ENVIRONMENT]?.NODE_URL ?? process.env.NODE_URL;
export const COMPILER_URL = env[ENVIRONMENT]?.COMPILER_URL ?? process.env.COMPILER_URL;
export const NETWORK_ID = env[ENVIRONMENT]?.NETWORK_ID ?? process.env.NETWORK_ID;
export const IGNORE_NODE_VERSION = env[ENVIRONMENT]?.IGNORE_VERSION === 'true'
  ?? process.env.IGNORE_VERSION === 'true';
export const FAUCET_PUBLIC_ADDRESS = env[ENVIRONMENT]?.FAUCET_PUBLIC_ADDRESS
  ?? (process.env.FAUCET_PUBLIC_ADDRESS as Encoded.AccountAddress);
export const IS_USING_LOCAL_NODE = !NODE_URL?.includes('testnet');
// ! LOCAL NODE USAGE ONLY
const FAUCET_SECRET_KEY = (ENVIRONMENT === 'development' && env[ENVIRONMENT]?.FAUCET_SECRET_KEY)
  || process.env.FAUCET_SECRET_KEY;
export const FAUCET_ACCOUNT = IS_USING_LOCAL_NODE
  ? new MemoryAccount({
    keypair: {
      publicKey: FAUCET_PUBLIC_ADDRESS,
      secretKey: FAUCET_SECRET_KEY,
    },
  })
  : null;
