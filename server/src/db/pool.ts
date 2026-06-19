import { Pool, type QueryResult, type QueryResultRow, type PoolClient } from 'pg';
import { loadEnv } from '../config/env';

/**
 * Single Postgres connection pool (DB-1). Services import this; the schema is
 * owned entirely by versioned migrations (DB-2) under server/migrations.
 *
 * The underlying pg.Pool is created lazily on first use so that importing a
 * service (and transitively this module) does not require a valid DATABASE_URL.
 * That keeps the unit suite DB-free: it can construct the Express app and assert
 * routing/validation without a database, while integration/e2e use a real one.
 */
let instance: Pool | null = null;

function getPool(): Pool {
  if (!instance) {
    const env = loadEnv();
    instance = new Pool({ connectionString: env.DATABASE_URL });
  }
  return instance;
}

export const pool = {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: ReadonlyArray<unknown>,
  ): Promise<QueryResult<T>> {
    return getPool().query<T>(text, params as unknown[]);
  },
  connect(): Promise<PoolClient> {
    return getPool().connect();
  },
  end(): Promise<void> {
    if (!instance) {
      return Promise.resolve();
    }
    const closing = instance.end();
    instance = null;
    return closing;
  },
};
