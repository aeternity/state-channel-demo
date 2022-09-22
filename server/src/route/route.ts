import express from 'express';
import logger from '../logger';
import botService from '../services/bot';
import { ResponderBaseChannelConfig } from './route.interface';

export const route = express.Router();

route.get('/', (_req, res) => {
  res.send(
    'Hello Aeternal World! This is the backend service of the state channel demo.',
  );
});

route.get('/status', (_req, res) => {
  res.json(botService.getServiceStatus());
});

route.post('/open', (async (req, res) => {
  const reqBody = req.body as Partial<ResponderBaseChannelConfig>;
  const { address, port, host } = reqBody;
  try {
    if (!address) {
      return res.status(400).json({ error: 'address is required.' });
    }
    if (!port) {
      return res.status(400).json({ error: 'port is required.' });
    }
    if (!host) {
      return res.status(400).json({ error: 'host is required.' });
    }

    const config = await botService.generateGameSession(address, host, port);
    logger.info({ config, reqBody }, 'channel initializated');
    return res.send(config);
  } catch (e) {
    logger.error({ e, reqBody }, 'failed to open channel');
    return res.status(500).json({ error: (e as Error).message });
  }
}) as express.RequestHandler);

export default route;
