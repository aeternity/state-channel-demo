declare const contract: string
declare module '@aeternity/rock-paper-scissors' {
    export default contract

    export type ContractAddress = `ct_${string}`;
    export type WalletAddress = `ak_${string}`;
    export type CallData = `cb_${string}`; //TODO: are all starting with cb?

    export type ContractMethodResult<T> = Promise<{
      result: {
        callerId: WalletAddress;
        callerNonce: number;
        contractId: ContractAddress;
        gasPrice: number;
        gasUsed: number;
        height: number;
        log: any[];
        returnType: 'ok' | 'revert';
        returnValue: CallData;
      };
      decodedResult: T;
    }>;
    export type PairMethods = {
      token0: () => ContractMethodResult<ContractAddress>;
      token1: () => ContractMethodResult<ContractAddress>;
      totalSupply: () => ContractMethodResult<bigint>;
      reserves: () => ContractMethodResult<{ reserve0: bigint; reserve1: bigint }>;
    };

    type Move = 'rock' | 'paper' | 'scissors'
    type State =  {
       player0 : WalletAddress,
       player1 : WalletAddress,
       hash : Uint8Array | null,
       last_move_timestamp : BigInt,
       player1_move : Move | null,
       stake : BigInt,
       reaction_time : BigInt,
       debug_timestamp : BigInt | null
    }

    type Payable = {
        amount: number
    }

    export type RockPaperScissors = {
        get_state: ( options?: object ) => ContractMethodResult<State>
        provide_hash: <T extends Payable, Buffer extends Uint8Array>( hash: Buffer, options:  T ) => ContractMethodResult<null>
        layer1_move : <T extends Payable>( move: Move, options: T ) => ContractMethodResult<null>
        reveal : ( key: string, move: Move, options?: object ) => ContractMethodResult<WalletAddress | null>
        player1_dispute_no_reveal: ( options?: object ) => ContractMethodResult<null>
        player0_dispute_no_move : ( options?: object ) => ContractMethodResult<null>
        set_timestamp : ( timestamp: BigInt, options?: object ) => ContractMethodResult<null>
    }
}
