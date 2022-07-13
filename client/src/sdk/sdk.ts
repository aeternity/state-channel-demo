import {
  AeSdk,
  Node,
  generateKeyPair,
  MemoryAccount,
  AeSdkWallet,
  RpcConnectionDenyError,
  WALLET_TYPE,
  RpcRejectedByUserError,
  BrowserWindowMessageConnection,
} from '@aeternity/aepp-sdk';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';

export const NODE_URL =
  import.meta.env.VITE_NODE_URL ?? 'http://localhost:3013';
export const COMPILER_URL =
  import.meta.env.VITE_COMPILER_URL ?? 'http://localhost:3080';
export const IS_USING_LOCAL_NODE = !import.meta.env.VITE_NODE_URL.includes(
  'testnet.aeternity.io'
);
const FAUCET_PUBLIC_ADDRESS = import.meta.env
  .VITE_FAUCET_PUBLIC_ADDRESS as EncodedData<'ak'>;

const aeppInfo: any = {};
const genConfirmCallback = (getActionName) => (aeppId, params) => {
  console.log('hello');
  if (
    !confirm(
      `Client ${
        aeppInfo[aeppId].name
      } with id ${aeppId} want to ${getActionName(params)}`
    )
  ) {
    throw new RpcRejectedByUserError();
  }
};

export async function getSdk() {
  const account = new MemoryAccount({ keypair: generateKeyPair() });
  const aeSdk = new AeSdkWallet({
    id: window.origin,
    type: WALLET_TYPE.window,
    nodes: [{ name: 'ae _devnet', instance: new Node(NODE_URL) }],
    compilerUrl: COMPILER_URL,
    name: 'Wallet Iframe',
    onConnection(aeppId, params) {
      console.log('onConnection', aeppId, params);
      if (!confirm(`Aepp ${params.name} with id ${aeppId} wants to connect`)) {
        throw new RpcConnectionDenyError();
      }
      aeppInfo[aeppId] = params;
    },
    onDisconnect(msg, client) {
      console.log('Disconnect client: ', client);
    },
    onSubscription(aeppId) {
      const { name } = aeppInfo[aeppId];
      if (
        !confirm(
          `Aepp ${name} with id ${aeppId} wants to subscribe for accounts`
        )
      ) {
        throw new RpcRejectedByUserError();
      }
    },
    onSign(aeppId, params) {
      console.log('onSign', aeppId, params);
      const { name } = aeppInfo[aeppId];
      if (
        !confirm(`Aepp ${name} with id ${aeppId} wants to sign tx ${params.tx}`)
      ) {
        throw new RpcRejectedByUserError();
      }
    },
    onAskAccounts(aeppId) {
      console.log('onAskAccounts', aeppId);
      const { name } = aeppInfo[aeppId];
      if (!confirm(`Aepp ${name} with id ${aeppId} wants to get accounts`)) {
        throw new RpcRejectedByUserError();
      }
    },
    onMessageSign(aeppId, params) {
      console.log('onMessageSign', aeppId, params);
      const { name } = aeppInfo[aeppId];
      if (
        !confirm(
          `Aepp ${name} with id ${aeppId} wants to sign msg ${params.message}`
        )
      ) {
        throw new RpcRejectedByUserError();
      }
    },
  });

  const connection = new BrowserWindowMessageConnection({
    target: window.parent,
  });

  const clientId = aeSdk.addRpcClient(connection);
  await aeSdk.addAccount(account, { select: true });
  return aeSdk;
}

export async function returnCoinsToFaucet(aeSdk: AeSdk) {
  try {
    await aeSdk.transferFunds(1, FAUCET_PUBLIC_ADDRESS);
  } catch (e) {
    console.error({ e }, 'failed to return funds to faucet');
  }
}

// ! LOCAL NODE USAGE ONLY
export const FAUCET_ACCOUNT = IS_USING_LOCAL_NODE
  ? new MemoryAccount({
      keypair: {
        publicKey: FAUCET_PUBLIC_ADDRESS,
        secretKey: import.meta.env.VITE_FAUCET_SECRET_KEY,
      },
    })
  : null;
