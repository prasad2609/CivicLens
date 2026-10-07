// ====================================================================
// CivicLens Type Definitions - Comprehensive Platform Specification
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
  karma_points?: number;
  volunteer_badges?: string[];
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
  default_department_id?: string;
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
  | 'citizen_reverification'
  | 'durability_audit';

export interface EvidenceAuthenticity {
  is_ai_generated: boolean;
  ai_probability: number;
  real_probability: number;
  confidence: number;
  verdict: 'real' | 'ai_generated' | 'uncertain';
  engine: string;
  model?: string;
  details?: string;
  reasons?: string[];
  metrics?: Record<string, any>;
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
  cryptographic_hash?: string;
  created_at: string;
}

export interface CommunityVouch {
  id?: string;
  issue_id?: string;
  citizen_id?: string;
  citizen_name?: string;
  user_id?: string;
  user_name?: string;
  role?: string;
  vouch_type?: 'confirm_resolved' | 'flag_unresolved';
  comment?: string;
  note?: string;
  vouched_at?: string;
  created_at?: string;
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

export type ResolutionLockStatus =
  | 'open_unresolved'
  | 'pending_citizen_verification'
  | 'reopened_by_citizen'
  | 'verified_and_locked'
  | 'locked_and_verified'
  | 'reopened_under_review';

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
  community_vouches?: CommunityVouch[];
  resolution_lock_status?: ResolutionLockStatus;
  cryptographic_verification_hash?: string;
  asset_id?: string;
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
  progress_pct?: number;
  delay_days?: number;
  related_issue_ids?: string[];
  unit_cost_metric?: string;
  fiscal_health_status?: 'healthy' | 'caution' | 'critical_overrun';
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

// ====================================================================
// 1. CIVIC DNA - Infrastructure Health Memory Types
// ====================================================================

export type AssetType =
  | 'road'
  | 'drain'
  | 'water_pipe'
  | 'streetlight'
  | 'culvert'
  | 'park_facility';

export type AssetCondition =
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'critical';

export interface AssetRepairRecord {
  id: string;
  asset_id: string;
  issue_id?: string;
  date: string;
  description: string;
  contractor_name: string;
  cost: number;
  technique: string;
  warranty_end_date: string;
  durability_status: 'holding' | 'minor_wear' | 'failed';
}

export interface AssetRecommendation {
  type: 'patch' | 'rebuild_recommended' | 'preventive_monitoring' | 'urgent_replacement';
  reason: string;
  estimated_rebuild_cost: number;
  cumulative_patch_cost: number;
  projected_3yr_savings: number;
}

export interface InfrastructureAsset {
  id: string;
  asset_code: string;
  name: string;
  asset_type: AssetType;
  ward_id: string;
  ward_name: string;
  location_text: string;
  latitude: number;
  longitude: number;
  commissioned_year: number;
  expected_lifespan_years: number;
  initial_valuation: number;
  replacement_cost: number;
  cumulative_repair_cost: number;
  rebuild_threshold_pct: number;
  health_score: number; // 0 - 100
  fatigue_index: number; // 0.0 - 1.0 (structural wear)
  condition: AssetCondition;
  failure_count: number;
  mean_time_between_failures_days: number;
  days_until_predicted_failure: number;
  recommendation: AssetRecommendation;
  repair_history: AssetRepairRecord[];
  related_issue_ids: string[];
}

// ====================================================================
// 2. CIVIC TIME MACHINE Types
// ====================================================================

export type TimeMachinePhase =
  | 'before'
  | 'during'
  | 'after'
  | '30_day_check'
  | '180_day_check';

export interface TimeMachineSnapshot {
  phase: TimeMachinePhase;
  title: string;
  date: string;
  photo_url: string;
  notes: string;
  recorded_by: string;
  status_label: string;
  durability_score?: number; // 1 - 100
}

export interface TimeMachineLocationRecord {
  id: string;
  location_title: string;
  ward_id: string;
  ward_name: string;
  latitude: number;
  longitude: number;
  category_name: string;
  related_issue_id?: string;
  related_asset_id?: string;
  snapshots: TimeMachineSnapshot[];
  durability_verdict: string;
  durability_rating: number; // 1 to 5 stars
  inspected_at: string;
}

// ====================================================================
// 3. CIVIC VOLUNTEER SWARM MODE Types
// ====================================================================

export type SwarmMissionStatus =
  | 'open'
  | 'in_progress'
  | 'completed'
  | 'verified';

export type SwarmMissionType =
  | 'tree_plantation'
  | 'drain_spot_check'
  | 'cleanup_drive'
  | 'pothole_temporary_coldmix'
  | 'park_revival'
  | 'flood_sandbag_assist';

export interface SwarmParticipant {
  user_id: string;
  user_name: string;
  joined_at: string;
  role: 'lead' | 'volunteer' | 'spotter';
  attended: boolean;
}

export interface SwarmProof {
  id: string;
  uploaded_by: string;
  uploader_name: string;
  photo_url: string;
  note: string;
  latitude: number;
  longitude: number;
  uploaded_at: string;
  upvotes: number;
}

export interface VolunteerSwarmMission {
  id: string;
  title: string;
  description: string;
  mission_type: SwarmMissionType;
  ward_id: string;
  ward_name: string;
  location_text: string;
  latitude: number;
  longitude: number;
  target_volunteers: number;
  karma_points_reward: number;
  status: SwarmMissionStatus;
  scheduled_date: string;
  organized_by: string;
  participants: SwarmParticipant[];
  proofs: SwarmProof[];
  community_confirmations: number;
  related_issue_id?: string;
}

export interface VolunteerBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned_at: string;
}

export interface VolunteerLeaderboardEntry {
  user_id: string;
  full_name: string;
  area: string;
  karma_points: number;
  missions_completed: number;
  badges: VolunteerBadge[];
  rank: number;
}

// ====================================================================
// 4. CIVIC ACCOUNTABILITY GENOME Types
// ====================================================================

export interface GenomicTrait {
  key: string;
  label: string;
  score: number; // 0 - 100
  benchmark: number;
  trend: 'improving' | 'stable' | 'declining';
  description: string;
}

export interface ConstituencyGenome {
  ward_id: string;
  ward_name: string;
  zone: string;
  overall_governance_score: number; // 0 - 100
  governance_grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
  traits: {
    responseReflex: GenomicTrait;
    resolutionFidelity: GenomicTrait;
    citizenVerificationTrust: GenomicTrait;
    infrastructureResilience: GenomicTrait;
    recurrenceImmunity: GenomicTrait;
    fiscalExecutionSpeed: GenomicTrait;
  };
  historical_evolution: Array<{ quarter: string; score: number }>;
  policy_prescription: string[];
}

// ====================================================================
// 7. EVIDENCE-BASED AUTHORITY PERFORMANCE & PROMOTION INDEX (EBAPI) Types
// ====================================================================

export type OfficerPromotionStatus =
  | 'Fast-Track Promotion Recommended'
  | 'Eligible for Seniority Promotion'
  | 'Promotion Deferred - Performance Review'
  | 'Promotion Frozen - Under Investigation';

export interface PromotionalMilestone {
  date: string;
  title: string;
  note: string;
  status: 'completed' | 'in_progress' | 'pending';
}

export interface OfficerPerformanceScorecard {
  officer_id: string;
  officer_name: string;
  employee_id: string;
  designation: string;
  department_id: string;
  department_name: string;
  department_code: string;
  ward_jurisdiction: string;
  years_in_current_cadre: number;
  composite_index: number; // 0 - 100 Individual Score
  rank: number;
  total_assigned: number;
  total_resolved: number;
  on_time_resolution_count: number;
  sla_compliance_pct: number;
  avg_resolution_days: number;
  verified_resolution_pct: number;
  citizen_reopened_count: number;
  reopening_rate_pct: number;
  field_evidence_authenticity_score: number; // 0 - 100
  citizen_satisfaction_rating: number; // 1.0 - 5.0
  durability_rate_pct: number;
  recurring_failure_penalty: number;
  weights_breakdown: {
    sla_score: number; // 30% max
    speed_score: number; // 20% max
    citizen_trust_score: number; // 20% max
    durability_score: number; // 20% max
    evidence_authenticity_score: number; // 10% max
    recurring_penalty: number; // deduction
  };
  // Career Advancement & Promotion Matrix
  promotion_eligibility: OfficerPromotionStatus;
  next_promotion_cadre: string;
  promotion_readiness_score: number; // 0 - 100
  merit_points: number;
  appraisal_cycle: string;
  performance_tier: 'Exemplary' | 'Competent' | 'Needs Improvement' | 'Unsatisfactory';
  appraisal_citation: string;
  promotional_milestones: PromotionalMilestone[];
  strengths: string[];
  areas_for_growth: string[];
  actionable_recommendations: string[];
}

export interface DepartmentScorecard {
  department_id: string;
  department_name: string;
  department_code: string;
  composite_index: number; // 0 - 100
  rank: number;
  total_assigned: number;
  sla_compliance_pct: number;
  avg_resolution_days: number;
  verified_resolution_pct: number;
  reopening_rate_pct: number;
  durability_rate_pct: number;
  recurring_failure_penalty: number;
  weights_breakdown: {
    sla_score: number;
    speed_score: number;
    citizen_trust_score: number;
    durability_score: number;
    reopening_penalty: number;
  };
  performance_status: 'Exemplary' | 'Satisfactory' | 'Needs Improvement' | 'Critical Intervention';
  actionable_recommendations: string[];
}

export interface PromotionSummary {
  total_officers_evaluated: number;
  fast_track_promotable: number;
  eligible_for_promotion: number;
  deferred_count: number;
  frozen_count: number;
}

export interface AuthorityIndexResponse {
  generated_at: string;
  formula_explanation: string;
  officer_scorecards: OfficerPerformanceScorecard[];
  scorecards: DepartmentScorecard[];
  promotion_summary?: PromotionSummary;
}

// ====================================================================
// 9. RECURRING FAILURE CLUSTER Types
// ====================================================================

export interface RecurringFailureCluster {
  clusterKey: string;
  categoryName: string;
  categoryId: string;
  locationName: string;
  latitude: number;
  longitude: number;
  occurrenceCount: number;
  firstReported: string;
  latestReported: string;
  currentActiveCount: number;
  cumulative_repair_cost: number;
  replacement_cost_estimate: number;
  root_cause_diagnosis: string;
  replacement_recommendation: string;
  potential_savings: number;
  contractor_warranty_breach: boolean;
  contractor_name?: string;
  related_asset_id?: string;
  issues: CivicIssue[];
}
