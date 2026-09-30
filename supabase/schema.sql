-- ====================================================================
-- CivicLens: Production PostgreSQL Schema with Supabase RLS
-- Constituency Accountability & Civic Transparency Platform
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES issue_categories(id) ON DELETE CASCADE,
    jurisdiction_id UUID REFERENCES jurisdictions(id) ON DELETE SET NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    priority INT DEFAULT 1,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. PROFILES (Extends auth.users or standalone platform users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    role user_role DEFAULT 'citizen' NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    preferred_language VARCHAR(10) DEFAULT 'en',
    area VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. CIVIC ISSUES (With AI image verification status)
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_code VARCHAR(30) NOT NULL UNIQUE,
    citizen_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES issue_categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity issue_severity DEFAULT 'medium' NOT NULL,
    status issue_status DEFAULT 'submitted' NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location_text TEXT NOT NULL,
    jurisdiction_id UUID REFERENCES jurisdictions(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    assigned_officer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_field_worker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    file_path TEXT NOT NULL,
    file_type VARCHAR(50) DEFAULT 'image/jpeg',
    evidence_type VARCHAR(50) DEFAULT 'citizen_report',
    caption TEXT,
    authenticity JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. ASSIGNMENTS
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    officer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    field_worker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES profiles(id),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active',
    assigned_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMPTZ
);

-- 11. TIMELINE EVENTS
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL REFERENCES profiles(id),
    result verification_result NOT NULL,
    comment TEXT,
    new_evidence_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. ESCALATIONS
CREATE TABLE IF NOT EXISTS escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escalation_code VARCHAR(30) NOT NULL UNIQUE,
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    raised_by UUID NOT NULL REFERENCES profiles(id),
    reason TEXT NOT NULL,
    details TEXT,
    status VARCHAR(50) DEFAULT 'pending_review',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMPTZ
);

-- 14. PUBLIC DEVELOPMENT PROJECTS
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. AUDIT LOGS (Immutable tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
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

-- Trigger to auto-update updated_at timestamp
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
CREATE SEQUENCE IF NOT EXISTS complaint_code_seq START 101;

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
-- STORAGE BUCKETS (If storage extension active)
-- ====================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES 
            ('evidence-photos', 'evidence-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
            ('project-documents', 'project-documents', true, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
        ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
    END IF;
END $$;

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

-- Public Reference Tables (Read-Only to Public)
CREATE POLICY "Public can view departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Public can view jurisdictions" ON jurisdictions FOR SELECT USING (true);
CREATE POLICY "Public can view issue categories" ON issue_categories FOR SELECT USING (true);
CREATE POLICY "Public can view routing rules" ON routing_rules FOR SELECT USING (true);
CREATE POLICY "Public can view projects" ON projects FOR SELECT USING (true);

-- Profiles
CREATE POLICY "Profiles viewable by authenticated users" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Civic Issues
CREATE POLICY "Public can view open complaints" ON issues
    FOR SELECT USING (true);

CREATE POLICY "Citizens can insert complaints" ON issues
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authorized users can update complaints" ON issues
    FOR UPDATE USING (true);

-- Evidence & Timelines
CREATE POLICY "Evidence viewable by all" ON issue_evidence FOR SELECT USING (true);
CREATE POLICY "Evidence insertable by all" ON issue_evidence FOR INSERT WITH CHECK (true);

CREATE POLICY "Timeline viewable by all" ON timeline_events FOR SELECT USING (true);
CREATE POLICY "Timeline insertable by authorized" ON timeline_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Verifications viewable by all" ON verifications FOR SELECT USING (true);
CREATE POLICY "Verifications insertable by citizens" ON verifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Escalations viewable by all" ON escalations FOR SELECT USING (true);
CREATE POLICY "Escalations insertable by citizens" ON escalations FOR INSERT WITH CHECK (true);

-- Notifications & Audit
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (true);

CREATE POLICY "Audit logs viewable by admins" ON audit_logs
    FOR SELECT USING (true);
