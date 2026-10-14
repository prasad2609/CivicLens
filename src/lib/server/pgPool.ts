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
      connectionTimeoutMillis: 10000,
      keepAlive: true,
    });
    pool.on('error', (err) => {
      console.warn('Unexpected error on idle Supabase client:', err.message);
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

export async function testPgConnection(): Promise<{
  connected: boolean;
  database?: string;
  user?: string;
  version?: string;
  latency_ms: number;
  tables_count?: number;
  tables?: Array<{ name: string; count: number }>;
  error?: string;
}> {
  const start = Date.now();
  try {
    const p = getPgPool();
    if (!p) {
      return { connected: false, latency_ms: 0, error: 'DATABASE_URL or SUPABASE_DB_URL is not configured.' };
    }

    const infoRes = await queryPg('SELECT current_database(), current_user, version();');
    const latency = Date.now() - start;

    const tableListRes = await queryPg<{ table_name: string }>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tableCounts: Array<{ name: string; count: number }> = [];
    for (const r of tableListRes) {
      try {
        const countRes = await queryPg(`SELECT COUNT(*) as count FROM "${r.table_name}";`);
        tableCounts.push({ name: r.table_name, count: Number(countRes[0]?.count || 0) });
      } catch {
        tableCounts.push({ name: r.table_name, count: -1 });
      }
    }

    return {
      connected: true,
      database: infoRes[0]?.current_database,
      user: infoRes[0]?.current_user,
      version: infoRes[0]?.version?.slice(0, 60),
      latency_ms: latency,
      tables_count: tableListRes.length,
      tables: tableCounts,
    };
  } catch (err: any) {
    return {
      connected: false,
      latency_ms: Date.now() - start,
      error: err.message,
    };
  }
}
