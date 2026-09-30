import pg from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  '';

export const isPgConfigured = Boolean(connectionString);

let pool: pg.Pool | null = null;

export function getPgPool(): pg.Pool | null {
  if (!isPgConfigured) return null;
  if (!pool) {
    pool = new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function queryPg<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const p = getPgPool();
  if (!p) throw new Error('PostgreSQL database connection is not configured.');
  const client = await p.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows as T[];
  } finally {
    client.release();
  }
}
