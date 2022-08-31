
## Description

[RockPaperScissors](https://github.com/aeternity/state-channel-demo/tree/develop/contract)

## Installation

```bash
$ npm install
```

## Environment
```
# to start containers (node version > 6.6.0 required to avoid devmode rollback crash)
npx aeproject env --nodeVersion v6.6.0 --compilerVersion v6.1.0

# to stop containers
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
