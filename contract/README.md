
## Description

[RockPaperScissors](https://github.com/aeternity/state-channel-demo/tree/develop/contract)

## Installation

```bash
$ npm install
```

## Container
```
# to deploy
npx aeproject env init

# to stop container
npx aeproject env --stop

```

## Running the tests

```bash
# tests
$ npm run test

# tets bailing at first fail
$ npm run test:bail

# debug mode
$ npm run test:debug

```

## Deploy

```bash
# deploy on local node
$ npm run deploy

# TODO: work in progress
# deploy on testnet
$ npm run deploy:testnet

# TODO: work in progress
# deploy on testnet
$ npm run deploy:mainnet
```

## Using it in JS projects

```bash
import * as RockPaperScissors from '@aeternity/rock-paper-scissors'

# or

const RockPaperScissors = require('@aeternity/rock-paper-scissors')

```
