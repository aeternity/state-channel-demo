const { assert } = require( 'chai' )
const { utils } = require( '@aeternity/aeproject' )
const SDK = require( '@aeternity/aepp-sdk' )

const EXAMPLE_CONTRACT_SOURCE = './contracts/RockPaperScissors.aes'

let aeSdk
let contract

// UTILITIES
const p0 = 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk'
const p1 = 'ak_tWZrf8ehmY7CyB1JAoBmWJEeThwWnDpU4NadUdzxVSbzDgKjP'
const p2 = "ak_FHZrEbRmanKUe9ECPXVNTLLpRP2SeQCLCT6Vnvs9JuVu78J7V"
const onAccount = ( p ) => ( {
    onAccount: aeSdk.accounts[p],
} )

const cttoak = ( value ) => value.replace( "ct_", "ak_" )
const getAK = contract => cttoak( contract.deployInfo.address )

const withPlayer = ( player ) => ( opts ) => ( {
    ...( opts || {} ),
    ...onAccount( player )
} )
const withP0 = withPlayer( p0 )
const withP1 = withPlayer( p1 )
const withP2 = withPlayer( p2 )

const withFee = async( f ) => {
    const {
        result: { gasPrice, gasUsed },
        txData:{ tx: { fee },  }
    } = await f()
    return gasPrice * BigInt( gasUsed ) + fee
}

const initContract = async ( opts = {} ) => {
    aeSdk = await utils.getSdk()

    // a filesystem object must be passed to the compiler if the contract uses custom includes
    const fileSystem = utils.getFilesystem( EXAMPLE_CONTRACT_SOURCE )

    // get content of contract
    const source = utils.getContractContent( EXAMPLE_CONTRACT_SOURCE )

    // initialize the contract instance
    contract = await aeSdk.getContractInstance( { source, fileSystem } )
    await contract.deploy(
        [ opts.p0 || p0, opts.p1 || p1, opts.reactionTime || 10, opts.debugTimestamp ], {
            amount: opts.amount || 0,
            ...( opts.onAccount ? { onAccount: opts.onAccount } : {} ),
        }
    )

    // create a snapshot of the blockchain state
    await utils.createSnapshot( aeSdk )
}

const failsWith = async ( f, msg ) => {
    try {
        await f()
    } catch ( err ) {
        assert.include( err.message, msg )
        return
    }
    assert.fail()
}
const createHash = ( move, key ) => SDK.sha256hash( move + key )
// after each test roll back to initial state
afterEach( async () => {
    await utils.rollbackSnapshot( aeSdk )
} )
let move
let key
let hash
const mkh = ( m, k ) => {
    [ move, key, hash ] = [ m, k, createHash( k, m ) ]
}
const dummyHash = createHash( "a", "eternity" )
const amount = 10
const giveContractExtraMoney = async( _extraMoney ) => {
    const extraMoney = _extraMoney || 20000n
    const contractAddress = getAK( contract )
    await aeSdk.spend( extraMoney, contractAddress, withP2() ) // we pay from p2
    return extraMoney
}
describe( 'GameContract', () => {

    describe( "deployment", () => {
        it( 'deploys successfully', async () => {
            await initContract( { p0, p1 } )
            assert.isNotNull( contract )
        } )
        it( 'fails because of same player', async () => {
            try {
                await initContract( { p0, p1: p0 } )
            } catch ( err ) {
                assert.include( err.message, "use_different_address" )
                return
            }
            assert.fail( "it should have failed" )
        } )
        //TODO: this doesn't fails !
        it.skip( 'fails because of amount', async () => {
            try {
                await initContract( withP0( { p0, p1, amount: 10 } ) )
            } catch ( err ) {
                assert.include( err.message, "use_different_address" )
                return
            }
            assert.fail( "it should have failed" )
        } )
    } )
    describe( "normal game", () => {
        before( initContract )

        describe( "provide_hash", () => {

            it( 'fails because of no stake', async () => {
                await failsWith(
                    () => contract.methods.provide_hash( dummyHash, withP0() ),
                    "no_stake"
                )
            } )
            it( 'fails because not player0', async () => {
                await failsWith(
                    () => contract.methods.provide_hash( dummyHash, withP1( { amount: 10 } ) ),
                    "not_player0"
                )
            } )
            it( 'succeeds with amount=10', async () => {
                const amount =  10
                const ret = await contract.methods.provide_hash( dummyHash, withP0( { amount } ) )
                assert.equal( ret.decodedEvents[0].name, 'Player0ProvidedHash' )
                assert.deepEqual( ret.decodedEvents[0].args[0], new Uint8Array( dummyHash ) )
                assert.deepEqual( ret.decodedEvents[0].args[1], BigInt( amount ) )
            } )
            it( 'fails to provide_hash twice', async () => {
                const amount =  10
                await contract.methods.provide_hash( dummyHash, withP0( { amount } ) )
                await failsWith(
                    () => contract.methods.provide_hash( dummyHash, withP0( { amount } ) ),
                    'already_has_hash'
                )
            } )
        } )

        describe( "player1_move", () => {
            it( 'fails because not player1', async () => {
                await failsWith(
                    () => contract.methods.player1_move( "rock", withP0() ),
                    "not_player1"
                )
            } )
            it( 'fails because no_hash', async () => {
                await failsWith(
                    () => contract.methods.player1_move( "rock", withP1() ),
                    "no_hash"
                )
            } )
            describe( "after player1_move", () => {
                //let player0 to add hash
                beforeEach( async () => {
                    await contract.methods.provide_hash( dummyHash, withP0( { amount } ) )
                } )
                it( 'fails with invalid_move', async () => {
                    await failsWith(
                        () => contract.methods.player1_move( "no-move", withP1() ),
                        "invalid_move"
                    )
                } )
                it( 'fails because no stake', async () => {
                    await failsWith(
                        () => contract.methods.player1_move( "rock", withP1() ),
                        "wrong_stake"
                    )
                } )
                it( 'fails because provided stake is smaller', async () => {
                    await failsWith(
                        () => contract.methods.player1_move( "rock", withP1( { amount: amount - 1 } ) ),
                        "wrong_stake"
                    )
                } )
                it( 'fails because provided stake is bigger', async () => {
                    await failsWith(
                        () => contract.methods.player1_move( "rock", withP1( { amount: amount + 1 } ) ),
                        "wrong_stake"
                    )
                } )
                it( 'succeeds with amount=10 and move=rock', async () => {
                    const ret = await contract.methods.player1_move( "rock", withP1( { amount } ) )
                    assert.equal( ret.decodedEvents[0].name, 'Player1Moved' )
                    assert.deepEqual( ret.decodedEvents[0].args[0], 'rock' )
                    assert.deepEqual( ret.decodedEvents[0].args[1], BigInt( amount ) )
                } )
                it( 'succeeds with amount=10 and move=paper', async () => {
                    const ret = await contract.methods.player1_move( "paper", withP1( { amount } ) )
                    assert.equal( ret.decodedEvents[0].name, 'Player1Moved' )
                    assert.deepEqual( ret.decodedEvents[0].args[0], 'paper' )
                    assert.deepEqual( ret.decodedEvents[0].args[1], BigInt( amount ) )
                } )
                it( 'succeeds with amount=10 and move=scissors', async () => {
                    const ret = await contract.methods.player1_move( "scissors", withP1( { amount } ) )
                    assert.equal( ret.decodedEvents[0].name, 'Player1Moved' )
                    assert.deepEqual( ret.decodedEvents[0].args[0], 'scissors' )
                    assert.deepEqual( ret.decodedEvents[0].args[1], BigInt( amount ) )
                } )
                it( 'fails to call player1_move twice', async () => {
                    const amount =  10
                    await contract.methods.player1_move( "scissors", withP1( { amount } ) )
                    await failsWith(
                        () => contract.methods.player1_move( "scissors", withP1( { amount } ) ),
                        'there_is_a_move_already'
                    )
                } )
            } )
        } )
        describe( "reveal", () => {
            it( 'fails because not player0', async () => {
                await failsWith(
                    () => contract.methods.reveal( "", "", withP1() ),
                    "not_player0"
                )
            } )
            it( 'calling before hash will fail', async () => {
                await failsWith(
                    () => contract.methods.reveal( "", "", withP0() ),
                    "there_is_no_move"
                )
            } )
            it( 'calling before p1 making a move will fail', async () => {
                await contract.methods.provide_hash( dummyHash, withP0( { amount } ) )
                //await contract.methods.player1_move( "rock", withP1( { amount } ) )
                await failsWith(
                    () => contract.methods.reveal( "", "", withP0() ),
                    "there_is_no_move"
                )
            } )
            it( 'fails because of invalid move', async () => {
                mkh( 'rock', "the-key" )
                await contract.methods.provide_hash( hash, withP0( { amount } ) )
                await contract.methods.player1_move( move, withP1( { amount } ) )
                await failsWith(
                    () => contract.methods.reveal( key, "invalid-move", withP0() ),
                    "invalid_move"
                )
            } )
            it( 'fails because of wrong move', async () => {
                mkh( 'rock', "the-key" )
                await contract.methods.provide_hash( hash, withP0( { amount } ) )
                await contract.methods.player1_move( move, withP1( { amount } ) )
                await failsWith(
                    () => contract.methods.reveal( key, "scissors", withP0() ),
                    "invalid_key_and_answer"
                )
            } )
            it( 'fails because of wrong key', async () => {
                mkh( 'rock', "the-key" )
                await contract.methods.provide_hash( hash, withP0( { amount } ) )
                await contract.methods.player1_move( move, withP1( { amount } ) )
                await failsWith(
                    () => contract.methods.reveal( "wrong-key", move, withP0() ),
                    "invalid_key_and_answer"
                )
            } )
            it( 'succeeds to reveal the move with a Draw', async () => {
                mkh( 'rock', "the-key" )
                const p0OriginalMoveBalance = BigInt ( await aeSdk.getBalance( p0 ) )
                const p1OriginalMoveBalance = BigInt ( await aeSdk.getBalance( p1 ) )
                const p0_fee1 = await withFee( () => contract.methods.provide_hash( hash, withP0( { amount } ) ) )
                const p1_fee = await withFee( () => contract.methods.player1_move( move, withP1( { amount } ) ) )
                const ret = await contract.methods.reveal( key, move, withP0() )
                const p0_fee2 = await withFee( () => ret )

                assert.equal( ret.decodedEvents[1].name, 'Player0Revealed' )
                assert.deepEqual( ret.decodedEvents[1].args[0], move )

                assert.equal( ret.decodedEvents[0].name, 'Draw' )
                assert.deepEqual( ret.decodedEvents[0].args[0], BigInt( amount ) )
                assert.deepEqual( ret.decodedEvents[0].args[1], BigInt( amount ) )
                assert.deepEqual( ret.decodedEvents[0].args[2], p0 + "|" + p1 )

                const p0ActualBalance = BigInt( await aeSdk.getBalance( p0 ) )
                assert.equal(
                    p0OriginalMoveBalance - p0_fee1 - p0_fee2,
                    p0ActualBalance,
                    "all stake should be refund"
                )

                const p1ActualBalance = BigInt( await aeSdk.getBalance( p1 ) )
                assert.equal(
                    p1ActualBalance,
                    p1OriginalMoveBalance - p1_fee,
                    "all stake should be retrieved"
                )
            } )

            it( 'succeeds to reveal the move with a Player0Won', async () => {
                mkh( 'rock', "the-key" )
                const p0OriginalMoveBalance = BigInt ( await aeSdk.getBalance( p0 ) )
                const fee1 = await withFee( () => contract.methods.provide_hash( hash, withP0( { amount } ) ) )
                await contract.methods.player1_move( "scissors", withP1( { amount } ) )
                const ret = await contract.methods.reveal( key, move, withP0() )
                const fee2 = await withFee( () => ret )

                assert.equal( ret.decodedEvents[1].name, 'Player0Revealed' )
                assert.deepEqual( ret.decodedEvents[1].args[0], move )

                assert.equal( ret.decodedEvents[0].name, 'Player0Won' )
                assert.deepEqual( ret.decodedEvents[0].args[0], p0 )
                assert.deepEqual( ret.decodedEvents[0].args[1], BigInt( amount * 2 ) )

                const p0ActualBalance = BigInt( await aeSdk.getBalance( p0 ) )
                assert.equal(
                    p0ActualBalance,
                    p0OriginalMoveBalance + BigInt( amount ) - fee1 - fee2,
                    "p0 should have the p1's stake"
                )
            } )

            it( 'succeeds to reveal the move with a Player1Won', async () => {
                mkh( 'rock', "the-key" )
                const p1OriginalMoveBalance = BigInt ( await aeSdk.getBalance( p1 ) )

                await contract.methods.provide_hash( hash, withP0( { amount } ) )
                const fee = await withFee( () => contract.methods.player1_move( "paper", withP1( { amount } ) ) )
                const ret = await contract.methods.reveal( key, move, withP0() )

                assert.equal( ret.decodedEvents[1].name, 'Player0Revealed' )
                assert.deepEqual( ret.decodedEvents[1].args[0], move )

                assert.equal( ret.decodedEvents[0].name, 'Player1Won' )
                assert.deepEqual( ret.decodedEvents[0].args[0], p1 )
                assert.deepEqual( ret.decodedEvents[0].args[1], BigInt( amount * 2 ) )

                const p1ActualBalance = BigInt( await aeSdk.getBalance( p1 ) )
                assert.equal(
                    p1ActualBalance,
                    p1OriginalMoveBalance + BigInt( amount  ) - fee,
                )
            } )
            it( 'p0 gets extra money if contract has balance > 0 ', async () => {
                const extraMoney = await giveContractExtraMoney()

                const p0OriginalMoveBalance = BigInt ( await aeSdk.getBalance( p0 ) )

                mkh( 'rock', "the-key" )
                const p0_fee1 = await withFee( () => contract.methods.provide_hash( hash, withP0( { amount } ) ) )
                await contract.methods.player1_move( 'scissors', withP1( { amount } ) )
                const ret = await contract.methods.reveal( key, move, withP0() )
                const p0_fee2 = await withFee( () => ret )

                assert.equal( ret.decodedEvents[1].name, 'Player0Revealed' )
                assert.deepEqual( ret.decodedEvents[1].args[0], move )

                assert.equal( ret.decodedEvents[0].name, 'Player0Won' )
                assert.deepEqual( ret.decodedEvents[0].args[0], p0 )
                assert.deepEqual( ret.decodedEvents[0].args[1], BigInt( amount * 2 ) + extraMoney )

                const p0ActualBalance = BigInt( await aeSdk.getBalance( p0 ) )
                assert.equal(
                    p0ActualBalance,
                    p0OriginalMoveBalance + extraMoney + BigInt( amount ) - p0_fee1 - p0_fee2,
                    "p0 should have the p1's stake and extraMoney"
                )
            } )

            it( 'p1 gets extra money if contract has balance > 0 ', async () => {
                const extraMoney = await giveContractExtraMoney()

                const p1OriginalMoveBalance = BigInt ( await aeSdk.getBalance( p1 ) )

                mkh( 'paper', "the-key" )
                await contract.methods.provide_hash( hash, withP0( { amount } ) )
                const p1_fee = await withFee( () => contract.methods.player1_move( "scissors", withP1( { amount } ) ) )
                const ret = await contract.methods.reveal( key, move, withP0() )

                assert.equal( ret.decodedEvents[1].name, 'Player0Revealed' )
                assert.deepEqual( ret.decodedEvents[1].args[0], move )

                assert.equal( ret.decodedEvents[0].name, 'Player1Won' )
                assert.deepEqual( ret.decodedEvents[0].args[0], p1 )
                assert.deepEqual( ret.decodedEvents[0].args[1], BigInt( amount * 2 ) + extraMoney )

                const p1ActualBalance = BigInt( await aeSdk.getBalance( p1 ) )
                assert.equal(
                    p1ActualBalance,
                    p1OriginalMoveBalance + extraMoney + BigInt( amount ) - p1_fee,
                    "p1 should have the p0's stake and extraMoney"
                )
            } )
            it( 'p0 and p1 get their money back and half of extraMoney', async () => {
                mkh( 'rock', "the-key" )

                const extraMoney = 20001n
                const contractAddress = getAK( contract )
                await aeSdk.spend( extraMoney, contractAddress, withP2() ) // we pay from p2

                const p0OriginalMoveBalance = BigInt ( await aeSdk.getBalance( p0 ) )
                const p1OriginalMoveBalance = BigInt ( await aeSdk.getBalance( p1 ) )

                const p0_fee1 = await withFee( () => contract.methods.provide_hash( hash, withP0( { amount } ) ) )
                const p1_fee = await withFee( () => contract.methods.player1_move( move, withP1( { amount } ) ) )
                const ret = await contract.methods.reveal( key, move, withP0() )
                const p0_fee2 = await withFee( () => ret )

                assert.equal( ret.decodedEvents[1].name, 'Player0Revealed' )
                assert.deepEqual( ret.decodedEvents[1].args[0], move )

                assert.equal( ret.decodedEvents[0].name, 'Draw' )

                // take a look on how player1 gets with 1 more because of integer division
                // of extraMoney
                assert.deepEqual( ret.decodedEvents[0].args[0], BigInt( amount ) + ( extraMoney / 2n ) )
                assert.deepEqual( ret.decodedEvents[0].args[1], BigInt( amount ) + ( extraMoney - ( extraMoney / 2n ) ) )
                assert.deepEqual( ret.decodedEvents[0].args[2], p0 + "|" + p1 )

                const p0ActualBalance = BigInt( await aeSdk.getBalance( p0 ) )
                assert.equal(
                    p0OriginalMoveBalance - p0_fee1 - p0_fee2 + ( extraMoney / 2n ),
                    p0ActualBalance,
                    "all stake should be refund"
                )

                const p1ActualBalance = BigInt( await aeSdk.getBalance( p1 ) )
                assert.equal(
                    p1ActualBalance,
                    p1OriginalMoveBalance - p1_fee + ( extraMoney - ( extraMoney / 2n ) ),
                    "all stake should be retrieved"
                )
            } )
        } )
        describe( "all combinations", () => {
            [
                //rock
                [ 'rock', 'rock', 0 ],
                [ 'rock', 'scissors', -1 ],
                [ 'rock', 'paper', 1 ],
                //paper
                [ 'paper', 'paper', 0 ],
                [ 'paper', 'rock',  -1 ],
                [ 'paper', 'scissors', 1 ],
                //scissors
                [ 'scissors', 'scissors', 0 ],
                [ 'scissors', 'paper', -1 ],
                [ 'scissors', 'rock', 1 ],
            ].map( ( [ p0_move, p1_move, expect ] ) => {
                const p0ShouldWin = expect < 0
                const p1ShouldWin = expect > 0
                const prefix = p0ShouldWin
                    ? 'p0 should win'
                    : p1ShouldWin
                        ? 'p1 should win'
                        : 'should be a draw'

                const message = `${prefix} when ` +
                ( p0_move == p1_move
                    ? `both players are choosing ${p0_move}`
                    : `player zero is choosing ${p0_move} and player one is choosing ${p1_move}` )

                it( message, async () => {
                    mkh( p0_move, "the-key" )
                    await contract.methods.provide_hash( hash, withP0( { amount } ) )
                    await contract.methods.player1_move( p1_move, withP1( { amount } ) )
                    const ret = await contract.methods.reveal( key, move, withP0() )

                    if ( p0ShouldWin ) {
                        assert.equal( ret.decodedEvents[0].name, 'Player0Won' )
                        assert.deepEqual( ret.decodedEvents[0].args[0], p0 )
                    } else if ( p1ShouldWin ) {
                        assert.equal( ret.decodedEvents[0].name, 'Player1Won' )
                        assert.deepEqual( ret.decodedEvents[0].args[0], p1 )
                    } else {
                        assert.equal( ret.decodedEvents[0].name, 'Draw' )
                    }
                } )
            } )

        } )
    } )
    describe( "disputes", () => {
        it( "set_timestamp fails if not in debug mode", async () => {
            await initContract()
            await failsWith(
                () => contract.methods.set_timestamp( 10, withP1() ),
                "not_debug_mode"
            )
        } )
        describe( "in debug time mode", () => {
            before( () => initContract( { reactionTime: 10, debugTimestamp: 0 } ) )
            let ts
            const refreshTs = async () => {
                ( { decodedResult: { debug_timestamp: ts } }  = await contract.methods.get_state() )
            }

            it( "set_timestamp fails because of negative value", async () => {
                await failsWith(
                    () => contract.methods.set_timestamp( -1, withP1() ),
                    "not_positive"
                )
            } )
            it( "set_timestamp succeeds with zero timestamp", async () => {
                await contract.methods.set_timestamp( 0, withP1() )
                const { decodedResult: { debug_timestamp } } = await contract.methods.get_state()
                assert.equal( debug_timestamp, 0 )
            } )
            it( "set_timestamp succeeds with positive timestamp", async () => {
                const timestamp = 10
                await contract.methods.set_timestamp( timestamp )
                const { decodedResult: { debug_timestamp } } = await contract.methods.get_state()
                assert.equal( debug_timestamp, timestamp )
            } )

            //------------------------------------------------------------------------------
            //  player 0 dispute
            //------------------------------------------------------------------------------

            it( "p0 dispute fails because not_player0", async () => {
                await failsWith(
                    () => contract.methods.player0_dispute_no_move( withP1() ),
                    'not_player0'
                )
            } )
            it( "p0 dispute fails because player0 didn't move", async () => {
                await failsWith(
                    () => contract.methods.player0_dispute_no_move( withP0() ),
                    'no_hash'
                )
            } )
            it( "p0 dispute fails because player1 didn't move", async () => {
                await contract.methods.provide_hash( dummyHash, withP0( { amount } ) )
                await failsWith(
                    () => contract.methods.player0_dispute_no_move( withP0() ),
                    'not_yet_allowed'
                )
            } )
            it( "p0 dispute fails because we are still in time", async () => {
                await contract.methods.provide_hash( dummyHash, withP0( { amount } ) ); await refreshTs()
                await contract.methods.set_timestamp( 9 ); await refreshTs()
                assert.equal( ts, 9 )
                await failsWith(
                    () => contract.methods.player0_dispute_no_move( withP0() ),
                    'not_yet_allowed'
                )
            } )
            it( "p0 dispute fails because p1 moved already", async () => {
                // player make his move at
                await contract.methods.provide_hash( dummyHash, withP0( { amount } ) )
                await contract.methods.player1_move( "rock", withP1( { amount } ) )
                await failsWith(
                    () => contract.methods.player0_dispute_no_move( withP0() ),
                    'there_is_a_move_already'
                )
            } )
            it( "p0 dispute succeeds after the reactionTime reached its limit", async () => {
                const extraMoney = await giveContractExtraMoney()

                const p0OriginalMoveBalance = BigInt ( await aeSdk.getBalance( p0 ) )
                const p0_fee1 = await withFee( () =>
                    contract.methods.provide_hash( dummyHash, withP0( { amount } ) )
                )
                await contract.methods.set_timestamp( 11, withP2() )
                const ret = await contract.methods.player0_dispute_no_move( withP0() )

                assert.equal( ret.decodedEvents[0].name, 'Player0WonDispute' )
                assert.deepEqual( ret.decodedEvents[0].args[0], p0 )
                assert.deepEqual( ret.decodedEvents[0].args[1], extraMoney + BigInt( amount ) )

                const p0_fee2 = await withFee( () => ret )
                const p0ActualBalance = BigInt( await aeSdk.getBalance( p0 ) )

                //gets his money back + extraMoney - the fees
                assert.equal(
                    p0OriginalMoveBalance - p0_fee1 - p0_fee2 + extraMoney,
                    p0ActualBalance,
                    "all stake should be refund"
                )
            } )

            //------------------------------------------------------------------------------
            //  player 1 dispute
            //------------------------------------------------------------------------------
            it( "p1 dispute fails because not_player1", async () => {
                await failsWith(
                    () => contract.methods.player1_dispute_no_reveal( withP0() ),
                    'not_player1'
                )
            } )
            it( "p1 dispute fails because player0 didn't provide has", async () => {
                await failsWith(
                    () => contract.methods.player1_dispute_no_reveal( withP1() ),
                    'there_is_no_move'
                )
            } )
            it( "p1 dispute fails because player1 didn't move", async () => {
                await contract.methods.provide_hash( dummyHash, withP0( { amount } ) )
                await failsWith(
                    () => contract.methods.player1_dispute_no_reveal( withP1() ),
                    'there_is_no_move'
                )
            } )
            it( "p1 dispute fails because we are still in time", async () => {
                await contract.methods.provide_hash( dummyHash, withP0( { amount } ) ); await refreshTs()
                await contract.methods.player1_move( "rock", withP1( { amount } ) )
                await contract.methods.set_timestamp( 9 ); await refreshTs()
                await failsWith(
                    () => contract.methods.player1_dispute_no_reveal( withP1() ),
                    'not_yet_allowed'
                )
            } )
            it( "p1 dispute succeeds after the reactionTime reached its limit", async () => {
                const extraMoney = await giveContractExtraMoney()

                const p1OriginalMoveBalance = BigInt ( await aeSdk.getBalance( p1 ) )
                await contract.methods.provide_hash( dummyHash, withP0( { amount } ) )
                const p1_fee1 = await withFee( () =>  contract.methods.player1_move( "rock", withP1( { amount } ) ) )
                await contract.methods.set_timestamp( 11, withP2() )
                const ret = await contract.methods.player1_dispute_no_reveal( withP1() )

                assert.equal( ret.decodedEvents[0].name, 'Player1WonDispute' )
                assert.deepEqual( ret.decodedEvents[0].args[0], p1 )
                assert.deepEqual( ret.decodedEvents[0].args[1], extraMoney + BigInt( amount * 2 ) )

                const p1_fee2 = await withFee( () => ret )
                const p1ActualBalance = BigInt( await aeSdk.getBalance( p1 ) )

                //gets his money back , the stake of p0 and extraMoney - the fees
                assert.equal(
                    p1OriginalMoveBalance - p1_fee1 - p1_fee2 + extraMoney + BigInt( amount ),
                    p1ActualBalance,
                    "all stake should be refund and extraMoney"
                )
            } )
        } )
    } )
    describe( "multiple rounds", () => {
        before( () => initContract( { reactionTime: 10, debugTimestamp: 0 } ) )

        const hasBeenReset = async (  ) => {
            const {
                decodedResult: { hash, last_move_timestamp, player1_move, stake }
            } = await contract.methods.get_state()

            assert.isUndefined( hash, "hash should be undefined" )
            assert.isUndefined( player1_move, "player1_move should be undefined"  )
            assert.equal( last_move_timestamp, 0, "last_move_timestamp should be zero" )
            assert.equal( stake, 0, "stake should be zero" )
            assert.equal(
                await aeSdk.getBalance( getAK( contract ) ), 0,
                "contract balance should be zero "
            )
        }

        it( 'resets the state after player0 won', async () => {
            await giveContractExtraMoney()
            mkh( 'rock', "the-key" )

            await contract.methods.provide_hash( hash, withP0( { amount } ) )
            await contract.methods.player1_move( "scissors", withP1( { amount } ) )
            await contract.methods.reveal( key, move, withP0() )

            await hasBeenReset()
        } )
        it( 'resets the state after player1 won', async () => {
            await giveContractExtraMoney()
            mkh( 'rock', "the-key" )

            await contract.methods.provide_hash( hash, withP0( { amount } ) )
            await contract.methods.player1_move( "paper", withP1( { amount } ) )
            await contract.methods.reveal( key, move, withP0() )

            await hasBeenReset()
        } )
        it( 'resets the state after a draw', async () => {
            await giveContractExtraMoney()
            mkh( 'rock', "the-key" )

            await contract.methods.provide_hash( hash, withP0( { amount } ) )
            await contract.methods.player1_move( "rock", withP1( { amount } ) )
            await contract.methods.reveal( key, move, withP0() )

            await hasBeenReset()
        } )
        it( 'resets the state after p0 dispute', async () => {
            await giveContractExtraMoney()

            await contract.methods.provide_hash( dummyHash, withP0( { amount } ) )
            await contract.methods.set_timestamp( 11, withP2() )
            await contract.methods.player0_dispute_no_move( withP0() )

            await hasBeenReset()
        } )
        it( 'resets the state after p1 dispute', async () => {
            await giveContractExtraMoney()

            await contract.methods.provide_hash( dummyHash, withP0( { amount } ) )
            await contract.methods.player1_move( "rock", withP1( { amount } ) )
            await contract.methods.set_timestamp( 11, withP2() )
            await contract.methods.player1_dispute_no_reveal( withP1() )

            await hasBeenReset()
        } )
    } )
} )
