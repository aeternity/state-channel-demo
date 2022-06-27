import express from 'express';
import { generateGameSession } from '../services/bot/bot.service';
import { ResponderBaseChannelConfig } from './interface';

const router = express.Router();

router.post('/open', (async (req, res) => {
  try {
    const { address, port, host } = req.body as Partial<ResponderBaseChannelConfig>;

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
    return res.send(config);
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: (e as Error).message });
  }
}) as express.RequestHandler);

export default router;
