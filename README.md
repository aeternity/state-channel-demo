# State Channel Demo

## Installation

```bash
cd contract && npm install
cd ../client && npm install
cd ../server && npm install
```

## How to run (Local Node - not on an Aeternity Network)
### Terminal 1
```bash
docker-compose up
```  

### Terminal 2
```bash
cd server && npm run dev
```

### Terminal 3
```bash
cd client && npm run dev
```

## How to run (Testnet)
### Terminal 1
```bash
cd server && npm run dev:testnet
```  

### Terminal 2
```bash
cd client && npm run dev:testnet
```

## Services

| name             | port |
| ---------------- | ---- |
| frontend | 8000 |
| backend - nodejs | 3000 |
| Aeternity node   | 3013 |
| Sophia Compiler  | 3080 |
| Websocket server | 3014 |
