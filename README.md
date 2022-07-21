# State Channel Demo

## How to run (Local Node - not on an Aeternity Network)
### Terminal 1
```bash
cd contract && npm install
cd client && npm install && npm run dev
```  

### Terminal 2
```bash
cd server && npm install && npm run dev
```

### Terminal 3
```bash
docker-compose up
```

## How to run (Testnet)
### Terminal 1
```bash
cd contract && npm install
cd client && npm install && npm run dev:testnet
```  

### Terminal 2
```bash
cd server && npm install && npm run dev:testnet
```

## Services

| name             | port |
| ---------------- | ---- |
| frontend - vuejs | 8000 |
| backend - nodejs | 3000 |
| Aeternity node   | 3013 |
| Sophia Compiler  | 3080 |
| Websocket server | 3014 |
