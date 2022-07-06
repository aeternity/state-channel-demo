/// <reference types="vitest" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    dedupe: ['vue'],
  },
  test: {
    include: ['./tests/**/*.test.ts'],
    globals: true,
    threads: false,
    environment: 'happy-dom',
    env: {
      VITE_NODE_ENV: 'development',
      VITE_BOT_SERVICE_URL: 'http://localhost:3000',
      VITE_CLIENT_PORT: '8000',
      VITE_NODE_URL: 'http://localhost:3013',
      VITE_COMPILER_URL: 'http://localhost:3080',
      VITE_WS_URL: 'ws://localhost:3014/channel',
      VITE_FAUCET_PUBLIC_ADDRESS:
        'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR',
      VITE_FAUCET_SECRET_KEY:
        'bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b',
      VITE_RESPONDER_HOST: 'localhost',
      VITE_RESPONDER_PORT: '3333',
    },
  },
  server: {
    watch: {
      usePolling: true,
    },
    port: Number(process.env.PORT) || 8000,
  },
  build: {
    target: 'es2020',
  },
});
