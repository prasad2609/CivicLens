import pg from 'pg';

function getConnectionString(): string {
  const raw =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.SUPABASE_POSTGRES_URL ||
    '';

  let cleaned = raw.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

export const isPgConfigured = Boolean(getConnectionString());

let pool: pg.Pool | null = null;

export function getPgPool(): pg.Pool | null {
  const connStr = getConnectionString();
  if (!connStr) return null;

  if (!pool) {
    pool = new pg.Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
    });
    pool.on('error', (err) => {
      console.warn('Unexpected error on idle Supabase PostgreSQL pool client:', err.message);
      // Reset pool on fatal network disconnects in serverless
      pool = null;
    });
  }
  return pool;
}

export async function queryPg<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const p = getPgPool();
  if (!p) {
    throw new Error('PostgreSQL database connection is not configured. Set DATABASE_URL or SUPABASE_DB_URL in environment variables.');
  }

  let client: pg.PoolClient | null = null;
  try {
    client = await p.connect();
    const res = await client.query(sql, params);
    return res.rows as T[];
  } catch (err: any) {
    // If connection was dead, reset pool and retry once
    if (err.code === 'ECONNRESET' || err.message?.includes('closed') || err.message?.includes('timeout')) {
      console.warn('Retrying failed Supabase query with fresh connection:', err.message);
      pool = null;
      const retryP = getPgPool();
      if (retryP) {
        const retryClient = await retryP.connect();
        try {
          const res = await retryClient.query(sql, params);
          return res.rows as T[];
        } finally {
          retryClient.release();
        }
      }
    }
    throw err;
  } finally {
    if (client) {
      try {
        client.release();
      } catch {}
    }
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
      return {
        connected: false,
        latency_ms: 0,
        error: 'DATABASE_URL or SUPABASE_DB_URL is not configured in Vercel environment variables.',
      };
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
