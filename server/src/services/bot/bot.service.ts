import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';
import {
  AeSdk,
  Channel,
  generateKeyPair,
  MemoryAccount,
  unpackTx,
} from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import BigNumber from 'bignumber.js';
import { MUTUAL_CHANNEL_CONFIGURATION } from './bot.constants';
import logger from '../../logger';
import ContractService from '../contract/contract.service';
import { FAUCET_PUBLIC_ADDRESS, sdk } from '../sdk';
import { fundAccount } from '../sdk/sdk.service';

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
  const contract = contractPromise != null && await contractPromise;
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

export async function handleChannelClose(sdk: AeSdk) {
  try {
    await sdk.transferFunds(1, FAUCET_PUBLIC_ADDRESS);
    logger.info(`${sdk.selectedAddress} has returned funds to faucet`);
  } catch (e) {
    logger.error({ e }, 'failed to return funds to faucet');
  }
  const { selectedAddress } = sdk;
  removeChannel(selectedAddress);
  sdk.removeAccount(selectedAddress);
}

export async function registerEvents(
  channel: Channel,
  configuration: ChannelOptions,
) {
  channel.on('statusChanged', (status) => {
    if (status === 'closed' || status === 'died') {
      sdk.selectAccount(configuration.initiatorId);
      void handleChannelClose(sdk);
    }

    if (status === 'open') {
      if (!channelPool.has(configuration.initiatorId)) {
        const contractPromise = ContractService.deployContract(
          configuration.initiatorId,
          channel,
          {
            player0: configuration.initiatorId,
            player1: configuration.responderId,
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
    sign: (_tag: string, tx: EncodedData<'tx'>, options:any) => {
      if (options?.updates[0]?.op === 'OffChainCallContract') {
        console.log(_tag, unpackTx(tx), options);
      }
      bot.selectAccount(botKeyPair.publicKey);
      return bot.signTransaction(tx);
    },
  };

  const channel = await Channel.initialize(channelConfig);

  await registerEvents(channel, channelConfig);

  const { role, sign, ...responderConfig } = channelConfig;
  return responderConfig;
}
