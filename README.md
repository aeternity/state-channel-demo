# State Channel Demo

## How to run

```bash
cd vuejs && npm install
cd ../nodejs && npm install
cd .. && docker-compose --env-file .env.dev up
```

## Services

| name             | port |
| ---------------- | ---- |
| frontend - vuejs | 8000 |
| backend - nodejs | 3000 |
| Aeternity node   | 3013 |
| Sophia Compiler  | 3080 |
| Websocket server | 3014 |
