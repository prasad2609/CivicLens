import pg from 'pg';

async function testSync() {
  const pool = new pg.Pool({
    connectionString: 'postgresql://postgres.xdcbljxmduftgbxlyxyv:Durgaprasad@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  console.log('1. Submitting test issue via CivicLens API (http://localhost:3000/api/issues)...');
  const res = await fetch('http://localhost:3000/api/issues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Real-Time Supabase Sync Pothole Confirmation',
      description: 'Verifying that complaints reported on CivicLens reflect instantly in Supabase PostgreSQL.',
      category_id: 'cat-roads',
      jurisdiction_id: 'jur-ward-01',
      location_text: 'Live Sync Road, Ward 1',
      latitude: 13.0650,
      longitude: 80.2550,
      severity: 'high',
      photo_url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      photo_caption: 'Live sync proof photo',
      authenticity: {
        is_ai_generated: false,
        ai_probability: 0.02,
        real_probability: 0.98,
        confidence: 0.98,
        verdict: 'real',
        engine: 'microsoft/cvt-13'
      }
    })
  });

  const json = await res.json();
  console.log('API Created Complaint Code:', json.issue?.complaint_code);

  // Wait 2 seconds for database write
  await new Promise(r => setTimeout(r, 2000));

  console.log('2. Querying Supabase PostgreSQL directly for the new record:');
  const { rows } = await pool.query(
    'SELECT id, complaint_code, title, status, ai_verification_status, created_at FROM issues WHERE title = $1;',
    ['Real-Time Supabase Sync Pothole Confirmation']
  );
  console.log('Found in Supabase:');
  console.table(rows);

  const issueId = rows[0]?.id;
  if (issueId) {
    console.log('\n3. Dispatching field worker via CivicLens API...');
    await fetch(`http://localhost:3000/api/issues/${issueId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldWorkerId: 'user-field-kumar',
        note: 'Mobilizing asphalt patch crew to site.'
      })
    });

    await new Promise(r => setTimeout(r, 2000));

    const { rows: updatedRows } = await pool.query(
      'SELECT complaint_code, status, assigned_field_worker_id, updated_at FROM issues WHERE id = $1;',
      [issueId]
    );
    console.log('Verified Updated State in Supabase:');
    console.table(updatedRows);
  }

  const totalCount = await pool.query('SELECT count(*) FROM issues;');
  console.log('\nTotal Issues Now in Supabase:', totalCount.rows[0].count);

  await pool.end();
}

testSync();
