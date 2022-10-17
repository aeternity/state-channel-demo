# State Channel Demo
A demo use case of Aeternity's state channels. Users can play a thousand+ rounds of rock-paper-scissors games through Aeternity blockchain by deploying a game-rules smart contract into state-channels.

# Table of Contents 
1. [Installation](#installation)
2. [Running Options](#running-options)
3. [Channel Communication between Apps](#channel-communication-between-apps)
4. [Helpful links](#helpful-links)

**[Step by step channel guide](CHANNEL_USAGE.md)**

# Installation 

```bash
cd contract && npm install
cd ../client && npm install
cd ../server && npm install
```


# Running options
## Local Node and not on connected with an Aeternity Network

|Terminal #number |  Explanation  |       Command     |
|:----------:|:-------------:|------|
|#1 | Start node |  `docker-compose up` |
|#2 | Start server |    `cd server && npm run dev`   |
|#3  | Start client | `cd client && npm run dev` |

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
| Aeternity node   | 3013 |
| Sophia Compiler  | 3080 |
| Websocket server | 3014 |



# Channel Communication between Apps

**The server application** can be seen as the game session manager. It is responsible for:
- Funding Phase
  - Accept requests from users (channel `responder`) with their account address, their node's port and their node's host.
  - Generate a new account (bot player - channel `initiator`) for each request
  - Fund both accounts by requesting coins from [faucet app](https://faucet.aepps.com/)
  - Respond to users request with the mutual channel configuration. Read more about the channel configuration [here](https://github.com/aeternity/protocol/blob/master/node/api/channels_api_usage.md#channel-establishing-parameters)
- Channel Initialization Phase
  - When both accounts have enough funds, the server app will run `Channel.Initialize(channelConfig)` which will execute the on-chain transaction `channel_create_tx` and proceed in a listening-for-events state such as channel open confirmation
  - Also, as the initiator, bots are responsible for deploying the contract on channel.
- Game rounds 
  - One channel configuration option is the `sign` function. This function runs whenever any party executes an off-chain transaction which needs to be co-signed by both participants. Therefore whenever the other party makes their move, we can confirm it here and then respond with a next contract call.
- Closing Phase
  - Scenario 1: User wants to close the channel
    - In this happy path, the user calls an on-chain transaction called `channel_close_mutual`. The bot co-signs it and the final channel is posted on-chain. The corresponding balances are returned to their owners and the channel status is finalized in `closed`.
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

# Helpful Links
- [On-Chain channel transactions](https://github.com/aeternity/protocol/blob/master/channels/ON-CHAIN.md)
- [Off-Chain channel transactions](https://github.com/aeternity/protocol/blob/master/channels/OFF-CHAIN.md)
- [Channels API usage](https://github.com/aeternity/protocol/blob/master/node/api/channels_api_usage.md)
- [Channel WS API](https://github.com/aeternity/protocol/blob/master/node/api/channel_ws_api.md)
- [Node level channel examples](https://github.com/aeternity/protocol/tree/master/node/api/examples/channels)
- [Aeternity Node API](https://api-docs.aeternity.io/) 
- [Aeternity SDK](https://github.com/aeternity/aepp-sdk-js)
- [Run an Aeternity Node with Docker](https://docs.aeternity.io/en/stable/docker/)