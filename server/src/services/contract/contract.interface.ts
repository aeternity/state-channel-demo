import { type RockPaperScissors } from '@aeternity/rock-paper-scissors';
import { ContractInstance } from '@aeternity/aepp-sdk/es/contract/aci';

export interface RockPaperScissorsContract extends ContractInstance {
  methods: RockPaperScissors;
}
