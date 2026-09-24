import { Encoding, encode, MemoryAccount } from '@aeternity/aepp-sdk';
import env from '../../env';

const ENVIRONMENT = process.env.NODE_ENV === 'test'
  ? 'development'
  : (process.env.NODE_ENV.trim() as keyof typeof env);

if (!Object.keys(env).includes(ENVIRONMENT)) {
  throw new Error(`Environment ${ENVIRONMENT} is not defined in env/index.ts`);
}

export const ENVIRONMENT_CONFIG = env[ENVIRONMENT];

export const WEBSOCKET_URL = ENVIRONMENT_CONFIG.WS_URL;
export const {
  NODE_URL, COMPILER_URL, NETWORK_ID, FAUCET_PUBLIC_ADDRESS,
} = ENVIRONMENT_CONFIG;
export const IGNORE_NODE_VERSION = ENVIRONMENT_CONFIG.IGNORE_VERSION === 'true';
export const IS_USING_LOCAL_NODE = !NODE_URL?.includes('testnet');
// ! LOCAL NODE & DEVELOPMENT NETWORK USAGE ONLY
const FAUCET_SECRET_KEY = ENVIRONMENT === 'development'
  && (ENVIRONMENT_CONFIG as typeof env['development'])?.FAUCET_SECRET_KEY;
// FAUCET_SECRET_KEY is a legacy raw-hex secret key; MemoryAccount now requires sk_-prefixed keys.
export const FAUCET_ACCOUNT = IS_USING_LOCAL_NODE && FAUCET_SECRET_KEY
  ? new MemoryAccount(
    encode(
      Buffer.from(FAUCET_SECRET_KEY, 'hex').subarray(0, 32),
      Encoding.AccountSecretKey,
    ),
  )
  : null;
