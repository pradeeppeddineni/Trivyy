import express from 'express';
import session from 'express-session';
import cors from 'cors';
import type { Env } from './config/env';
import { healthRouter } from './routes/health';
import { sessionRouter } from './routes/session';
import { gamesRouter } from './routes/games';
import { adminRouter } from './routes/admin';
import { errorHandler } from './middleware/error';

/**
 * Build the Express app from validated config. This is a factory (not a
 * module-level singleton) so tests can construct it with a test env and no
 * live database — see tests/helpers.ts.
 */
export function createApp(env: Env): express.Express {
  const app = express();

  app.use(express.json());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(
    session({
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
      },
    }),
  );

  app.use('/api', healthRouter);
  app.use('/api', sessionRouter);
  app.use('/api/games', gamesRouter);
  app.use('/api/admin', adminRouter(env));

  app.use(errorHandler);

  return app;
}
