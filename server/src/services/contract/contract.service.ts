import { Channel, sha256hash } from '@aeternity/aepp-sdk';
import { EncodedData } from '@aeternity/aepp-sdk/es/utils/encoder';
import contractSource from '@aeternity/rock-paper-scissors';
import { sdk } from '../sdk';
import { CONTRACT_CONFIGURATION, Moves } from './contract.constants';

export default class ContractService {
  static createHash(move: Moves, key: string) {
    return sha256hash(move + key);
  }

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

    await channel.createContract(
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

    return contract;
  }
}
