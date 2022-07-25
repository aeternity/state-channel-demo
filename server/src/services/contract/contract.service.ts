import { Channel } from '@aeternity/aepp-sdk';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import contractSource from '@aeternity/rock-paper-scissors';
import logger from '../../logger';
import { sdk } from '../sdk';
import { CONTRACT_CONFIGURATION } from './contract.constants';

export default class ContractService {
  static async getCompiledContract() {
    const contract = await sdk.getContractInstance({ source: contractSource });
    await contract.compile();
    return contract;
  }

  static async deployContract(
    deployerAddress: EncodedData<'ak'>,
    channel: Channel,
    config: {
      player0: EncodedData<'ak'>;
      player1: EncodedData<'ak'>;
      reactionTime: number;
      debugTimestamp?: number;
    },
  ) {
    sdk.selectAccount(deployerAddress);
    const contract = await this.getCompiledContract();

    const res = await channel.createContract(
      {
        ...CONTRACT_CONFIGURATION,
        code: contract.bytecode,
        callData: contract.calldata.encode('RockPaperScissors', 'init', [
          ...Object.values(config),
        ]) as string,
      },
      async (tx) => {
        // select again since this may occur after another bot is selected
        sdk.selectAccount(deployerAddress);
        return sdk.signTransaction(tx);
      },
    );

    logger.info(`${deployerAddress} deployed contract: ${res.address}`);

    return contract;
  }
}
