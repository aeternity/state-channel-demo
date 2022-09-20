import express from 'express';
import cors from 'cors';
import { route } from './route';

export const app = express();

const corsOptions = process.env.NODE_ENV === 'production'
  ? {
    origin: [
      /\.aeternity\.com\/?$/,
      /\.aepps\.com\/?$/,
      /.*\.aepps\.com\/rock-paper-scissors\/?$/,
    ],
  }
  : null;

app.use(cors(corsOptions));
app.use(express.json());
app.use('/', route);
