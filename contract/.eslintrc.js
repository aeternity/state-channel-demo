module.exports = {
    env: {
        browser  : true,
        commonjs : true,
        es2021   : true,
        mocha    : true,
    },
    extends: [
        'eslint:recommended',
    ],
    parser        : '@typescript-eslint/parser',
    parserOptions : {
        ecmaVersion: 'latest',
    },
    plugins: [
        '@typescript-eslint',
        'mocha',
    ],
    rules: {
        'no-console'   : 'off',
        'comma-dangle' : 'off',
        indent         : [ 'warn', 4, {
            SwitchCase     : 1,
            ignoreComments : true,
        } ],

        'object-curly-spacing' : [ 'warn', 'always' ],
        'object-curly-newline' : [ 'warn', { consistent: true, multiline: true } ],
        'key-spacing'          : [ 'warn', {
            align: {
                beforeColon : true,
                afterColon  : true,
                on          : 'colon',
            },
        } ],

        'space-before-blocks'     : [ 'warn' ],
        'keyword-spacing'         : [ 'warn' ],
        'no-multiple-empty-lines' : [ 'warn', { max: 1, maxEOF: 1 } ],
        semi                      : [ 'warn', 'never' ],
        'no-unused-vars'          : [ 'warn', { ignoreRestSiblings: true } ],
        'arrow-spacing'           : [ 'warn', { before: true, after: true } ],
        'comma-spacing'           : [ 'warn', { before: false, after: true } ],
        'space-infix-ops'         : [ 'warn' ],
        'space-in-parens'         : [ 'warn', 'always' ],
        'array-bracket-spacing'   : [ 'warn', 'always' ],
        'prefer-const'            : 'warn',
        'require-await'           : 'error'
    },
    "globals": { 
        "__dirname": true,
    }
}
