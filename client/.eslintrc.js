require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  env: {
    node: true,
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-essential',
    '@vue/typescript/recommended',
    '@vue/eslint-config-typescript',
    'plugin:prettier/recommended',
    'prettier',
  ],
  rules: {
    'prettier/prettier': ['error', { endOfLine: 'lf' }],
    'linebreak-style': ['error', 'unix'],
    'vue/multi-word-component-names': 'off',
  },
};
