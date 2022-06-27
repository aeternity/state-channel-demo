import express from 'express';
import cors from 'cors';
import Controller from './controller';

export const app = express();

app.use(cors());
app.use(express.json());
app.use('/', Controller);
