process.env.FAUCET_PUBLIC_KEY = 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR';
process.env.FAUCET_SECRET_KEY = 'bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b';
process.env.NETWORK_ID = 'ae_devnet';
process.env.COMPILER_URL = 'http://localhost:3080';
process.env.NODE_URL = 'http://localhost:3013';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  maxWorkers: 1,
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
