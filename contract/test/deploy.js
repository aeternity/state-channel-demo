const { utils } = require( '@aeternity/aeproject' )
const  { CompilerHttp, AeSdk, Node, generateKeyPair, MemoryAccount } = require ( '@aeternity/aepp-sdk' )
const axios = require( 'axios' )

const EXAMPLE_CONTRACT_SOURCE = './contracts/RockPaperScissors.aes'
const COMPILER_URL = 'https://v7.compiler.aepps.com/'
const NODE_URL = 'https://testnet.aeternity.io'

const fundThroughFaucet = async ( accountAddress ) => {
    const FAUCET_URL = 'https://faucet.aepps.com'
    await axios.post( `${FAUCET_URL}/account/${accountAddress}`, {} )
}

let aeSdk

const getSdk = async () => {
    if ( !aeSdk ) {
        aeSdk = new AeSdk( {
            onCompiler : new CompilerHttp( COMPILER_URL ),
            nodes      : [
                {
                    name     : 'testnet',
                    instance : new Node( NODE_URL ),
                },
            ],
        } )
        const keypair = generateKeyPair()
        aeSdk.addAccount( new MemoryAccount( keypair.secretKey ), { select: true } )
        await fundThroughFaucet( keypair.publicKey )
    }   

    return aeSdk
}

const deploy = async () => {
    const aeSdk = await getSdk()

  // a filesystem object must be passed to the compiler if the contract uses custom includes
    const fileSystem = utils.getFilesystem( EXAMPLE_CONTRACT_SOURCE )

  // get content of contract
    const sourceCode = utils.getContractContent( EXAMPLE_CONTRACT_SOURCE )

  // initialize the contract instance
    const contract = await aeSdk.initializeContract( { sourceCode, fileSystem } )

    await contract.$deploy(
        [ 
            'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk',
            'ak_tWZrf8ehmY7CyB1JAoBmWJEeThwWnDpU4NadUdzxVSbzDgKjP',
            1,
        ],
    )
    console.log( `contract deployed with address: ${contract.$options.address}` )
}

deploy()
