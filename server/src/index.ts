import { loadEnv } from './config/env';
import { createApp } from './app';
import { logger } from './lib/logger';

const env = loadEnv();
const app = createApp(env);

app.listen(env.PORT, () => {
  logger.info('server_started', { port: env.PORT, env: env.NODE_ENV });
});
