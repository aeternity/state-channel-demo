# Channel Lifecycle Example

In this document describe the process of building a State Channel application on your own. For each step we will provide references to the code of the demo.
Our implementation follows a Client-Server architecture but it is not required for all State Channel applications.

## Step 0: Prerequesites
When building a real world State Channel application it is strongly advised to host your own Aeternity [Node](https://docs.aeternity.io/en/stable/docker/).
Following the Client-Server architecture, you will need two projects, one for each. 

## Step 1: Initialize SDK
Firstly we need an sdk instance for each participant
We propose to separate business logic per service to increase readability and modularity of the code
Therefore the following code is advised to reside in a file named `sdk.service.js`

### Initiator side (Similar to) Responder side
```js
const aeSdk = new AeSdk({
  compilerUrl: <COMPILER_URL>,
  nodes: [
    {
      name: 'aeNode',
      instance: new Node(<NODE_URL>),
    },
  ],
});
```
[`State Channel Demo Client Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/sdk-service/sdk-service.js#L44)

[`State Channel Demo Server Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/server/src/services/sdk/sdk.service.ts#L14)

## Step 2: Generate a new account keypair
Each participant requires a unique keypair. 
In the case of the client, only one keypair is required per client.
For the server it is required that a new keypair is generated for each new client.

For the client, the following code is advised to reside inside the `sdk.service.js` file.
For the server it could reside in a file that handles the generation of bots e.g. `bot.service.js`. 

### Initiator side (Similar to) Responder side
```js
 const keypair = generateKeyPair();
 await aeSdk.addAccount(new MemoryAccount({ keypair }, {
      select: true,
 }));
```
[`State Channel Demo Client Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/sdk-service/sdk-service.js#L32)

[`State Channel Demo Server Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/server/src/services/bot/bot.service.ts#L537)

## Step 3: Request coins from faucet app (Only on testnet network)
Each participant requires some coins in order to send transactions and place his bets.

For development purposes we use the faucet to fund the particepant's accounts.
The following code is advised to reside inside the `sdk.service.js` file for both the server and the client.
### Initiator side (Similar to) Responder side
```js
axios.post(`https://faucet.aepps.com/account/${aeSdk.selectedAddress}`, {});
```
[`State Channel Demo Client Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/sdk-service/sdk-service.js#L75)

[`State Channel Demo Server Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/server/src/services/sdk/sdk.service.ts#L57)

## Step 4: Sign transactions
These sign functions are part of the channel configuration. They are executed on each channel related transaction, and each one of them needs to **be confirmed by both ends**.

These functions could reside in a file called `game-channel.service.js` for the client, and inside the `bot.service.js` file for the server

Utility functions used
- [verifyContractBytecode](#verifyContractBytecode)
- [buildContract](#buildContract)
```js

// helper variable to keep track of the last contract caller
let lastContractCaller;

async function responderSignTx(
  tag: string,
  tx: Encoded.Transaction,
  options?: {
    updates: {
      call_data: Encoded.ContractBytearray;
      contract_id: Encoded.ContractAddress;
      op: 'OffChainCallContract' | 'OffChainNewContract';
      code?: Encoded.ContractBytearray;
      owner?: Encoded.AccountAddress;
      caller_id?: Encoded.AccountAddress;
    }[];
  }
): Promise<Encoded.Transaction> {
  const update = options?.updates?.[0];
  const txHash = buildTxHash(tx);

  /**
   * if we are signing a transaction that deploys contract,
   * we want to make sure that it is valid  
   * and has the same source code with the one we use.
   */
  if (update?.op === 'OffChainNewContract' && update?.code && update?.owner) {
    const proposedBytecode = update.code;
    const isContractValid = await verifyContractBytecode(proposedBytecode);
    if (!isContractValid) throw new Error('Contract is not valid');

  /** 
   * we need to also build and compile the contract 
   * on both ends in order to call the contract 
   * with the correct call data
   */
    void buildContract(unpackTx(tx).tx.round, update.owner)
  }

  if(options?.updates?.[0]?.op === 'OffChainCallContract') {
    lastContractCaller = options.updates.[0].caller_id;
  }
  return aeSdk.signTransaction(tx);
}

async function initiatorSignTx(
  tag: string,
  tx: Encoded.Transaction,
  options?: {
    updates: {
      call_data: Encoded.ContractBytearray;
      contract_id: Encoded.ContractAddress;
      op: string;
      code?: Encoded.ContractBytearray;
      owner?: Encoded.AccountAddress;
      caller_id?: Encoded.AccountAddress;
    }[];
  }
): Promise<Encoded.Transaction> {
  if(options?.updates?.[0]?.op === 'OffChainCallContract') {
    lastContractCaller = options.updates.[0].caller_id;
  }
  return aeSdk.signTransaction(tx);
}
```
[`State Channel Demo Client Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/game-channel/game-channel.js#L329)

[`State Channel Demo Server Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/server/src/services/bot/bot.service.ts#L584)

## Step 5: Initialize Channel
Here we have some options which are mutual and some which are role-dependent. Read more [here](https://github.com/aeternity/protocol/blob/master/node/api/channels_api_usage.md#channel-establishing-parameters)

Since both parties share this mutual configuration, the client recieves this information from the server.
The server can store this information inside a file called `bot.constants.js`
The client can fetch this information and initialize the channel inside the `game-channel.service.js` file 


```js
const MUTUAL_CHANNEL_CONFIGURATION = {
  url: WEBSOCKET_URL,
  pushAmount: 0,
  initiatorAmount: new BigNumber('4.5e18'),
  responderAmount: new BigNumber('4.5e18'),
  channelReserve: 2,
  lockPeriod: 0,
  timeoutIdle: 10 * 60 * 1000,
  debug: false,
  minimumDepthStrategy: 'plain',
  minimumDepth: 0,
};

const responderChannel = Channel.initialize({
  ...MUTUAL_CHANNEL_CONFIGURATION,
  role:'responder',
  sign: responderSignTx,
});

const initiatorChannel = Channel.initialize({
   ...MUTUAL_CHANNEL_CONFIGURATION,
   role:'initiator',
   sign: initiatorSignTx,
});
```
[`State Channel Demo Client Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/game-channel/game-channel.js#L199)

[`State Channel Demo Server Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/server/src/services/bot/bot.constants.ts#L17)

## Step 6: Registering events
Throughout the channel lifecycle, we need to register some events. Example of such events may be channel [status change](https://github.com/aeternity/aepp-sdk-js/blob/develop/src/channel/index.ts#L159) or channel state change.

This code can reside insde the `game-channel.service.js` and `bot.services.js` files for the client and server respectively

Utility functions used
- [handleOpponentCall](#handleOpponentCall)
- [getRoundContractCall](#getRoundContractCall)

```js

// used in reconnecting
let fsmId;
let channelId;
export async function registerEvents(
  channel: Channel,
  configuration: ChannelOptions,
) {
  channel.on('statusChanged', (status) => {
    switch(status) {
      case 'closed':
        // do something
        break;
      case 'died':
        // do something
        break;
      case 'error':
        // do something
        break;
      case 'open':
        channelId = channel.id();
        fsmId = channel.fsmId()
        // do something
        break;
      case 'signed':
        // do something
        break;
    }
  })

  /**
   * This is the most important event. 
   * Here, it is advised to do several things such as:
   * - update your UI
   * - save the channel state locally in order to reconnect to the channel
   * - make your next move depending on the current contract state
   */
  channel.on('stateChanged', async () => {
    if (contract  && lastContractCaller !== <CURRENT_PARTICIPANT_ADDRESS>) {
      const latestRoundCallByOtherPeer = await getRoundContractCall(
        channel,
        contractAddress,
        lastContractCaller,
        channel.round(),
      );
      await handleOpponentCall(channel, contract, latestRoundCallByOtherPeer)
    }
  })
}
```
[`State Channel Demo Client Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/game-channel/game-channel.js#L410)

[`State Channel Demo Server Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/server/src/services/bot/bot.service.ts#L448)

## Step 7: Deploying contract on channel
Here, the initiator has to deploy the contract on the channel. Then, responder will recieve a
`OffChainNewContract` operation which will need to be co-signed to be confirmed by them.

This code can reside inside the `game-channel.service.js` for the client, and the `contract.service.js`

```js
const CONTRACT_CONFIGURATION = {
  // initial deposit for contract balance
  deposit: 0e18,
  vmVersion: 5,
  abiVersion: 3,
};
const contract = await sdk.getContractInstance({
    source: contractSource,
    onAccount,
});
await contract.compile();
await initiatorChannel.createContract(
  {
    ...CONTRACT_CONFIGURATION,
    code: contract.bytecode,
    callData: contract.calldata.encode(CONTRACT_NAME, Methods.init, [
      ...Object.values(config),
    ]) as Encoded.ContractBytearray,
  },
  async (tx) => aeSdk.signTransaction(tx);
);
```
[`State Channel Demo Client Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/game-channel/game-channel.js#L466)

[`State Channel Demo Server Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/server/src/services/contract/contract.service.ts#L50)

## Step 8: Reconnecting
In cases where we have saved the channel state locally for example via `localStorage`, we can reconnect to the channel.
Utility functions used
- [checkIfChannelIsStillOpen](#checkIfChannelIsStillOpen)


```js
async function reconnectChannel(channel,savedState) {
  if (!(await this.checkifChannelIsStillOpen())) {
    return;
  }
  const channel = await Channel.initialize(
    {
      ...channelConfig,
      existingChannelId: channelId,
      existingFsmId: fsmId,
      role: 'responder',
      sign: responderSignTx,
    }
  );
  registerEvents(channel, savedState.channelConfig);
}
```

## Step 9: Closing channel
There are 2 scenarions

### Channel is mutually closed
For example the responder would like to close the channel.
In this case, the responder can simply execute `channel.shutdown`. The initiator will co-sign it and the channel will be closed.

```js
responderChannel.shutdown(responderSignTx);
``` 

### Channel is in a `died` state and can be force-closed (solo-closed)
In this case, a participant has to execute 2 on-chain transactions in order to close the channel. These are:
- `channel_close_solo`
- `channel_settle`

```js
  const channelId = gameSession.channelWrapper.instance.id();

  const poi = channel.poi({
    accounts: [configuration.initiatorId, configuration.responderId],
  })
  
  const channelState = await channel.state();
  const lastSignedTx = channelState.signedTx;

  const closeSoloTx = await aeSdk.buildTx(Tag.ChannelCloseSoloTx, {
    channelId,
    fromId: aeSdk.selectedAddress,
    poi,
    payload: lastSignedTx,
  });

  let signedTx = await aeSdk.signTransaction(closeSoloTx);
  await aeSdk.sendTransaction(signedTx, {
    verify: true,
    waitMined: true,
  });
  const settleTx = await aeSdk.buildTx(Tag.ChannelSettleTx, {
    channelId: channelId,
    fromId: aeSdk.selectedAddress,
    initiatorAmountFinal: initiatorAmount,
    responderAmountFinal: responderAmount,
  });
  signedTx = await aeSdk.signTransaction(settleTx);
  await aeSdk.sendTransaction(signedTx, {
    verify: true,
    waitMined: true,
  });
```

# Depost & Withdraw Actions
Throughout the channel lifecycle, participants can deposit 
and withdraw funds from the channel.

After the channel had been opened any of the participants can initiate a deposit/withdraw.
The process closely resembles the update. The most notable difference is that the
transaction has been co-signed: it is `channel_deposit_tx` / `channel_withdraw_tx` 
and after the procedure is finished - it is being posted on-chain.
Any of the participants can initiate a deposit/withdraw. The only requirements are:
- Channel is already opened
- No off-chain update/deposit/withdrawal is currently being performed
- Channel is not being closed or in a solo closing state
- The deposit amount must be equal to or greater than zero, and cannot exceed
the available balance on the channel (minus the `channel_reserve`)

`deposit` and `withdraw` can accept 3 callbacks as the 3rd argument, for example:
```js
await initiatorChannel.deposit(
  1e18,
  initiatorSign,
  { onOnChainTx, onOwnDepositLocked, onDepositLocked }
);
```
Where 
- After the other party had signed the deposit/withdraw transaction, the transaction is posted
on-chain and `onOnChainTx` callback is called with on-chain transaction as first argument.
- After computing transaction hash it can be tracked on the chain: entering the mempool,
block inclusion and a number of confirmations.
- After the `minimum_depth` block confirmations `onOwnDepositLocked` callback is called
(without any arguments).
- When the other party had confirmed that the block height needed is reached
`onDepositLocked` callback is called (without any arguments).
## Deposit

```js
// 1AE
const depositAmount = 1e18;
initiatorChannel.deposit(depositAmount, initiatorSignTx);
```

## Withdraw
```js
await initiatorChannel.withdraw(1e18,initiatorSign);
```

# Utility Functions
## `verifyContractBytecode`
```js
async function verifyContractBytecode(
  bytecode: Encoded.ContractBytearray,
  source = contractSource
) {
  let isEqual = false;
  try {
    await aeSdk.compilerApi.validateByteCode({
      bytecode,
      source,
      options: {},
    });
    isEqual = true;
  } catch (e) {
    isEqual = false;
  }
  return isEqual;
}
```

## `buildContract`
```js
import { encodeContractAddress } from '@aeternity/aepp-sdk';

async function buildContract(
  contractCreationChannelRound: number,
  owner: Encoded.AccountAddress
) {
  const contract = await aeSdk.getContractInstance({
    source: contractSource,
  });
  await contract.compile();
  const contractAddress = encodeContractAddress(
    owner,
    contractCreationChannelRound
  );

  return {
    contract, contractAddress
  }
}
```

## `getRoundContractCall`
```js
async function getRoundContractCall(
  channel: Channel,
  contractAddress: Encoded.Contract,
  caller: Encoded.AccountAddress,
  round: number
) {
  try {
    const contractCall = await channel.getContractCall({
      caller,
      contract: contractAddress,
      round,
    });
    return contractCall;
  } catch (e) {
    return null;
  }
}
```


## `handleOpponentCall`
```js
export async function handleOpponentCall(
  channel,
  contract,
  contractCall,
) {
  const decodedEvents = channel.decodeEvents(
    contractCall.log,
  );
  /**
   * [{
   *  name: "Player1Moved",
   *  args: [
   *    "paper",
   *    10000000000000000n
   *  ],
   *  contract: {
   *    name: "RockPaperScissors",
   *    address: "ct_2DEp9T7qLbrmbZqVdnrHwiTEphYt32F3nmafozgRtTHXoRMDt5"
   *  }
   * }]
   */


  // here you can use a switch statement and make your next move based on events
  const callDataToBeSent = contract.calldata.encode(
    CONTRACT_NAME, 
    <METHOD_NAME>, 
    [...<METHOD_ARGUMENTS>]
  );

  await channel.callContract({
    {
      amount: <AMOUNT_TO_CALL_CONTRACT_WITH>,
      calldata: callDataToBeSent,
      contract: contractAddress,
      abiVersion: 3
    }
  })
}
```

## `checkIfChannelIsStillOpen`
In order to check  if a channel is still open, we can make a get request to  node.
```js
  async function checkifChannelIsStillOpen(channelId) {
    const response = await fetch(`${NODE_URL}/v3/channels/${channelId}`);
    const result = await response.json();
    return !!result.id;
  }
```
