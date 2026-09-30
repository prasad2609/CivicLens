import pg from 'pg';

const regions = [
  'ap-southeast-1',
  'us-east-1',
  'us-west-1',
  'us-east-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-southeast-2',
  'ca-central-1',
  'sa-east-1',
  'me-central-1',
  'af-south-1'
];

async function findRegion() {
  for (const r of regions) {
    const host = `aws-0-${r}.pooler.supabase.com`;
    process.stdout.write(`Testing ${r}... `);
    const client = new pg.Client({
      connectionString: `postgresql://postgres.xdcbljxmduftgbxlyxyv:Durgaprasad@${host}:6543/postgres`,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000
    });
    try {
      await client.connect();
      console.log(`\n🎉 SUCCESS! Region matched: ${r}`);
      await client.end();
      return r;
    } catch (e) {
      if (e.message.includes('tenant/user') && e.message.includes('not found')) {
        console.log('not here');
      } else if (e.message.includes('timeout')) {
        console.log('timeout');
      } else {
        console.log(`\n🎉 MATCHED REGION (${r}) with response: ${e.message}`);
        try { await client.end(); } catch {}
        return r;
      }
    }
  }
  console.log('No region matched from list.');
}

findRegion();
