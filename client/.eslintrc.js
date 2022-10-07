module.exports = {
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  parserOptions: {
    sourceType: 'module',
    allowImportExportEverywhere: true,
    ecmaVersion: 'latest',
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended', 'prettier'],
  rules: {
    'prettier/prettier': ['error', { endOfLine: 'lf' }],
    'linebreak-style': ['error', 'unix'],
  },
};
