import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import { Channel, generateKeyPair, MemoryAccount } from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import BigNumber from 'bignumber.js';
import { setTimeout } from 'timers/promises';
import { MUTUAL_CHANNEL_CONFIGURATION } from './bot.constants';
import logger from '../../logger';
import ContractService from '../contract/contract.service';
import { FAUCET_PUBLIC_ADDRESS, sdk } from '../sdk';
import { fundAccount } from '../sdk/sdk.service';
import { CONTRACT_CONFIGURATION, Methods } from '../contract';
import { Update } from './bot.instance';

export const channelPool = new Map<
string,
{
  instance: Channel;
  contract?: ContractInstance;
  participants: {
    responderId: EncodedData<'ak'>;
    initiatorId: EncodedData<'ak'>;
  };
}
>();

export async function addChannel(
  channel: Channel,
  configuration: ChannelOptions,
  contractPromise?: Promise<ContractInstance>,
) {
  const contract = contractPromise != null && (await contractPromise);
  channelPool.set(configuration.initiatorId, {
    instance: channel,
    contract,
    participants: {
      responderId: configuration.responderId,
      initiatorId: configuration.initiatorId,
    },
  });
  logger.info(
    `Added to pool channel with bot ID: ${configuration.initiatorId}`,
  );
}

export function removeChannel(botId: EncodedData<'ak'>) {
  channelPool.delete(botId);
  logger.info(`Removed from pool channel with bot ID: ${botId}`);
}

export async function decodeCallData(
  calldata: EncodedData<'cb'>,
  bytecode: string,
) {
  return sdk.compilerApi.decodeCalldataBytecode({
    calldata,
    bytecode,
  });
}

export async function pollForRound(desiredRound: number, channel: Channel) {
  let currentRound = channel.round();
  while (currentRound < desiredRound) {
    await setTimeout(1);
    currentRound = channel.round();
  }
}

export async function handleChannelClose(onAccount: EncodedData<'ak'>) {
  try {
    await sdk.transferFunds(1, FAUCET_PUBLIC_ADDRESS, {
      onAccount,
    });
    logger.info(`${onAccount} has returned funds to faucet`);
  } catch (e) {
    logger.error({ e }, 'failed to return funds to faucet');
  }
  removeChannel(onAccount);
  sdk.removeAccount(onAccount);
}

export async function handlePlayerCall(
  update: Update,
  config: {
    channel: Channel;
    contract: ContractInstance;
    onAccount: EncodedData<'ak'>;
  },
) {
  // wait for the next round where the player's move is sealed
  await pollForRound(config.channel.round() + 1, config.channel);

  const data = await decodeCallData(update.call_data, config.contract.bytecode);
  if (data.function === Methods.provide_hash) {
    await config.channel.callContract(
      {
        amount: MUTUAL_CHANNEL_CONFIGURATION.gameStake,
        contract: update.contract_id,
        abiVersion: CONTRACT_CONFIGURATION.abiVersion,
        callData: ContractService.getRandomMoveCallData(config.contract),
      },
      async (tx: EncodedData<'tx'>) => sdk.signTransaction(tx, {
        onAccount: config.onAccount,
      }),
    );
  }
}

export async function registerEvents(
  channel: Channel,
  configuration: ChannelOptions,
) {
  channel.on('statusChanged', (status) => {
    if (status === 'closed' || status === 'died') {
      void handleChannelClose(configuration.initiatorId);
    }

    if (status === 'open') {
      if (!channelPool.has(configuration.initiatorId)) {
        const contractPromise = ContractService.deployContract(
          configuration.initiatorId,
          channel,
          {
            player0: configuration.responderId,
            player1: configuration.initiatorId,
            reactionTime: 3000,
          },
        );
        void addChannel(channel, configuration, contractPromise);
      }
    }
  });
}

export async function generateGameSession(
  playerAddress: EncodedData<'ak'>,
  playerNodeHost: string,
  playerNodePort: number,
) {
  const botKeyPair = generateKeyPair();
  await sdk.addAccount(new MemoryAccount({ keypair: botKeyPair }), {
    select: true,
  });
  const bot = sdk;

  const initiatorId = await bot.address();
  const responderId = playerAddress;

  await fundAccount(initiatorId);
  await fundAccount(responderId);

  const channelConfig: ChannelOptions & {
    gameStake: BigNumber;
  } = {
    ...MUTUAL_CHANNEL_CONFIGURATION,
    initiatorId,
    port: playerNodePort,
    host: playerNodeHost,
    responderId,
    role: 'initiator',
    // @ts-ignore
    sign: (
      _tag: string,
      tx: EncodedData<'tx'>,
      options: {
        updates: Update[];
      },
    ) => {
      if (options?.updates[0]?.op === 'OffChainCallContract') {
        const channel = channelPool.get(initiatorId);
        const { contract } = channel;
        void handlePlayerCall(options.updates[0], {
          onAccount: initiatorId,
          channel: channel.instance,
          contract,
        });
      }
      return bot.signTransaction(tx, {
        onAccount: initiatorId,
      });
    },
  };

  const channel = await Channel.initialize(channelConfig);

  await registerEvents(channel, channelConfig);

  const { role, sign, ...responderConfig } = channelConfig;
  return responderConfig;
}
