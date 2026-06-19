import { Pool } from 'pg';
import { loadEnv } from '../config/env';

/**
 * Single Postgres connection pool (DB-1). Services import this; the schema is
 * owned entirely by versioned migrations (DB-2) under server/migrations.
 */
const env = loadEnv();

export const pool = new Pool({ connectionString: env.DATABASE_URL });
