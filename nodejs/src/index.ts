import { app } from './app';

const start = (port: string | number) => {
  try {
    app.listen(port, () => {
      console.log(`Bot service running at port ${port}`);
    });
  } catch (err) {
    console.error(err);
    process.exit();
  }
};

start(process.env.BOT_SERVICE_PORT || 3000);
