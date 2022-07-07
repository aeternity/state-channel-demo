const fs = require( 'fs' )
var exportDir = __dirname + '/../build/'

if ( !fs.existsSync( exportDir ) ) {
    fs.mkdirSync( exportDir )
}

function exportContract ( dir, fileName ) {

    const parent = __dirname + '/../' + dir + '/'

    const contract_content = fs.readFileSync( parent + fileName + ".aes", 'utf-8' )
    const exportFileDest = exportDir + `/${fileName}.aes.js`
    fs.writeFileSync( exportFileDest, `module.exports = \`\n${contract_content}\`;\n`, 'utf-8' )
    console.log( `'${exportFileDest}' written` )
}

exportContract( 'contracts', 'RockPaperScissors' )
