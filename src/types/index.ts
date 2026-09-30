// ====================================================================
// CivicLens Type Definitions
// ====================================================================

export type UserRole =
  | 'citizen'
  | 'officer'
  | 'field_worker'
  | 'representative'
  | 'admin';

export interface UserProfile {
  id: string;
  auth_user_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  department_id?: string;
  department_name?: string;
  preferred_language: 'en' | 'ta';
  area?: string;
  created_at: string;
  updated_at?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  active: boolean;
  created_at?: string;
}

export interface Jurisdiction {
  id: string;
  name: string;
  name_ta?: string;
  ward_number: string;
  zone: string;
  area_description: string;
  center_lat: number;
  center_lng: number;
  active: boolean;
}

export interface IssueCategory {
  id: string;
  name: string;
  name_ta?: string;
  code: string;
  description: string;
  icon: string;
  default_sla_acknowledgement_hours: number;
  default_sla_resolution_days: number;
  active: boolean;
}

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IssueStatus =
  | 'submitted'
  | 'under_verification'
  | 'assigned'
  | 'acknowledged'
  | 'in_progress'
  | 'awaiting_information'
  | 'resolved'
  | 'reopened'
  | 'escalated'
  | 'closed';

export type EvidenceType =
  | 'citizen_report'
  | 'field_inspection'
  | 'field_completion'
  | 'officer_resolution'
  | 'citizen_reverification';

export interface EvidenceAuthenticity {
  is_ai_generated: boolean;
  ai_probability: number;
  real_probability: number;
  confidence: number;
  verdict: 'real' | 'ai_generated' | 'uncertain';
  engine: string;
  model?: string;
  details?: string;
  analyzed_at: string;
}

export interface IssueEvidence {
  id: string;
  issue_id: string;
  uploaded_by: string;
  uploader_name?: string;
  uploader_role?: UserRole;
  file_path: string; // base64 or URL
  file_type: string;
  evidence_type: EvidenceType;
  caption?: string;
  authenticity?: EvidenceAuthenticity;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  issue_id: string;
  actor_id?: string;
  actor_role: string;
  actor_name: string;
  event_type: string;
  old_status?: IssueStatus;
  new_status?: IssueStatus;
  note?: string;
  evidence_url?: string;
  created_at: string;
}

export type VerificationResult =
  | 'completely_resolved'
  | 'partially_resolved'
  | 'not_resolved';

export interface IssueVerification {
  id: string;
  issue_id: string;
  citizen_id: string;
  citizen_name?: string;
  result: VerificationResult;
  comment?: string;
  new_evidence_url?: string;
  created_at: string;
}

export interface IssueEscalation {
  id: string;
  escalation_code: string;
  issue_id: string;
  raised_by: string;
  raiser_name?: string;
  reason: string;
  details?: string;
  status: 'pending_review' | 'reviewed' | 'escalated_to_commissioner' | 'addressed';
  created_at: string;
  resolved_at?: string;
}

export interface CivicIssue {
  id: string;
  complaint_code: string; // CL-2026-XXXXXX
  citizen_id: string;
  citizen_name: string;
  citizen_phone?: string;
  category_id: string;
  category_name?: string;
  category_code?: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  latitude: number;
  longitude: number;
  location_text: string;
  jurisdiction_id: string;
  jurisdiction_name?: string;
  department_id?: string;
  department_name?: string;
  assigned_officer_id?: string;
  assigned_officer_name?: string;
  assigned_field_worker_id?: string;
  assigned_field_worker_name?: string;
  is_overdue?: boolean;
  sla_target_date?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  evidence: IssueEvidence[];
  timeline: TimelineEvent[];
  verification?: IssueVerification;
  escalations?: IssueEscalation[];
  ai_verification_status?: 'verified_real' | 'flagged_ai' | 'unverified';
}

export type ProjectStatus =
  | 'proposed'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'delayed'
  | 'on_hold';

export interface PublicProject {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  agency: string;
  status: ProjectStatus;
  start_date: string;
  expected_completion: string;
  approved_amount: number;
  expenditure: number;
  funding_source: string;
  source_reference?: string;
  demo_data: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  related_issue_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_email?: string;
  actor_role?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface RoutingRule {
  id: string;
  category_id: string;
  jurisdiction_id?: string;
  department_id: string;
  priority: number;
  active: boolean;
}
