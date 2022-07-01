module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    sourceType: "module",
    project: ["./tsconfig.json"],
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "airbnb-typescript/base",
    "airbnb-base",
  ],
  ignorePatterns: [".eslintrc.js", "node_modules/*", "dist"],
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".ts", ".mjs"],
      },
    },
  },
  env: {
    jest: true,
  },
  rules: {
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        ts: "never",
      },
    ],
    "import/prefer-default-export": 0,
    "import/no-extraneous-dependencies": [
      "error",
      { devDependencies: ["**/*.test.ts", "**/*.spec.ts"] },
    ],
    "@typescript-eslint/no-shadow": 0,
    "@typescript-eslint/no-explicit-any": 0,
    "@typescript-eslint/no-unsafe-member-access": 0,
    "no-shadow": 0,
    "no-void": 0,
    "no-console": 0,
  },
};
