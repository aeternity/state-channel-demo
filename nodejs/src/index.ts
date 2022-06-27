import express from 'express';
import cors from 'cors';
import Controller from './controller';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/', Controller);

function start() {
  console.log('Started!');
}

app.listen(process.env.BOT_SERVICE_PORT || 3000, () => {
  void start();
});
