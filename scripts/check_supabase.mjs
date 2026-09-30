import pg from 'pg';

async function check() {
  const url = 'postgresql://postgres.xdcbljxmduftgbxlyxyv:Durgaprasad@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
  console.log('Connecting to session pooler on port 5432...');
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected!');

    const dbInfo = await client.query('SELECT current_database(), current_user, current_schema();');
    console.log('Database Info:', dbInfo.rows[0]);

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Tables in public schema:', tablesRes.rows.map(r => r.table_name));

    for (const t of tablesRes.rows.map(r => r.table_name)) {
      try {
        const countRes = await client.query(`SELECT count(*) FROM "${t}";`);
        console.log(`- ${t}: ${countRes.rows[0].count} rows`);
      } catch (err) {
        console.log(`- ${t}: Error (${err.message})`);
      }
    }

    await client.end();
  } catch (err) {
    console.error('Check Error:', err.message);
  }
}

check();
