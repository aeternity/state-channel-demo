import { app } from './app';
import logger from './logger';

const start = (port: string | number) => {
  try {
    app.listen(port, () => {
      logger.info(`Bot service running at port ${port}`);
    });
  } catch (err) {
    console.log('Fatal error', err);
    logger.error(`Fatal error: ${err.toString()}`);
    process.exit();
  }
};

start(process.env.BOT_SERVICE_PORT || 3000);
