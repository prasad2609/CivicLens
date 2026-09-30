import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Connection string to Supabase session pooler on port 5432
const dbUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres.xdcbljxmduftgbxlyxyv:Durgaprasad@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

console.log('🚀 Synchronizing All CivicLens Data to Supabase Database');
console.log('========================================================');

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function sync() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL database.\n');

    // 1. Drop existing tables with UUID types so they can be recreated with flexible VARCHAR(100) IDs
    console.log('🔄 Resetting existing tables to flexible VARCHAR(100) identifiers...');
    await client.query(`
      DROP TABLE IF EXISTS 
        assignments, 
        escalations, 
        verifications, 
        timeline_events, 
        issue_evidence, 
        notifications, 
        audit_logs, 
        issues, 
        routing_rules, 
        profiles, 
        issue_categories, 
        jurisdictions, 
        departments, 
        projects 
      CASCADE;
      DROP VIEW IF EXISTS view_constituency_metrics CASCADE;
    `);

    // 2. Run Schema to recreate all tables with VARCHAR(100) IDs
    const schemaSql = fs.readFileSync(path.join(rootDir, 'supabase', 'schema.sql'), 'utf8');
    console.log('🔨 Creating schema definitions on Supabase...');
    await client.query(schemaSql);
    console.log('✅ Schema ready with flexible identifiers.\n');

    // 2. Read server_db.json
    const dbPath = path.join(rootDir, 'src', 'data', 'server_db.json');
    const raw = fs.readFileSync(dbPath, 'utf8');
    const data = JSON.parse(raw);

    // 3. Sync Departments
    console.log(`📦 Syncing ${data.departments.length} departments...`);
    for (const d of data.departments) {
      await client.query(
        `INSERT INTO departments (id, name, code, description, contact_email, contact_phone, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           code = EXCLUDED.code,
           description = EXCLUDED.description,
           contact_email = EXCLUDED.contact_email,
           contact_phone = EXCLUDED.contact_phone;`,
        [d.id, d.name, d.code, d.description || '', d.contact_email || '', d.contact_phone || '', d.active ?? true]
      );
    }

    // 4. Sync Jurisdictions
    console.log(`📦 Syncing ${data.jurisdictions.length} jurisdictions / wards...`);
    for (const j of data.jurisdictions) {
      await client.query(
        `INSERT INTO jurisdictions (id, name, name_ta, ward_number, zone, area_description, center_lat, center_lng, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           name_ta = EXCLUDED.name_ta,
           ward_number = EXCLUDED.ward_number,
           zone = EXCLUDED.zone,
           area_description = EXCLUDED.area_description,
           center_lat = EXCLUDED.center_lat,
           center_lng = EXCLUDED.center_lng;`,
        [j.id, j.name, j.name_ta || '', j.ward_number, j.zone, j.area_description || '', j.center_lat, j.center_lng, j.active ?? true]
      );
    }

    // 5. Sync Issue Categories
    console.log(`📦 Syncing ${data.categories.length} issue categories...`);
    for (const c of data.categories) {
      await client.query(
        `INSERT INTO issue_categories (id, name, name_ta, code, description, icon, default_sla_acknowledgement_hours, default_sla_resolution_days, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           name_ta = EXCLUDED.name_ta,
           code = EXCLUDED.code,
           description = EXCLUDED.description,
           icon = EXCLUDED.icon,
           default_sla_acknowledgement_hours = EXCLUDED.default_sla_acknowledgement_hours,
           default_sla_resolution_days = EXCLUDED.default_sla_resolution_days;`,
        [c.id, c.name, c.name_ta || '', c.code, c.description || '', c.icon || 'AlertCircle', c.default_sla_acknowledgement_hours || 24, c.default_sla_resolution_days || 7, c.active ?? true]
      );
    }

    // 6. Sync Routing Rules
    console.log(`📦 Syncing ${data.routingRules.length} routing rules...`);
    for (const r of data.routingRules) {
      await client.query(
        `INSERT INTO routing_rules (id, category_id, jurisdiction_id, department_id, priority, active)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING;`,
        [r.id, r.category_id, r.jurisdiction_id || null, r.department_id, r.priority || 1, r.active ?? true]
      );
    }

    // 7. Sync Profiles / Users
    console.log(`📦 Syncing ${data.users.length} user profiles...`);
    for (const u of data.users) {
      await client.query(
        `INSERT INTO profiles (id, full_name, email, phone, role, department_id, preferred_language, area, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           email = EXCLUDED.email,
           phone = EXCLUDED.phone,
           role = EXCLUDED.role,
           department_id = EXCLUDED.department_id,
           area = EXCLUDED.area,
           password_hash = EXCLUDED.password_hash;`,
        [u.id, u.full_name, u.email, u.phone || '', u.role, u.department_id || null, u.preferred_language || 'en', u.area || '', u.password_hash || 'civiclens123']
      );
    }

    // 8. Sync Projects
    console.log(`📦 Syncing ${data.projects.length} public projects...`);
    for (const p of data.projects) {
      await client.query(
        `INSERT INTO projects (id, name, description, category, location, agency, status, start_date, expected_completion, approved_amount, expenditure, funding_source, source_reference, demo_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           status = EXCLUDED.status,
           expenditure = EXCLUDED.expenditure;`,
        [
          p.id,
          p.name,
          p.description || '',
          p.category,
          p.location,
          p.agency,
          p.status,
          p.start_date || '2025-01-01',
          p.expected_completion || '2026-12-31',
          p.approved_amount || 0,
          p.expenditure || 0,
          p.funding_source || 'Municipal Development Fund',
          p.source_reference || '',
          p.demo_data ?? true,
        ]
      );
    }

    // 9. Sync All Issues & Nested Evidence
    console.log(`📦 Syncing ${data.issues.length} civic issues with AI verification status...`);
    let evidenceCount = 0;
    let timelineCount = 0;
    let verificationCount = 0;

    for (const issue of data.issues) {
      // Upsert Issue
      await client.query(
        `INSERT INTO issues (
           id, complaint_code, citizen_id, category_id, title, description, severity, status,
           latitude, longitude, location_text, jurisdiction_id, department_id,
           assigned_officer_id, assigned_field_worker_id, is_overdue, sla_target_date,
           ai_verification_status, created_at, updated_at, resolved_at, closed_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           severity = EXCLUDED.severity,
           ai_verification_status = EXCLUDED.ai_verification_status,
           assigned_officer_id = EXCLUDED.assigned_officer_id,
           assigned_field_worker_id = EXCLUDED.assigned_field_worker_id,
           is_overdue = EXCLUDED.is_overdue,
           resolved_at = EXCLUDED.resolved_at,
           closed_at = EXCLUDED.closed_at,
           updated_at = EXCLUDED.updated_at;`,
        [
          issue.id,
          issue.complaint_code,
          issue.citizen_id,
          issue.category_id,
          issue.title,
          issue.description,
          issue.severity,
          issue.status,
          issue.latitude,
          issue.longitude,
          issue.location_text,
          issue.jurisdiction_id || null,
          issue.department_id || null,
          issue.assigned_officer_id || null,
          issue.assigned_field_worker_id || null,
          Boolean(issue.is_overdue),
          issue.sla_target_date || null,
          issue.ai_verification_status || 'unverified',
          issue.created_at,
          issue.updated_at || issue.created_at,
          issue.resolved_at || null,
          issue.closed_at || null,
        ]
      );

      // Sync Evidence
      if (issue.evidence && Array.isArray(issue.evidence)) {
        for (const ev of issue.evidence) {
          await client.query(
            `INSERT INTO issue_evidence (id, issue_id, uploaded_by, file_path, file_type, evidence_type, caption, authenticity, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO UPDATE SET
               authenticity = EXCLUDED.authenticity;`,
            [
              ev.id,
              issue.id,
              ev.uploaded_by || issue.citizen_id,
              ev.file_path,
              ev.file_type || 'image/jpeg',
              ev.evidence_type || 'citizen_report',
              ev.caption || '',
              ev.authenticity ? JSON.stringify(ev.authenticity) : null,
              ev.created_at || issue.created_at,
            ]
          );
          evidenceCount++;
        }
      }

      // Sync Timeline Events
      if (issue.timeline && Array.isArray(issue.timeline)) {
        for (const te of issue.timeline) {
          await client.query(
            `INSERT INTO timeline_events (id, issue_id, actor_id, actor_role, actor_name, event_type, old_status, new_status, note, evidence_url, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO NOTHING;`,
            [
              te.id,
              issue.id,
              te.actor_id || null,
              te.actor_role,
              te.actor_name,
              te.event_type,
              te.old_status || null,
              te.new_status || null,
              te.note || '',
              te.evidence_url || null,
              te.created_at || issue.created_at,
            ]
          );
          timelineCount++;
        }
      }

      // Sync Verification
      if (issue.verification) {
        const v = issue.verification;
        await client.query(
          `INSERT INTO verifications (id, issue_id, citizen_id, result, comment, new_evidence_url, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             result = EXCLUDED.result,
             comment = EXCLUDED.comment;`,
          [
            v.id,
            issue.id,
            v.citizen_id,
            v.result,
            v.comment || '',
            v.new_evidence_url || null,
            v.created_at || new Date().toISOString(),
          ]
        );
        verificationCount++;
      }
    }

    // 10. Sync Notifications
    console.log(`📦 Syncing ${data.notifications.length} notifications...`);
    for (const n of data.notifications) {
      await client.query(
        `INSERT INTO notifications (id, user_id, title, message, related_issue_id, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING;`,
        [n.id, n.user_id, n.title, n.message, n.related_issue_id || null, Boolean(n.is_read), n.created_at]
      );
    }

    // 11. Sync Audit Logs
    console.log(`📦 Syncing ${data.auditLogs.length} audit logs...`);
    for (const a of data.auditLogs) {
      await client.query(
        `INSERT INTO audit_logs (id, actor_id, actor_email, actor_role, action, entity_type, entity_id, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING;`,
        [a.id, a.actor_id || null, a.actor_email || '', a.actor_role || '', a.action, a.entity_type, a.entity_id, JSON.stringify(a.metadata || {}), a.created_at]
      );
    }

    // 12. Verification Report
    console.log('\n========================================================');
    console.log('📊 FINAL SUPABASE DATABASE ROW COUNTS:');
    console.log('========================================================');
    const tables = [
      'issues',
      'issue_evidence',
      'departments',
      'jurisdictions',
      'issue_categories',
      'routing_rules',
      'profiles',
      'projects',
      'timeline_events',
      'verifications',
      'notifications',
      'audit_logs',
      'view_constituency_metrics',
    ];

    for (const t of tables) {
      const res = await client.query(`SELECT count(*) FROM "${t}";`);
      console.log(`   - ${t.padEnd(26)} : ${res.rows[0].count} records`);
    }

    console.log('\n🎉 ALL DATA AND CHANGES SYNCHRONIZED SUCCESSFULLY TO SUPABASE!');
  } catch (err) {
    console.error('\n❌ Synchronization Failed:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
}

sync();
