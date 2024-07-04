# State Channel Demo: Coding Tutorial

This document describes the process of building a State Channel application on your own. For each step we will provide references to the code of the demo.

Demo implementation showcase is built on a Client/Server architecture. The following components participate in the solution:

* Client Application: A web application that enables a user to play the demo
* Server Application: A server application that acts as a bot player for every user that initiate a game from client application.
* Node:
  * Syncs on-chain state in the æternity network.
  * Runs complex logic in the Finite State Machine (FSM) process which is used to execute off-chain transactions by communicating to clients and other nodes.
  * Stores off-chain state trees (encrypted).

Note:
- While the FSM in the æternity node abstracts a lot of the complexity from you as a developer, it is not required to use it. Depending on the use case, you might want to develop your own implementation to handle off-chain communication & updates (transactions). In any case you should make sure to keep track of on-chain State Channel updates by connecting to an æternity node to react in case the counterparty tries to cheat you.

## Prerequisites
Following the Client/Server demo architecture, you will need to create 2 development projects (client/server). 

When building a real world State Channel application it is strongly advised to host your own Aeternity [Node](https://docs.aeternity.io/en/stable/docker/).


## Step 1: Initialize SDK

At each application we need at first to initialize an sdk instance. It is advised for improved readability and modularity of the code to separate business logic per service. The following code is advised to reside in a file named `sdk.service.js`

### Client side (Similar to Server side)
```js
const aeSdk = new AeSdk({
  onCompiler: new CompilerHttp(<COMPILER_URL>),
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
Each player requires a unique account keypair (private key/public address). In the case of the demo client application, only one keypair is generated per client. For the demo server application a new keypair is generated for each bot that serves a client.

In the client application, the following code is advised to reside inside the `sdk.service.js` file.

In the server application it is proposed to reside in a file that handles the generation of bots e.g. `bot.service.js`. 

### Client side (Similar to Server side)
```js
 const keypair = generateKeyPair();
 await aeSdk.addAccount(new MemoryAccount(secretKey, {
      select: true,
 }));
```
[`State Channel Demo Client Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/sdk-service/sdk-service.js#L32)

[`State Channel Demo Server Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/server/src/services/bot/bot.service.ts#L537)

## Step 3: Request coins from faucet app (Only on testnet network)
Each player requires some coins in order to send transactions and place his bets.

For development purposes we use the faucet to fund the particepant's accounts.

The following code is advised to reside inside the `sdk.service.js` file for both the server and the client applications.

### Client side (Similar to Server side)
```js
axios.post(`https://faucet.aepps.com/account/${aeSdk.selectedAddress}`, {});
```
[`State Channel Demo Client Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/sdk-service/sdk-service.js#L75)

[`State Channel Demo Server Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/server/src/services/sdk/sdk.service.ts#L57)

## Step 4: Sign transactions
SDK sign functions are wrapped in demo code functions. These function names shall be declared as part of the channel configuration (see below). Sign functions are executed at each channel-related transaction.

These functions are proposed to reside in a file called `game-channel.service.js` for the client application and inside the `bot.service.js` file for the server application.

The following utility functions implemented in the demo shall be considered, since they are used in demo sign functions.
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
  // you can add more checks here, for example, if the opponent wants to mutually close the channel
  // but you disagree with it. In this case, you won't sign the transaction.
  if(options?.updates?.[0]?.op === 'OffChainCallContract') {
    // will throw Error if it is not valid
    validateOpponentCall(options?.updates?.[0]);
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
  // you can add more checks here, for example, if the opponent wants to mutually close the channel\
  // but you disagree with it. In this case, you won't sign the transaction.
  if(options?.updates?.[0]?.op === 'OffChainCallContract') {
    // will throw Error if it is not valid
    validateOpponentCall(options?.updates?.[0]);
    lastContractCaller = options.updates.[0].caller_id;
  }
  return aeSdk.signTransaction(tx);
}
```
[`State Channel Demo Client Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/game-channel/game-channel.js#L329)

[`State Channel Demo Server Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/server/src/services/bot/bot.service.ts#L584)

## Step 5: Initialize State Channel
Channel Configuration options can be divided into mutual and role-dependent. Read more [here](https://github.com/aeternity/protocol/blob/master/node/api/channels_api_usage.md#channel-establishing-parameters)

Since both parties share a mutual configuration, it is advised that the client application receives configuration information from the server application.
Moreover the server could store this information inside a file called `bot.constants.js`, while the client application can fetch this information and initialize the channel inside the `game-channel.service.js` file. The demo State Channel Configuration is presented below.

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

## Step 6: Handle State Channel events
Throughout the state channel lifecycle, we need to handle some events inside demo applications. Examples of such events may be channel [status change](https://github.com/aeternity/aepp-sdk-js/blob/develop/src/channel/index.ts#L159) or channel state change.

The folllowing can reside insde the `game-channel.service.js` and `bot.services.js` files for the client and server respectively.

The following utility functions implemented in the demo shall be considered.
- [handleLastCallUpdate](#handleLastCallUpdate)

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
        fsmId = channel.fsmId();
        // do something more
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
   * In demo case, we inspect the events triggered from the last contract call
   */
  channel.on('stateChanged', async (tx) => {
    if (lastContractCaller === '<OTHER_PARTICIPANT_ADDRESS>') {
     handleLastCallUpdate();
    }
  })
}
```
[`State Channel Demo Client Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/game-channel/game-channel.js#L410)

[`State Channel Demo Server Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/server/src/services/bot/bot.service.ts#L448)

## Step 7: Deploy contract on state channel
In our demo, upon channel initialization the server application deploys the contract on the channel. Then, the client application will receive an
`OffChainNewContract` operation which will need to be co-signed.

The demo code resides inside the `game-channel.service.js` file for the client, and inside the `contract.service.js` file for the server.

```js
const CONTRACT_CONFIGURATION = {
  // initial deposit for contract balance
  deposit: 0e18,
  vmVersion: 5,
  abiVersion: 3,
};
const contract = await sdk.initializeContract({
    aci: contractAci,
    bytecode: contractBytecode,
    onAccount,
});
await contract.compile();
await initiatorChannel.createContract(
  {
    ...CONTRACT_CONFIGURATION,
    code: contract.$options.bytecode,
    callData: contract._calldata.encode(CONTRACT_NAME, Methods.init, [
      ...Object.values(config),
    ]) as Encoded.ContractBytearray,
  },
  async (tx) => aeSdk.signTransaction(tx);
);
```
[`State Channel Demo Client Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/game-channel/game-channel.js#L466)

[`State Channel Demo Server Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/server/src/services/contract/contract.service.ts#L50)

## Step 8: Call Contract
This is part is contract specific and can vary depending on the contract.

The following code is advised to reside inside the `game-channel.service.js` file for the client, and inside the `bot.service.js` file for the server.

```js
async callContract(method, params, amount) {
  const result = await channel.callContract(
    {
      amount: amount ?? '<STAKE_AMOUNT>',
      callData: this.contract._calldata.encode(
        '<CONTRACT_NAME>',
        method,
        params
      ),
      contract: '<CONTRACT_ADDRESS>',
      abiVersion: 3,
    },
    async (tx, options) => {
      return this.signTx(method, tx, options);
    }
  );

  if (result.accepted) {
    return result;
  }
}
```
[`State Channel Demo Client Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/game-channel/game-channel.js#L523)

[`State Channel Demo Server Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/server/src/services/bot/bot.service.ts#L321)

## Step 9: Reconnect to an existing State Channel

In cases where the channel state is saved locally (i.e. via `localStorage`) state channel reconnection is possible.

The following utility functions implemented in demo shall be considered.
- [checkIfChannelIsStillOpen](#checkIfChannelIsStillOpen)

The demo code resides inside the `game-channel.service.js` file for the client, and the `bot.service.js` file for the server.

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
[`State Channel Demo Client Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/game-channel/game-channel.js#L227)

[`State Channel Demo Server Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/server/src/services/bot/bot.service.ts#L235)

## Step 10: Closing channel
There are 2 scenarios

### Channel is mutually closed
For example the responder would like to close the channel, and the channel is open with the initiator cooperating.

In this case, the responder can simply execute `channel.shutdown`. The initiator will co-sign it and the channel will be closed.

The following code can reside inside the `game-channel.service.js` file for the client.

```js
responderChannel.shutdown(responderSignTx);
``` 

[`State Channel Demo Client Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/game-channel/game-channel.js#L284)

### Channel is in a `died` state and can be force-closed (solo-closed)
In this case, a participant has to execute 2 on-chain transactions in order to close the channel. These are:
- `channel_close_solo`
- `channel_settle` (after the end of the `lock_period`, which is `0` in the demo configuration)

This code can reside inside the `bot.service.js` file for the server 

```js
  const channelId = channel.id();

  const poi = channel.poi({
    accounts: [configuration.initiatorId, configuration.responderId],
  })
  
  const channelState = await channel.state();
  const lastSignedTx = buildTx(channelState.signedTx);

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

[`State Channel Demo Server Code Reference`](https://github.com/aeternity/state-channel-demo/blob/develop/server/src/services/bot/bot.service.ts#L268)


# Utility Functions
## [`verifyContractBytecode`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/sdk-service/sdk-service.js#L112)
```js
export function verifyContractBytecode(bytecode) {
  return bytecode === contractBytecode;
}
```

## [`buildContract`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/game-channel/game-channel.js#L466)
```js
import { encodeContractAddress } from '@aeternity/aepp-sdk';

async function buildContract(
  contractCreationChannelRound: number,
  owner: Encoded.AccountAddress
) {
  const contract = await aeSdk.initializeContract({
    aci: contractAci,
    bytecode: contractBytecode,
  });
  const contractAddress = encodeContractAddress(
    owner,
    contractCreationChannelRound
  );

  return {
    contract, contractAddress
  }
}
```


## [`handleLastCallUpdate`](https://github.com/aeternity/state-channel-demo/blob/develop/server/src/services/bot/bot.service.ts#L373)
```js
export async function handleLastCallUpdate() {
  let result;
  try {
    const resultPromise = channel.getContractCall({
      caller: '<OTHER_PARTICIPANT_ID>',
      contract: '<CONTRACT_ADDRESS>',
      round: channel.round(),
    });
    result = (await Promise.race([resultPromise, timeout(1000)]))
  } catch (e) {
    // last caller was not the other participant
    return null;
  }

  const decodedEvents = channel.$decodeEvents(
    result.log,
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

  // execute logic based on decodedEvents
  }


  // here you can use a switch statement and make your next move based on events
  const callDataToBeSent = contract._calldata.encode(
    CONTRACT_NAME, 
    '<METHOD_NAME>', 
    [...'<METHOD_ARGUMENTS>']
  );

  await channel.callContract({
    {
      amount:' <AMOUNT_TO_CALL_CONTRACT_WITH>',
      calldata: callDataToBeSent,
      contract: contractAddress,
      abiVersion: 3
    }
  })
}
```

## [`checkIfChannelIsStillOpen`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/game-channel/game-channel.js#L221)
In order to check  if a channel is still open, we can make a get request to  node.
```js
  async function checkifChannelIsStillOpen(channelId) {
    const response = await fetch(`${NODE_URL}/v3/channels/${channelId}`);
    const result = await response.json();
    return !!result.id;
  }
```

## [`validateOpponentCall`](https://github.com/aeternity/state-channel-demo/blob/develop/client/src/js/game-channel/game-channel.js#L500)
```js
  validateOpponentCall(update) {
    const decodedValue = this.contract._calldata
      .decode('<CONTRACT_NAME>', '<EXPECTE_CONTRACT_METHOD>', update.call_data);
    if (decodedValue !== 'EXPECTED_VALUE') {
      throw new Error(`Invalid method`);
      // raise a dispute etc.
    }
  }
  ```
  
  # Appendix
  
  ## Deposit & Withdraw Actions
Throughout the channel lifecycle, participants can deposit and withdraw funds from the channel.

After the channel had been opened either of the participants can initiate a deposit/withdraw.
The process closely resembles the update. The most notable difference is that the
transaction has been co-signed: it is `channel_deposit_tx` / `channel_withdraw_tx` 
and after the procedure is finished, it is posted on-chain.
Either of the participants can initiate a deposit/withdraw. The only requirements are:
- Channel is already opened
- No off-chain update/deposit/withdrawal is currently being performed
- Channel is not being closed or in a solo closing state
- A withdrawal amount must be equal to or greater than zero, and cannot exceed
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
- After the other party has signed the deposit/withdraw transaction, the transaction is posted
on-chain and the `onOnChainTx` callback is called with the on-chain transaction as first argument.
- After computing the transaction hash it can be tracked on the chain: entering the mempool,
block inclusion and a number of confirmations.
- After the `minimum_depth` block confirmations, the `onOwnDepositLocked` callback is called
(without any arguments).
- When the other party had confirmed that the block height needed is reached, its
`onDepositLocked` callback is called (without any arguments).
### Deposit

```js
// 1AE
const depositAmount = 1e18;
initiatorChannel.deposit(depositAmount, initiatorSignTx);
```

### Withdraw
```js
await initiatorChannel.withdraw(1e18,initiatorSign);
```

