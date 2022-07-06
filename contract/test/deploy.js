const { utils } = require( '@aeternity/aeproject' )

const EXAMPLE_CONTRACT_SOURCE = './contracts/RockPaperScissors.aes'

const deploy = async () => {
    const aeSdk = await utils.getSdk()

  // a filesystem object must be passed to the compiler if the contract uses custom includes
    const fileSystem = utils.getFilesystem( EXAMPLE_CONTRACT_SOURCE )

  // get content of contract
    const source = utils.getContractContent( EXAMPLE_CONTRACT_SOURCE )

  // initialize the contract instance
    const contract = await aeSdk.getContractInstance( { source, fileSystem } )
    await contract.deploy(
        [ 
            'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk',
            'ak_tWZrf8ehmY7CyB1JAoBmWJEeThwWnDpU4NadUdzxVSbzDgKjP',
            1,
        ],
    )
    console.log( `contract deployed with address: ${contract.deployInfo.address}` )
}

deploy()
