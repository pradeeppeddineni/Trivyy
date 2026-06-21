import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import type { Env } from './config/env';
import { openapiDocument } from './openapi';
import { healthRouter } from './routes/health';
import { sessionRouter } from './routes/session';
import { authRouter } from './routes/auth';
import { friendsRouter } from './routes/friends';
import { groupsRouter } from './routes/groups';
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

  // Behind the Cloudflare Tunnel + nginx, the API sees a proxied request. Trust
  // the first proxy hop so `req.protocol`/`req.secure` reflect the original
  // https at the edge — required for the `secure` session cookie to be set in
  // production (ADR 0004 / 0005).
  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(express.json());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));

  // Persist sessions in Postgres (DB-1, SEC-3) so a player's session — and thus
  // their game membership — survives a server restart. The `session` table is
  // created by migration v2. Unit tests run without a database, so they fall
  // back to the in-memory store.
  const sessionOptions: session.SessionOptions = {
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
    },
  };
  if (env.NODE_ENV !== 'test') {
    const PgSession = connectPgSimple(session);
    sessionOptions.store = new PgSession({
      conString: env.DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: false,
    });
  }
  app.use(session(sessionOptions));

  // OpenAPI contract (API-1): the JSON spec is always available; the browsable
  // Swagger UI is mounted only outside production.
  app.get('/api/openapi.json', (_req, res) => res.json(openapiDocument));
  if (env.NODE_ENV !== 'production') {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
  }

  app.use('/api', healthRouter);
  app.use('/api', sessionRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/friends', friendsRouter);
  app.use('/api/groups', groupsRouter);
  app.use('/api/games', gamesRouter);
  app.use('/api/admin', adminRouter(env));

  app.use(errorHandler);

  return app;
}
