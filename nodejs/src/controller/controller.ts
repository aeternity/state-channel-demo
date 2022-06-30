import express from 'express';
import logger from '../logger';
import { generateGameSession } from '../services/bot/bot.service';
import { ResponderBaseChannelConfig } from './controller.interface';

export const router = express.Router();

router.post('/open', (async (req, res) => {
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

    const config = await generateGameSession(address, host, port);
    logger.info({ config, reqBody }, 'channel initializated');
    return res.send(config);
  } catch (e) {
    logger.error({ e, reqBody }, 'failed to open channel');
    return res.status(500).json({ error: (e as Error).message });
  }
}) as express.RequestHandler);

export default router;
