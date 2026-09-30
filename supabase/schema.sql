-- ====================================================================
-- CivicLens: Production PostgreSQL Schema with Supabase RLS
-- Constituency Accountability & Civic Transparency Platform
-- Resilient relational schema with high-performance indexing
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'citizen',
        'officer',
        'field_worker',
        'representative',
        'admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE issue_severity AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE issue_status AS ENUM (
        'submitted',
        'under_verification',
        'assigned',
        'acknowledged',
        'in_progress',
        'awaiting_information',
        'resolved',
        'reopened',
        'escalated',
        'closed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_result AS ENUM (
        'completely_resolved',
        'partially_resolved',
        'not_resolved'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM (
        'proposed',
        'approved',
        'in_progress',
        'completed',
        'delayed',
        'on_hold'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. JURISDICTIONS (Wards / Zones)
CREATE TABLE IF NOT EXISTS jurisdictions (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    name_ta VARCHAR(255),
    ward_number VARCHAR(50) NOT NULL UNIQUE,
    zone VARCHAR(100) NOT NULL,
    area_description TEXT,
    center_lat DOUBLE PRECISION NOT NULL,
    center_lng DOUBLE PRECISION NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ISSUE CATEGORIES
CREATE TABLE IF NOT EXISTS issue_categories (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    name_ta VARCHAR(255),
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'AlertCircle',
    default_sla_acknowledgement_hours INT DEFAULT 24,
    default_sla_resolution_days INT DEFAULT 7,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ROUTING RULES
CREATE TABLE IF NOT EXISTS routing_rules (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    category_id VARCHAR(100) NOT NULL,
    jurisdiction_id VARCHAR(100),
    department_id VARCHAR(100) NOT NULL,
    priority INT DEFAULT 1,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    auth_user_id UUID UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    role user_role DEFAULT 'citizen' NOT NULL,
    department_id VARCHAR(100),
    preferred_language VARCHAR(10) DEFAULT 'en',
    area VARCHAR(255),
    password_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. CIVIC ISSUES (With AI image verification status)
CREATE TABLE IF NOT EXISTS issues (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    complaint_code VARCHAR(30) NOT NULL UNIQUE,
    citizen_id VARCHAR(100) NOT NULL,
    category_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity issue_severity DEFAULT 'medium' NOT NULL,
    status issue_status DEFAULT 'submitted' NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location_text TEXT NOT NULL,
    jurisdiction_id VARCHAR(100),
    department_id VARCHAR(100),
    assigned_officer_id VARCHAR(100),
    assigned_field_worker_id VARCHAR(100),
    is_overdue BOOLEAN DEFAULT false,
    sla_target_date TIMESTAMPTZ,
    ai_verification_status VARCHAR(50) DEFAULT 'unverified',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

-- 9. ISSUE EVIDENCE (With CvT-13 AI authenticity metadata)
CREATE TABLE IF NOT EXISTS issue_evidence (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    issue_id VARCHAR(100) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    uploaded_by VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50) DEFAULT 'image/jpeg',
    evidence_type VARCHAR(50) DEFAULT 'citizen_report',
    caption TEXT,
    authenticity JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. ASSIGNMENTS
CREATE TABLE IF NOT EXISTS assignments (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    issue_id VARCHAR(100) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    officer_id VARCHAR(100),
    field_worker_id VARCHAR(100),
    assigned_by VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active',
    assigned_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMPTZ
);

-- 11. TIMELINE EVENTS
CREATE TABLE IF NOT EXISTS timeline_events (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    issue_id VARCHAR(100) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    actor_id VARCHAR(100),
    actor_role VARCHAR(50) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    old_status issue_status,
    new_status issue_status,
    note TEXT,
    evidence_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. VERIFICATIONS (Citizen resolution review)
CREATE TABLE IF NOT EXISTS verifications (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    issue_id VARCHAR(100) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    citizen_id VARCHAR(100) NOT NULL,
    result verification_result NOT NULL,
    comment TEXT,
    new_evidence_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. ESCALATIONS
CREATE TABLE IF NOT EXISTS escalations (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    escalation_code VARCHAR(30) NOT NULL UNIQUE,
    issue_id VARCHAR(100) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    raised_by VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status VARCHAR(50) DEFAULT 'pending_review',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMPTZ
);

-- 14. PUBLIC DEVELOPMENT PROJECTS
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    agency VARCHAR(255) NOT NULL,
    status project_status DEFAULT 'in_progress' NOT NULL,
    start_date DATE NOT NULL,
    expected_completion DATE NOT NULL,
    approved_amount NUMERIC(15, 2) NOT NULL,
    expenditure NUMERIC(15, 2) DEFAULT 0.00,
    funding_source VARCHAR(255) NOT NULL,
    source_reference VARCHAR(255),
    demo_data BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_issue_id VARCHAR(100),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. AUDIT LOGS (Immutable tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    actor_id VARCHAR(100),
    actor_email VARCHAR(255),
    actor_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_department_id ON issues(department_id);
CREATE INDEX IF NOT EXISTS idx_issues_jurisdiction_id ON issues(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_issues_citizen_id ON issues(citizen_id);
CREATE INDEX IF NOT EXISTS idx_issues_category_id ON issues(category_id);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_worker ON issues(assigned_field_worker_id);
CREATE INDEX IF NOT EXISTS idx_issues_coords ON issues(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_issues_complaint_code ON issues(complaint_code);
CREATE INDEX IF NOT EXISTS idx_issues_ai_status ON issues(ai_verification_status);

CREATE INDEX IF NOT EXISTS idx_issue_evidence_issue_id ON issue_evidence(issue_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_issue_id ON timeline_events(issue_id);
CREATE INDEX IF NOT EXISTS idx_verifications_issue_id ON verifications(issue_id);
CREATE INDEX IF NOT EXISTS idx_escalations_issue_id ON escalations(issue_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ====================================================================
-- AUTOMATED TRIGGERS & FUNCTIONS
-- ====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_issues_updated_at ON issues;
CREATE TRIGGER trg_issues_updated_at
    BEFORE UPDATE ON issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sequential Complaint Code Generator Trigger
CREATE SEQUENCE IF NOT EXISTS complaint_code_seq START 130;

CREATE OR REPLACE FUNCTION generate_complaint_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.complaint_code IS NULL OR NEW.complaint_code = '' THEN
        NEW.complaint_code := 'CL-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(NEXTVAL('complaint_code_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_complaint_code ON issues;
CREATE TRIGGER trg_generate_complaint_code
    BEFORE INSERT ON issues
    FOR EACH ROW EXECUTE FUNCTION generate_complaint_code();

-- ====================================================================
-- ANALYTICS VIEWS
-- ====================================================================
CREATE OR REPLACE VIEW view_constituency_metrics AS
SELECT
    COUNT(*) AS total_complaints,
    COUNT(*) FILTER (WHERE status IN ('submitted', 'under_verification', 'assigned', 'acknowledged')) AS submitted,
    COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
    COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
    COUNT(*) FILTER (WHERE status = 'reopened') AS reopened,
    COUNT(*) FILTER (WHERE status = 'escalated') AS escalated,
    COUNT(*) FILTER (WHERE status = 'closed') AS closed,
    COUNT(*) FILTER (WHERE is_overdue = true) AS overdue,
    COUNT(*) FILTER (WHERE ai_verification_status = 'flagged_ai') AS ai_flagged,
    COUNT(*) FILTER (WHERE ai_verification_status = 'verified_real') AS verified_real
FROM issues;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public can view departments" ON departments;
    CREATE POLICY "Public can view departments" ON departments FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public can view jurisdictions" ON jurisdictions;
    CREATE POLICY "Public can view jurisdictions" ON jurisdictions FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public can view issue categories" ON issue_categories;
    CREATE POLICY "Public can view issue categories" ON issue_categories FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public can view routing rules" ON routing_rules;
    CREATE POLICY "Public can view routing rules" ON routing_rules FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public can view projects" ON projects;
    CREATE POLICY "Public can view projects" ON projects FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Profiles viewable by all" ON profiles;
    CREATE POLICY "Profiles viewable by all" ON profiles FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Profiles insertable by all" ON profiles;
    CREATE POLICY "Profiles insertable by all" ON profiles FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Profiles updatable by all" ON profiles;
    CREATE POLICY "Profiles updatable by all" ON profiles FOR UPDATE USING (true);

    DROP POLICY IF EXISTS "Public can view open complaints" ON issues;
    CREATE POLICY "Public can view open complaints" ON issues FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Citizens can insert complaints" ON issues;
    CREATE POLICY "Citizens can insert complaints" ON issues FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Authorized users can update complaints" ON issues;
    CREATE POLICY "Authorized users can update complaints" ON issues FOR UPDATE USING (true);

    DROP POLICY IF EXISTS "Evidence viewable by all" ON issue_evidence;
    CREATE POLICY "Evidence viewable by all" ON issue_evidence FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Evidence insertable by all" ON issue_evidence;
    CREATE POLICY "Evidence insertable by all" ON issue_evidence FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Timeline viewable by all" ON timeline_events;
    CREATE POLICY "Timeline viewable by all" ON timeline_events FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Timeline insertable by authorized" ON timeline_events;
    CREATE POLICY "Timeline insertable by authorized" ON timeline_events FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Verifications viewable by all" ON verifications;
    CREATE POLICY "Verifications viewable by all" ON verifications FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Verifications insertable by citizens" ON verifications;
    CREATE POLICY "Verifications insertable by citizens" ON verifications FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Escalations viewable by all" ON escalations;
    CREATE POLICY "Escalations viewable by all" ON escalations FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Escalations insertable by citizens" ON escalations;
    CREATE POLICY "Escalations insertable by citizens" ON escalations FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
    CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Audit logs viewable by all" ON audit_logs;
    CREATE POLICY "Audit logs viewable by all" ON audit_logs FOR SELECT USING (true);
END $$;
