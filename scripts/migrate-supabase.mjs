import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Read .env.local if present
function loadEnvLocal() {
  const envPath = path.join(rootDir, '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvLocal();

// 2. Resolve Connection String
const connArg = process.argv[2];
const dbUrl =
  connArg ||
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.POSTGRES_URL;

if (!dbUrl) {
  console.error('\n❌ Error: No Supabase PostgreSQL connection URL provided.');
  console.log('\nUsage:');
  console.log('  node scripts/migrate-supabase.mjs "<POSTGRES_CONNECTION_STRING>"');
  console.log('or set DATABASE_URL in .env.local\n');
  console.log('Example:');
  console.log('  node scripts/migrate-supabase.mjs "postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"\n');
  process.exit(1);
}

console.log('\n🚀 CivicLens Supabase Automated Migration Runner');
console.log('==================================================');
console.log(`📡 Target Host: ${new URL(dbUrl.replace(/^postgresql:\/\//, 'http://')).hostname || 'Supabase PostgreSQL'}`);

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }, // Essential for Supabase SSL connections
});

async function runMigration() {
  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connection established successfully.\n');

    // 1. Read & Execute Schema
    const schemaPath = path.join(rootDir, 'supabase', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔨 Executing schema.sql (tables, enums, triggers, indexes, views, RLS)...');
    await client.query(schemaSql);
    console.log('✅ Schema migration executed successfully.\n');

    // 2. Read & Execute Seed
    const seedPath = path.join(rootDir, 'supabase', 'seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('🌱 Executing seed.sql (departments, wards, categories, demo users, projects)...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await client.query(seedSql);
      console.log('✅ Seed dataset executed successfully.\n');
    }

    // 3. Verify Created Tables
    console.log('🔍 Verifying created relational tables in public schema:');
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tables = tableRes.rows.map((r) => r.table_name);
    console.log(`📊 Found ${tables.length} tables in public schema:`);
    for (const t of tables) {
      const countRes = await client.query(`SELECT COUNT(*) FROM "${t}";`);
      console.log(`   - ${t.padEnd(24)} (${countRes.rows[0].count} records)`);
    }

    // 4. Verify AI Authenticity Columns
    const aiColRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'issues' AND column_name = 'ai_verification_status';
    `);

    if (aiColRes.rows.length > 0) {
      console.log('\n🧠 Verified: issues.ai_verification_status column is active for CvT-13 AI Detector integration.');
    }

    console.log('\n🎉 Supabase Database Setup Completed Successfully!');
    console.log('==================================================');
    console.log('CivicLens is now fully connected to your Supabase PostgreSQL database.');
  } catch (err) {
    console.error('\n❌ Migration Failed:', err.message);
    if (err.detail) console.error('Details:', err.detail);
    if (err.hint) console.error('Hint:', err.hint);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
