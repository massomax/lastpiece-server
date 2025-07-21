import express, { Application } from 'express';
import config from './config';
import { initMongo } from './loaders/mongooseLoader';
import { initExpress } from './loaders/expressLoader';

const app: Application = express();

(async () => {
  await initMongo();
  initExpress(app);
  app.listen(config.port, () => {
    console.log(`🚀 Server running at http://localhost:${config.port}`);
  });
})();