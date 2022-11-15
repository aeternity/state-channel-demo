# State channels
State channels allow entities to communicate with each other with the goal of collectively computing some function `f`. This `f` can be as simple as "send 0.1 coins every minute" or it could represent a decentralised exchange. These functions are, in our case, represented by smart contracts and just like any legal contract, we need an arbiter in case one party tries to act maliciously. This arbiter is the blockchain. 
For more information visit [here](https://github.com/aeternity/protocol/tree/master/channels)

# State Channel Demo
A demo use case of æternity's state channels. Users can play a thousand+ rounds of rock-paper-scissors games through the æternity blockchain by deploying a game-rules smart contract into state channels.

<img width="1411" alt="image" src="https://user-images.githubusercontent.com/10965573/201765249-c71b0d18-4fce-4b03-a65b-5ee1f4ae18d9.png">


# Table of Contents 
1. [Installation](#installation)
2. [Running Options](#running-options)
3. [Channel Communication between Apps](#channel-communication-between-apps)
4. [Helpful links](#helpful-links)

**[Step by step channel guide](CHANNEL_USAGE.md)**

> 💚 Interested in the vue.js version? You can find it [here](https://github.com/aeternity/state-channel-demo/tree/vuejs)

# Installation 

```bash
cd contract && npm install
cd ../client && npm install
cd ../server && npm install
```


# Running options
## Local Node and not on connected with an æternity Network

|Terminal #number |  Explanation  |       Command     |
|:----------:|:-------------:|------|
|#1 | Start node |  `docker-compose up` |
|#2 | Start server |    `cd server && npm run dev`   |
|#3 | Start client | `cd client && npm run dev` |

## Deployed node and on Testnet

|Terminal #number |  Explanation  |       Command     |
|:----------:|:-------------:|------|
|#1 | Start server |    `cd server && npm run dev:testnet`   |
|#2  | Start client | `cd client && npm run dev:testnet` |

## Services

| name             | port |
| ---------------- | ---- |
| frontend | 8000 |
| backend - nodejs | 3000 |
| æternity node   | 3013 |
| Sophia Compiler  | 3080 |
| Websocket server | 3014 |



# Channel Communication between Apps

**The server application** can be seen as the game session manager. It is responsible for:

- **Funding Phase**
  - Accept requests from users (channel `responder`) with their account address, their node's port and their node's host.
  - Generate a new account (bot player - channel `initiator`) for each request
  - Fund both accounts by requesting coins from [faucet app](https://faucet.aepps.com/)
  - Respond to users request with the mutual channel configuration. Read more about the channel configuration [here](https://github.com/aeternity/protocol/blob/master/node/api/channels_api_usage.md#channel-establishing-parameters)

- **Channel Initialization Phase**
  - When both accounts have enough funds, the server app will run `Channel.Initialize(channelConfig)` which will execute the on-chain transaction `channel_create_tx` and proceed in a listening-for-events state such as a 'channel open' confirmation
  - Also, as the initiator, bots are responsible for deploying the contract on channel.
  
- **Game rounds** 
  - One channel configuration option is the `sign` function. This function runs whenever any party executes an off-chain transaction which needs to be co-signed by both participants. Therefore whenever the other party makes their move, we can confirm it here and then respond with a next contract call.
  
- **Closing Phase**
  - Scenario 1: User wants to close the channel
    - In this happy path, the user calls an on-chain transaction called `channel_close_mutual`. The bot co-signs it and the final channel state is posted on-chain. The corresponding balances are returned to their owners and the channel status is finalized in `closed`.
  - Scenario 2: User went idle - timeout occured
    - If the channel status changes to `died`, we assume that the user closed their window and a timeout occured (see [`timeout_idle`](channel_close_mutual)). In this case, in order for the channel to close, the bot has to:
      - Execute on-chain [`channel_close_solo`](https://github.com/aeternity/protocol/blob/master/channels/ON-CHAIN.md#channel_close_solo)
      - Execute on-chain [`channel_settle`](https://github.com/aeternity/protocol/blob/master/channels/ON-CHAIN.md#channel_settle). Keep in mind that there's a window where the user can dispute the channel closure. This window is defined in the channel configuration with the `lockPeriod` option. In `state-channel-demo` we use `0` as the value of it in order to reduce delays.
      
      

On the other hand, the **client application** is responsible to do the following:
- Generate a new account and make a POST request to the server (in order to fetch the mutual channel configuration) their
  - Account address
  - Node host (ex. http://localhost:8000)
  - Node port (ex. 3013)
- Initialize a channel with the given configuration
- Verify that the deployed contract has the correct source code
- Respond to other party's actions
- Execute `channel_close_mutual_tx`
- Reconnect to channel in cases of window reload

# FAQ

## How do I build my own state channel demo?

You can find the steps at the complete [State Channel Demo Tutorial Guide](TUTORIAL.md).

## How do State Channel Demo Game transactions take place?

In order to avoid cheating in a turn based implementation (each player move needs to be co-signed in order to be executed), one player hashes his move. The other party receives the off-chain transaction with calldata containing the hash, where he/she can **only** confirm the method opponent called (e.g. opponent picked a move) but not the actual move. 

After co-signing the opponent's hashed move, the next required step is for the second player to make his/her move. This is achieved by calling the corresponding contract method which does not hash the pick (the opponent's move is already sealed in the channel's state tree).

Now that both players have picked, the contract requires from the first player to reveal his move. Revealing is required as only the first player has the key to the hash. With the execution of it, the winning participant receives the stake. In the case of Draw, the stake is returned to both players.


## Is State Channel Demo probably fair?

State Channels offer an innovative solution, where off-chain transactions are executed on top of blockchain technology. 

State channels protocol inherently offers security to the demo.

State Channel Transactions are ruled by co-signed smart contracts. Each participant shall verify the content of a transaction before signing it. Those transactions can be off-chain contract calls, spend transactions or on-chain such as `MutualCloseChannelTx`. All transactions need to be co-signed by both parties.

For each participant, the provided æternity node spawns a state channel process which is responsible to validate state channel transactions through root hash. It builds and enriches State Channel Trees, tracks any possible disputes and warns each client so one could take an appropriate action.

State Channel Demo game verifies also counterpart participant transactions. At each transaction callData content is decoded utlizing æternity's  [calldata lib](https://github.com/aeternity/aepp-calldata-js) which is integrated in the SDK. Participants can utilize this library in order to verify that the opponent is following the anticipated flow of the game (calling the right contract methods). If they accept opponent's transaction, then they can co-sign it, otherwise they can raise a dispute (demo game implementation showcases the happy path).



## If one party tries a cheating move, how this can be disputed?


At first player's side, he/she can inspect the calldata (second player non-hashed move), examine the move the opponent picked and choose to make an inappropriate action (e.g. not revealing his move, because he/she found out that will lose after inspecting opponent's move). 

`RockPaperScissors` Demo smart contract provides disputing methods to use on-chain with `forceProgressTx`, such as [`player1_dispute_no_reveal`](https://github.com/aeternity/state-channel-demo/blob/develop/contract/contracts/RockPaperScissors.aes#L96) which can be used in cases where the first player did not reveal his move.

In that case, the second player can raise an on-chain dispute utilizing transaction force progress mechanism [`forceProgressTx`](https://github.com/aeternity/protocol/blob/master/channels/ON-CHAIN.md#forcing-progress). 

With a force progress transaction the contract state is broadcast on-chain where game move is confirmed with on-chain computation.




# Helpful Links
- **[State Channel Demo Page](https://statechannel.aepps.com)**
- **[State Channel Demo Tutorial](TUTORIAL.md)**
- [On-Chain channel transactions](https://github.com/aeternity/protocol/blob/master/channels/ON-CHAIN.md)
- [Off-Chain channel transactions](https://github.com/aeternity/protocol/blob/master/channels/OFF-CHAIN.md)
- [Channels API usage](https://github.com/aeternity/protocol/blob/master/node/api/channels_api_usage.md)
- [Channel WS API](https://github.com/aeternity/protocol/blob/master/node/api/channel_ws_api.md)
- [Node level channel examples](https://github.com/aeternity/protocol/tree/master/node/api/examples/channels)
- [Aeternity Node API](https://api-docs.aeternity.io/) 
- [Aeternity SDK](https://github.com/aeternity/aepp-sdk-js)
- [Run an Aeternity Node with Docker](https://docs.aeternity.io/en/stable/docker/)
- **[Back to repo](https://github.com/aeternity/state-channel-demo)**
