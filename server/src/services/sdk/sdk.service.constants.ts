import { MemoryAccount } from '@aeternity/aepp-sdk';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';

export const NODE_URL = process.env.NODE_URL ?? 'http://localhost:3013';
export const COMPILER_URL = process.env.COMPILER_URL ?? 'http://localhost:3080';
export const NETWORK_ID = process.env.NETWORK_ID ?? 'ae_devnet';
export const IGNORE_NODE_VERSION = process.env.IGNORE_VERSION === 'true';
export const IS_USING_LOCAL_NODE = !process?.env?.NODE_URL?.includes(
  'testnet.aeternity.io',
);

// ! LOCAL NODE USAGE ONLY
const GENESIS_PUBLIC_KEY = (process.env.PUBLIC_KEY as EncodedData<'ak'>)
  ?? 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR';
const GENESIS_SECRET_KEY = process.env.SECRET_KEY
  ?? 'bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b';
export const GENESIS_ACCOUNT = new MemoryAccount({
  keypair: { publicKey: GENESIS_PUBLIC_KEY, secretKey: GENESIS_SECRET_KEY },
});
