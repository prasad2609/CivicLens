import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { queryPg, isPgConfigured } from './pgPool';
import {
  CivicIssue,
  UserProfile,
  Department,
  Jurisdiction,
  IssueCategory,
  PublicProject,
  RoutingRule,
  AuditLog,
  AppNotification,
  IssueStatus,
  IssueSeverity,
  VerificationResult,
  UserRole,
  EvidenceAuthenticity,
  InfrastructureAsset,
  AssetRepairRecord,
  TimeMachineLocationRecord,
  TimeMachineSnapshot,
  VolunteerSwarmMission,
  VolunteerLeaderboardEntry,
  ConstituencyGenome,
  DepartmentScorecard,
  AuthorityIndexResponse,
  RecurringFailureCluster,
} from '@/types';
import {
  INITIAL_ISSUES,
  INITIAL_DEPARTMENTS,
  INITIAL_JURISDICTIONS,
  INITIAL_CATEGORIES,
  INITIAL_ROUTING_RULES,
  INITIAL_PROJECTS,
  DEMO_USERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from '@/data/mockData';
import {
  INITIAL_INFRASTRUCTURE_ASSETS,
  INITIAL_TIME_MACHINE_RECORDS,
  INITIAL_SWARM_MISSIONS,
  INITIAL_VOLUNTEER_LEADERBOARD,
  INITIAL_CONSTITUENCY_GENOMES,
} from '@/data/civicIntelligenceData';

export interface DatabaseState {
  users: (UserProfile & { password_hash?: string })[];
  departments: Department[];
  jurisdictions: Jurisdiction[];
  categories: IssueCategory[];
  routingRules: RoutingRule[];
  issues: CivicIssue[];
  projects: PublicProject[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  assets: InfrastructureAsset[];
  timeMachineRecords: TimeMachineLocationRecord[];
  swarmMissions: VolunteerSwarmMission[];
  volunteerLeaderboard: VolunteerLeaderboardEntry[];
  genomes: Record<string, ConstituencyGenome>;
}

const DB_PATH = path.join(process.cwd(), 'src', 'data', 'server_db.json');

// Distance calculation using Haversine formula (meters)
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

class ServerDatabase {
  private static instance: ServerDatabase;
  private state: DatabaseState | null = null;

  private constructor() {
    this.load();
  }

  public static getInstance(): ServerDatabase {
    if (!ServerDatabase.instance) {
      ServerDatabase.instance = new ServerDatabase();
    }
    return ServerDatabase.instance;
  }

  private load(): DatabaseState {
    if (this.state) return this.state;

    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.state = JSON.parse(raw);
        let modified = false;
        if (!this.state!.assets || this.state!.assets.length === 0) {
          this.state!.assets = [...INITIAL_INFRASTRUCTURE_ASSETS];
          modified = true;
        }
        if (!this.state!.timeMachineRecords || this.state!.timeMachineRecords.length === 0) {
          this.state!.timeMachineRecords = [...INITIAL_TIME_MACHINE_RECORDS];
          modified = true;
        }
        if (!this.state!.swarmMissions || this.state!.swarmMissions.length === 0) {
          this.state!.swarmMissions = [...INITIAL_SWARM_MISSIONS];
          modified = true;
        }
        if (!this.state!.volunteerLeaderboard || this.state!.volunteerLeaderboard.length === 0) {
          this.state!.volunteerLeaderboard = [...INITIAL_VOLUNTEER_LEADERBOARD];
          modified = true;
        }
        if (!this.state!.genomes || Object.keys(this.state!.genomes).length === 0) {
          this.state!.genomes = { ...INITIAL_CONSTITUENCY_GENOMES };
          modified = true;
        }
        if (modified) {
          this.save();
        }
        return this.state!;
      }
    } catch (e) {
      console.error('Failed to read server_db.json, re-initializing with seed data', e);
    }

    // Default Seed State
    this.state = {
      users: DEMO_USERS.map((u) => ({
        ...u,
        password_hash: 'civiclens123', // Demo default password
      })),
      departments: [...INITIAL_DEPARTMENTS],
      jurisdictions: [...INITIAL_JURISDICTIONS],
      categories: [...INITIAL_CATEGORIES],
      routingRules: [...INITIAL_ROUTING_RULES],
      issues: [...INITIAL_ISSUES],
      projects: [...INITIAL_PROJECTS],
      notifications: [...INITIAL_NOTIFICATIONS],
      auditLogs: [...INITIAL_AUDIT_LOGS],
      assets: [...INITIAL_INFRASTRUCTURE_ASSETS],
      timeMachineRecords: [...INITIAL_TIME_MACHINE_RECORDS],
      swarmMissions: [...INITIAL_SWARM_MISSIONS],
      volunteerLeaderboard: [...INITIAL_VOLUNTEER_LEADERBOARD],
      genomes: { ...INITIAL_CONSTITUENCY_GENOMES },
    };

    this.save();
    return this.state;
  }

  private save() {
    if (!this.state) return;
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write to server_db.json', e);
    }
  }

  public async syncIssueToSupabase(issue: CivicIssue): Promise<void> {
    if (!isPgConfigured) return;
    try {
      await queryPg(
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

      if (issue.evidence && Array.isArray(issue.evidence)) {
        for (const ev of issue.evidence) {
          await queryPg(
            `INSERT INTO issue_evidence (id, issue_id, uploaded_by, file_path, file_type, evidence_type, caption, authenticity, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO UPDATE SET authenticity = EXCLUDED.authenticity;`,
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
        }
      }

      if (issue.verification) {
        const v = issue.verification;
        await queryPg(
          `INSERT INTO verifications (id, issue_id, citizen_id, result, comment, new_evidence_url, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET result = EXCLUDED.result, comment = EXCLUDED.comment;`,
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
      }
    } catch (e) {
      console.error('Background sync to Supabase failed:', e);
    }
  }

  // --- Auth / Users ---
  public findUserByEmail(email: string) {
    const s = this.load();
    return s.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string) {
    const s = this.load();
    return s.users.find((u) => u.id === id);
  }

  public createUser(userData: {
    full_name: string;
    email: string;
    password?: string;
    phone?: string;
    role?: UserRole;
    preferred_language?: 'en' | 'ta';
    area?: string;
  }) {
    const s = this.load();
    const existing = this.findUserByEmail(userData.email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser: UserProfile & { password_hash?: string } = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      full_name: userData.full_name,
      email: userData.email.toLowerCase(),
      phone: userData.phone || '',
      role: userData.role || 'citizen',
      preferred_language: userData.preferred_language || 'en',
      area: userData.area || 'Ward 175 - Velachery',
      created_at: new Date().toISOString(),
      password_hash: userData.password || 'civiclens123',
    };

    s.users.push(newUser);
    this.addAuditLogInternal(s, {
      action: 'REGISTER_USER',
      entity_type: 'USER',
      entity_id: newUser.id,
      actor_email: newUser.email,
      actor_role: newUser.role,
      metadata: { full_name: newUser.full_name, area: newUser.area },
    });

    this.save();
    const { password_hash, ...profile } = newUser;
    return profile;
  }

  public updateUser(
    id: string,
    updates: Partial<UserProfile> & { password?: string }
  ) {
    const s = this.load();
    const userIndex = s.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found.');
    }

    const current = s.users[userIndex];
    const updated: UserProfile & { password_hash?: string } = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.password) {
      updated.password_hash = updates.password;
    }

    s.users[userIndex] = updated;
    this.addAuditLogInternal(s, {
      action: 'UPDATE_PROFILE',
      entity_type: 'USER',
      entity_id: id,
      actor_email: current.email,
      actor_role: current.role,
      metadata: { fields: Object.keys(updates) },
    });

    this.save();
    const { password_hash, ...profile } = updated;
    return profile;
  }

  public getUsers(): UserProfile[] {
    return this.load().users.map(({ password_hash, ...u }) => u);
  }

  public getUserById(id: string): UserProfile | undefined {
    const user = this.load().users.find((u) => u.id === id);
    if (!user) return undefined;
    const { password_hash, ...profile } = user;
    return profile;
  }

  // --- Issues Management ---
  public getIssues(filters?: {
    role?: UserRole;
    citizenId?: string;
    departmentId?: string;
    fieldWorkerId?: string;
    status?: IssueStatus;
    severity?: IssueSeverity;
    categoryId?: string;
    jurisdictionId?: string;
    search?: string;
  }): CivicIssue[] {
    const s = this.load();
    let result = [...s.issues];

    if (filters) {
      if (filters.citizenId) {
        result = result.filter((i) => i.citizen_id === filters.citizenId);
      }
      if (filters.departmentId) {
        result = result.filter((i) => i.department_id === filters.departmentId);
      }
      if (filters.fieldWorkerId) {
        result = result.filter((i) => i.assigned_field_worker_id === filters.fieldWorkerId);
      }
      if (filters.status) {
        result = result.filter((i) => i.status === filters.status);
      }
      if (filters.severity) {
        result = result.filter((i) => i.severity === filters.severity);
      }
      if (filters.categoryId) {
        result = result.filter((i) => i.category_id === filters.categoryId);
      }
      if (filters.jurisdictionId) {
        result = result.filter((i) => i.jurisdiction_id === filters.jurisdictionId);
      }
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        result = result.filter(
          (i) =>
            i.complaint_code.toLowerCase().includes(query) ||
            i.title.toLowerCase().includes(query) ||
            i.location_text.toLowerCase().includes(query) ||
            (i.category_name && i.category_name.toLowerCase().includes(query)) ||
            (i.department_name && i.department_name.toLowerCase().includes(query))
        );
      }
    }

    return result.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getIssueById(idOrCode: string): CivicIssue | undefined {
    const s = this.load();
    return s.issues.find(
      (i) => i.id === idOrCode || i.complaint_code.toLowerCase() === idOrCode.toLowerCase()
    );
  }

  public createIssue(
    data: {
      title: string;
      description: string;
      categoryId: string;
      severity: IssueSeverity;
      latitude: number;
      longitude: number;
      locationText: string;
      jurisdictionId: string;
      photoDataUrl?: string;
      photoCaption?: string;
      authenticity?: EvidenceAuthenticity;
    },
    citizen: UserProfile
  ): CivicIssue {
    if (data.authenticity?.is_ai_generated) {
      throw new Error(
        'Complaint rejected: The attached photograph was detected as AI-generated/synthetic. Only authentic camera photos can be submitted.'
      );
    }

    const s = this.load();
    const nextSeq = s.issues.length + 101;
    const complaintCode = `CL-2026-${String(nextSeq).padStart(6, '0')}`;
    const category = s.categories.find((c) => c.id === data.categoryId);
    const jurisdiction = s.jurisdictions.find((j) => j.id === data.jurisdictionId);

    // Smart routing
    const routing = this.routeComplaintInternal(s, data.categoryId, data.jurisdictionId);

    // Calculate SLA
    const slaDays = category?.default_sla_resolution_days || 7;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + slaDays);

    const issueId = `issue-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const evidenceList = [];
    if (data.photoDataUrl) {
      evidenceList.push({
        id: `ev-${Date.now()}`,
        issue_id: issueId,
        uploaded_by: citizen.id,
        uploader_name: citizen.full_name,
        uploader_role: citizen.role,
        file_path: data.photoDataUrl,
        file_type: 'image/jpeg',
        evidence_type: 'citizen_report' as const,
        caption: data.photoCaption || 'Citizen reported photograph',
        authenticity: data.authenticity,
        created_at: nowIso,
      });
    }

    const newIssue: CivicIssue = {
      id: issueId,
      complaint_code: complaintCode,
      citizen_id: citizen.id,
      citizen_name: citizen.full_name,
      citizen_phone: citizen.phone,
      category_id: data.categoryId,
      category_name: category?.name,
      category_code: category?.code,
      title: data.title,
      description: data.description,
      severity: data.severity,
      status: 'assigned', // Automatically routed & assigned to department
      latitude: data.latitude,
      longitude: data.longitude,
      location_text: data.locationText,
      jurisdiction_id: data.jurisdictionId,
      jurisdiction_name: jurisdiction?.name,
      department_id: routing.departmentId,
      department_name: routing.departmentName,
      is_overdue: false,
      sla_target_date: targetDate.toISOString(),
      created_at: nowIso,
      updated_at: nowIso,
      evidence: evidenceList,
      ai_verification_status: data.authenticity
        ? data.authenticity.is_ai_generated
          ? 'flagged_ai'
          : 'verified_real'
        : 'unverified',
      timeline: [
        {
          id: `t-${Date.now()}-1`,
          issue_id: issueId,
          actor_id: citizen.id,
          actor_name: citizen.full_name,
          actor_role: 'citizen',
          event_type: 'SUBMITTED',
          new_status: 'submitted',
          note: `Citizen registered civic issue with severity level: ${data.severity.toUpperCase()}.`,
          created_at: nowIso,
        },
        {
          id: `t-${Date.now()}-2`,
          issue_id: issueId,
          actor_name: 'CivicLens Smart Routing Engine',
          actor_role: 'system',
          event_type: 'AUTO_ROUTED',
          old_status: 'submitted',
          new_status: 'assigned',
          note: `Auto-routed to ${routing.departmentName} (${routing.ruleMatch}). Target SLA: ${slaDays} days.`,
          created_at: nowIso,
        },
      ],
    };

    s.issues.unshift(newIssue);

    this.addAuditLogInternal(s, {
      action: 'CREATE_ISSUE',
      entity_type: 'ISSUE',
      entity_id: newIssue.id,
      actor_email: citizen.email,
      actor_role: citizen.role,
      metadata: { complaint_code: complaintCode, category: category?.name, severity: data.severity },
    });

    this.addNotificationInternal(s, {
      user_id: citizen.id,
      title: `Complaint Submitted: ${complaintCode}`,
      message: `Your report "${data.title.slice(0, 40)}..." has been received and routed to ${routing.departmentName}.`,
      related_issue_id: newIssue.id,
    });

    this.save();
    this.syncIssueToSupabase(newIssue).catch((err) => console.error('Supabase async sync error:', err));
    return newIssue;
  }

  public updateIssueStatus(
    issueId: string,
    newStatus: IssueStatus,
    note?: string,
    actor?: UserProfile,
    evidenceUrl?: string
  ): CivicIssue {
    const s = this.load();
    const issue = s.issues.find((i) => i.id === issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    const oldStatus = issue.status;
    const nowIso = new Date().toISOString();
    issue.status = newStatus;
    issue.updated_at = nowIso;

    if (newStatus === 'resolved') {
      issue.resolved_at = nowIso;
    } else if (newStatus === 'closed') {
      issue.closed_at = nowIso;
    }

    const actorName = actor?.full_name || 'System Administrator';
    const actorRole = actor?.role || 'admin';

    issue.timeline.push({
      id: `t-${Date.now()}`,
      issue_id: issueId,
      actor_id: actor?.id,
      actor_name: actorName,
      actor_role: actorRole,
      event_type: `STATUS_CHANGE_TO_${newStatus.toUpperCase()}`,
      old_status: oldStatus,
      new_status: newStatus,
      note: note || `Status transitioned from ${oldStatus} to ${newStatus}.`,
      evidence_url: evidenceUrl,
      created_at: nowIso,
    });

    if (evidenceUrl) {
      issue.evidence.push({
        id: `ev-${Date.now()}`,
        issue_id: issueId,
        uploaded_by: actor?.id || 'admin',
        uploader_name: actorName,
        uploader_role: actorRole as UserRole,
        file_path: evidenceUrl,
        file_type: 'image/jpeg',
        evidence_type:
          actorRole === 'field_worker'
            ? 'field_completion'
            : actorRole === 'officer'
            ? 'officer_resolution'
            : 'citizen_report',
        caption: note || 'Status update evidence photograph',
        created_at: nowIso,
      });
    }

    this.addAuditLogInternal(s, {
      action: 'UPDATE_STATUS',
      entity_type: 'ISSUE',
      entity_id: issue.id,
      actor_email: actor?.email,
      actor_role: actorRole,
      metadata: { old_status: oldStatus, new_status: newStatus, note },
    });

    // Notify citizen
    if (newStatus === 'resolved') {
      this.addNotificationInternal(s, {
        user_id: issue.citizen_id,
        title: `Resolution Verification: ${issue.complaint_code}`,
        message: `The department has marked "${issue.title.slice(0, 35)}..." as resolved. Please verify if the problem is genuinely fixed.`,
        related_issue_id: issue.id,
      });
    } else {
      this.addNotificationInternal(s, {
        user_id: issue.citizen_id,
        title: `Status Updated: ${issue.complaint_code}`,
        message: `Your complaint status has changed to "${newStatus.replace('_', ' ').toUpperCase()}".`,
        related_issue_id: issue.id,
      });
    }

    this.save();
    this.syncIssueToSupabase(issue).catch((err) => console.error('Supabase async sync error:', err));
    return issue;
  }

  public assignFieldWorker(
    issueId: string,
    fieldWorkerId: string,
    note?: string,
    actor?: UserProfile
  ): CivicIssue {
    const s = this.load();
    const issue = s.issues.find((i) => i.id === issueId);
    if (!issue) throw new Error('Issue not found');

    const worker = s.users.find((u) => u.id === fieldWorkerId);
    issue.assigned_field_worker_id = fieldWorkerId;
    issue.assigned_field_worker_name = worker?.full_name || 'Field Technician';
    issue.status = 'in_progress';
    issue.updated_at = new Date().toISOString();

    const actorName = actor?.full_name || 'Department Officer';

    issue.timeline.push({
      id: `t-${Date.now()}`,
      issue_id: issueId,
      actor_id: actor?.id,
      actor_name: actorName,
      actor_role: actor?.role || 'officer',
      event_type: 'FIELD_WORKER_ASSIGNED',
      new_status: 'in_progress',
      note: note || `Dispatched to field technician ${issue.assigned_field_worker_name} for ground intervention.`,
      created_at: new Date().toISOString(),
    });

    this.addNotificationInternal(s, {
      user_id: fieldWorkerId,
      title: `New Field Assignment: ${issue.complaint_code}`,
      message: `You have been assigned to inspect and rectify "${issue.title.slice(0, 40)}..." at ${issue.location_text}.`,
      related_issue_id: issue.id,
    });

    this.addNotificationInternal(s, {
      user_id: issue.citizen_id,
      title: `Field Worker Dispatched: ${issue.complaint_code}`,
      message: `Field technician ${issue.assigned_field_worker_name} has been assigned to work on your complaint.`,
      related_issue_id: issue.id,
    });

    this.addAuditLogInternal(s, {
      action: 'ASSIGN_FIELD_WORKER',
      entity_type: 'ISSUE',
      entity_id: issue.id,
      actor_email: actor?.email,
      actor_role: actor?.role,
      metadata: { field_worker_id: fieldWorkerId, worker_name: issue.assigned_field_worker_name },
    });

    this.save();
    this.syncIssueToSupabase(issue).catch((err) => console.error('Supabase async sync error:', err));
    return issue;
  }

  public submitFieldWork(
    issueId: string,
    notes: string,
    photoDataUrl?: string,
    isCompleted: boolean = false,
    worker?: UserProfile
  ): CivicIssue {
    const s = this.load();
    const issue = s.issues.find((i) => i.id === issueId);
    if (!issue) throw new Error('Issue not found');

    const nowIso = new Date().toISOString();
    issue.updated_at = nowIso;
    const workerName = worker?.full_name || 'Field Technician';

    if (photoDataUrl) {
      issue.evidence.push({
        id: `ev-${Date.now()}`,
        issue_id: issueId,
        uploaded_by: worker?.id || 'field-worker',
        uploader_name: workerName,
        uploader_role: 'field_worker',
        file_path: photoDataUrl,
        file_type: 'image/jpeg',
        evidence_type: isCompleted ? 'field_completion' : 'field_inspection',
        caption: notes,
        created_at: nowIso,
      });
    }

    issue.timeline.push({
      id: `t-${Date.now()}`,
      issue_id: issueId,
      actor_id: worker?.id,
      actor_name: workerName,
      actor_role: 'field_worker',
      event_type: isCompleted ? 'FIELD_WORK_COMPLETED' : 'FIELD_WORK_PROGRESS',
      note: isCompleted
        ? `Field work marked completed by technician. Submitted to Officer for resolution review. Notes: ${notes}`
        : `Field update: ${notes}`,
      evidence_url: photoDataUrl,
      created_at: nowIso,
    });

    this.addAuditLogInternal(s, {
      action: isCompleted ? 'FIELD_WORK_COMPLETED' : 'FIELD_WORK_UPDATE',
      entity_type: 'ISSUE',
      entity_id: issue.id,
      actor_email: worker?.email,
      actor_role: 'field_worker',
      metadata: { isCompleted, notes },
    });

    if (issue.assigned_officer_id) {
      this.addNotificationInternal(s, {
        user_id: issue.assigned_officer_id,
        title: `Field Work Report: ${issue.complaint_code}`,
        message: `${workerName} has updated task status: "${notes.slice(0, 45)}...".`,
        related_issue_id: issue.id,
      });
    }

    this.save();
    this.syncIssueToSupabase(issue).catch((err) => console.error('Supabase async sync error:', err));
    return issue;
  }

  public verifyResolution(
    issueId: string,
    result: VerificationResult,
    comment: string,
    newEvidenceUrl?: string,
    citizen?: UserProfile
  ): CivicIssue {
    const s = this.load();
    const issue = s.issues.find((i) => i.id === issueId);
    if (!issue) throw new Error('Issue not found');

    const nowIso = new Date().toISOString();
    const citizenName = citizen?.full_name || issue.citizen_name;
    const citizenId = citizen?.id || issue.citizen_id;

    // Tamper-proof cryptographic SHA-256 seal
    const sealPayload = `${issueId}:${result}:${citizenId}:${nowIso}:${comment || 'none'}`;
    const cryptographicHash = '0x' + crypto.createHash('sha256').update(sealPayload).digest('hex');

    const verificationRecord = {
      id: `v-${Date.now()}`,
      issue_id: issueId,
      citizen_id: citizenId,
      citizen_name: citizenName,
      result: result,
      comment: comment,
      new_evidence_url: newEvidenceUrl,
      cryptographic_hash: cryptographicHash,
      created_at: nowIso,
    };

    issue.verification = verificationRecord;
    issue.cryptographic_verification_hash = cryptographicHash;
    issue.resolution_lock_status =
      result === 'completely_resolved' ? 'locked_and_verified' : 'reopened_under_review';
    issue.updated_at = nowIso;

    if (result === 'completely_resolved') {
      issue.status = 'closed';
      issue.closed_at = nowIso;

      issue.timeline.push({
        id: `t-${Date.now()}`,
        issue_id: issueId,
        actor_id: citizenId,
        actor_name: citizenName,
        actor_role: 'citizen',
        event_type: 'CITIZEN_VERIFIED_CLOSED',
        old_status: 'resolved',
        new_status: 'closed',
        note: `Citizen verified: "Completely Resolved". Cryptographic seal: ${cryptographicHash.slice(0, 16)}... Feedback: "${comment || 'Verified and confirmed safe.'}". Complaint officially closed & locked.`,
        created_at: nowIso,
      });

      this.addAuditLogInternal(s, {
        action: 'VERIFY_RESOLUTION_ACCEPTED',
        entity_type: 'ISSUE',
        entity_id: issue.id,
        actor_email: citizen?.email,
        actor_role: 'citizen',
        metadata: { result, comment, cryptographic_hash: cryptographicHash },
      });
    } else {
      // Reopen complaint
      issue.status = 'reopened';

      if (newEvidenceUrl) {
        issue.evidence.push({
          id: `ev-${Date.now()}`,
          issue_id: issueId,
          uploaded_by: citizenId,
          uploader_name: citizenName,
          uploader_role: 'citizen',
          file_path: newEvidenceUrl,
          file_type: 'image/jpeg',
          evidence_type: 'citizen_reverification',
          caption: `Citizen verification rebuttal photo: ${comment}`,
          created_at: nowIso,
        });
      }

      issue.timeline.push({
        id: `t-${Date.now()}`,
        issue_id: issueId,
        actor_id: citizenId,
        actor_name: citizenName,
        actor_role: 'citizen',
        event_type: 'CITIZEN_REOPENED_ISSUE',
        old_status: 'resolved',
        new_status: 'reopened',
        note: `Citizen rejected resolution (${result === 'partially_resolved' ? 'Partially Resolved' : 'Not Resolved'}). Ground note: "${comment}". Ticket reopened for corrective action.`,
        evidence_url: newEvidenceUrl,
        created_at: nowIso,
      });

      this.addAuditLogInternal(s, {
        action: 'VERIFY_RESOLUTION_REJECTED',
        entity_type: 'ISSUE',
        entity_id: issue.id,
        actor_email: citizen?.email,
        actor_role: 'citizen',
        metadata: { result, comment },
      });

      this.addNotificationInternal(s, {
        user_id: 'user-officer-roads',
        title: `COMPLAINT REOPENED: ${issue.complaint_code}`,
        message: `Citizen verified that "${issue.title.slice(0, 35)}..." was NOT properly resolved. Reopened for immediate re-intervention.`,
        related_issue_id: issue.id,
      });
    }

    this.save();
    this.syncIssueToSupabase(issue).catch((err) => console.error('Supabase async sync error:', err));
    return issue;
  }

  public vouchIssueResolution(
    issueId: string,
    user: UserProfile,
    comment?: string
  ): CivicIssue {
    const s = this.load();
    const issue = s.issues.find((i) => i.id === issueId);
    if (!issue) throw new Error('Issue not found');

    if (!issue.community_vouches) {
      issue.community_vouches = [];
    }

    const nowIso = new Date().toISOString();
    const existingIndex = issue.community_vouches.findIndex((v) => v.user_id === user.id);

    if (existingIndex >= 0) {
      issue.community_vouches[existingIndex].comment =
        comment || issue.community_vouches[existingIndex].comment;
      issue.community_vouches[existingIndex].vouched_at = nowIso;
    } else {
      issue.community_vouches.push({
        user_id: user.id,
        user_name: user.full_name,
        role: user.role,
        vouched_at: nowIso,
        comment: comment || 'Verified on-site: resolution is intact and durable.',
      });
    }

    issue.updated_at = nowIso;

    this.addAuditLogInternal(s, {
      action: 'COMMUNITY_VOUCH',
      entity_type: 'ISSUE',
      entity_id: issue.id,
      actor_email: user.email,
      actor_role: user.role,
      metadata: { total_vouches: issue.community_vouches.length, comment },
    });

    this.save();
    return issue;
  }

  public escalateIssue(
    issueId: string,
    reason: string,
    details?: string,
    citizen?: UserProfile
  ): CivicIssue {
    const s = this.load();
    const issue = s.issues.find((i) => i.id === issueId);
    if (!issue) throw new Error('Issue not found');

    const nowIso = new Date().toISOString();
    const escalationCode = `ESC-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const raiserName = citizen?.full_name || issue.citizen_name;
    const raiserId = citizen?.id || issue.citizen_id;

    const escRecord = {
      id: `esc-${Date.now()}`,
      escalation_code: escalationCode,
      issue_id: issueId,
      raised_by: raiserId,
      raiser_name: raiserName,
      reason: reason,
      details: details,
      status: 'escalated_to_commissioner' as const,
      created_at: nowIso,
    };

    if (!issue.escalations) issue.escalations = [];
    issue.escalations.push(escRecord);

    const oldStatus = issue.status;
    issue.status = 'escalated';
    issue.is_overdue = true;
    issue.updated_at = nowIso;

    issue.timeline.push({
      id: `t-${Date.now()}`,
      issue_id: issueId,
      actor_id: raiserId,
      actor_name: raiserName,
      actor_role: citizen?.role || 'citizen',
      event_type: 'ESCALATION_TRIGGERED',
      old_status: oldStatus,
      new_status: 'escalated',
      note: `Escalated (${escalationCode}). Reason: "${reason}". Transferred to Zonal Commissioner & Representative Oversight.`,
      created_at: nowIso,
    });

    this.addAuditLogInternal(s, {
      action: 'ESCALATE_ISSUE',
      entity_type: 'ISSUE',
      entity_id: issue.id,
      actor_email: citizen?.email,
      actor_role: citizen?.role,
      metadata: { escalation_code: escalationCode, reason, details },
    });

    this.addNotificationInternal(s, {
      user_id: 'user-representative-mla',
      title: `Escalation Alert: ${issue.complaint_code}`,
      message: `Citizen escalated complaint regarding "${issue.title.slice(0, 35)}..." (${reason}).`,
      related_issue_id: issue.id,
    });

    this.save();
    this.syncIssueToSupabase(issue).catch((err) => console.error('Supabase async sync error:', err));
    return issue;
  }

  // --- Duplicate Detection ---
  public findPotentialDuplicates(
    categoryId: string,
    lat: number,
    lng: number,
    radiusMeters: number = 300
  ): CivicIssue[] {
    const s = this.load();
    return s.issues.filter((issue) => {
      if (issue.category_id !== categoryId) return false;
      if (['closed'].includes(issue.status)) return false;

      const dist = calculateDistanceMeters(lat, lng, issue.latitude, issue.longitude);
      return dist <= radiusMeters;
    });
  }

  // --- Spatial Recurring Issues Clustering & Failure Intelligence ---
  public getRecurringIssues(): RecurringFailureCluster[] {
    const s = this.load();
    const clusters: Array<{
      categoryName: string;
      categoryId: string;
      locationName: string;
      latitude: number;
      longitude: number;
      issues: CivicIssue[];
    }> = [];

    s.issues.forEach((issue) => {
      const matched = clusters.find(
        (c) =>
          c.categoryId === issue.category_id &&
          calculateDistanceMeters(c.latitude, c.longitude, issue.latitude, issue.longitude) <= 400
      );

      if (matched) {
        matched.issues.push(issue);
      } else {
        clusters.push({
          categoryName: issue.category_name || 'Civic Issue',
          categoryId: issue.category_id,
          locationName: issue.location_text,
          latitude: issue.latitude,
          longitude: issue.longitude,
          issues: [issue],
        });
      }
    });

    return clusters
      .filter((c) => c.issues.length >= 2)
      .map((c, idx) => {
        const sorted = [...c.issues].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const activeCount = c.issues.filter((i) => i.status !== 'closed').length;
        const count = c.issues.length;

        // Cumulative patch cost heuristic based on civic work items
        const isRoad = c.categoryName.toLowerCase().includes('road') || c.categoryName.toLowerCase().includes('pothole');
        const isDrain = c.categoryName.toLowerCase().includes('drain') || c.categoryName.toLowerCase().includes('water');
        const patchUnitCost = isRoad ? 380000 : isDrain ? 220000 : 75000;
        const cumulativeCost = count * patchUnitCost;
        const replacementCost = isRoad ? 1200000 : isDrain ? 850000 : 350000;
        const potentialSavings = Math.max(0, cumulativeCost - replacementCost);

        let rootCause = 'Chronic fatigue of surface layer due to repeated dynamic loads.';
        let recommendation = 'Execute full capital re-engineering instead of piecemeal surface patches.';

        if (isRoad) {
          rootCause =
            'Severe subgrade water ingress coupled with absent stormwater camber gradient. Superficial bituminous patches crack repeatedly under bus axle loads.';
          recommendation =
            'Full-depth reclamation with 50mm Bituminous Concrete (BC) overlay and installation of perforated sub-surface longitudinal drains.';
        } else if (isDrain) {
          rootCause =
            'Structural slope collapse and silting in vintage brick-masonry culvert resulting in persistent backflow and surface overflows.';
          recommendation =
            'Replace unreinforced brick masonry with pre-cast 1.5m box culverts and automated screening bar grills.';
        }

        // Link with nearest asset
        const nearestAsset = s.assets?.find(
          (a) => calculateDistanceMeters(a.latitude, a.longitude, c.latitude, c.longitude) <= 500
        );

        return {
          clusterKey: `cluster-${idx}-${c.categoryId}`,
          categoryName: c.categoryName,
          categoryId: c.categoryId,
          locationName: c.locationName,
          latitude: c.latitude,
          longitude: c.longitude,
          occurrenceCount: count,
          firstReported: sorted[0].created_at,
          latestReported: sorted[sorted.length - 1].created_at,
          currentActiveCount: activeCount,
          cumulative_repair_cost: cumulativeCost,
          replacement_cost_estimate: replacementCost,
          root_cause_diagnosis: rootCause,
          replacement_recommendation: recommendation,
          potential_savings: potentialSavings,
          contractor_warranty_breach: count >= 3,
          contractor_name: count >= 3 ? 'Apex Highway Infrastructure Ltd.' : 'Ward Maintenance Contractor',
          related_asset_id: nearestAsset?.id,
          issues: c.issues,
        };
      })
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount);
  }

  // --- Real Constituency Metrics Calculation ---
  public getConstituencyAnalytics() {
    const s = this.load();
    const total = s.issues.length;
    const resolved = s.issues.filter((i) => i.status === 'resolved' || i.status === 'closed').length;
    const closed = s.issues.filter((i) => i.status === 'closed').length;
    const inProgress = s.issues.filter((i) => i.status === 'in_progress').length;
    const submitted = s.issues.filter((i) => i.status === 'submitted' || i.status === 'assigned').length;
    const reopened = s.issues.filter((i) => i.status === 'reopened').length;
    const escalated = s.issues.filter((i) => i.status === 'escalated').length;
    const overdue = s.issues.filter((i) => i.is_overdue).length;

    const categoryCounts: Record<string, number> = {};
    s.categories.forEach((cat) => {
      categoryCounts[cat.name] = s.issues.filter((i) => i.category_id === cat.id).length;
    });

    const wardCounts: Record<string, number> = {};
    s.jurisdictions.forEach((ward) => {
      wardCounts[ward.name] = s.issues.filter((i) => i.jurisdiction_id === ward.id).length;
    });

    let totalDays = 0;
    let countResolved = 0;
    s.issues.forEach((i) => {
      if (i.resolved_at) {
        const start = new Date(i.created_at).getTime();
        const end = new Date(i.resolved_at).getTime();
        totalDays += Math.max(0.5, (end - start) / (1000 * 3600 * 24));
        countResolved++;
      }
    });

    const avgResolutionDays =
      countResolved > 0 ? Number((totalDays / countResolved).toFixed(1)) : 3.2;

    const recurring = this.getRecurringIssues();

    return {
      total,
      resolved,
      closed,
      inProgress,
      submitted,
      reopened,
      escalated,
      overdue,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      avgResolutionDays,
      categoryCounts,
      wardCounts,
      recurringClustersCount: recurring.length,
    };
  }

  // --- Master Data ---
  public getDepartments() {
    return this.load().departments;
  }

  public getJurisdictions() {
    return this.load().jurisdictions;
  }

  public getCategories() {
    return this.load().categories;
  }

  public getProjects(): PublicProject[] {
    const s = this.load();
    return s.projects.map((proj) => {
      // Find related issues dynamically based on location or category
      const related = s.issues.filter((i) => {
        if (proj.related_issue_ids?.includes(i.id)) return true;
        const locMatch =
          proj.location.toLowerCase().includes('velachery') &&
          i.location_text.toLowerCase().includes('velachery');
        const catMatch =
          (proj.category.toLowerCase().includes('drain') &&
            i.category_name?.toLowerCase().includes('drain')) ||
          (proj.category.toLowerCase().includes('road') &&
            i.category_name?.toLowerCase().includes('road'));
        return locMatch && catMatch;
      });
      const relatedIds = Array.from(
        new Set([...(proj.related_issue_ids || []), ...related.map((i) => i.id)])
      );
      const progressPct =
        proj.progress_pct ??
        Math.min(100, Math.round((proj.expenditure / proj.approved_amount) * 100));
      const fiscalHealth =
        proj.expenditure > proj.approved_amount
          ? 'critical_overrun'
          : proj.expenditure / proj.approved_amount > 0.85
          ? 'caution'
          : 'healthy';

      return {
        ...proj,
        progress_pct: progressPct,
        related_issue_ids: relatedIds,
        fiscal_health_status: proj.fiscal_health_status || fiscalHealth,
      };
    });
  }

  public getProjectById(id: string): PublicProject | undefined {
    const all = this.getProjects();
    return all.find((p) => p.id === id);
  }

  // ====================================================================
  // 1. CIVIC DNA - Infrastructure Health Memory
  // ====================================================================
  public getAssets(filter?: { ward_id?: string; asset_type?: string }): InfrastructureAsset[] {
    const s = this.load();
    let assets = s.assets || [];
    if (filter?.ward_id) {
      assets = assets.filter((a) => a.ward_id === filter.ward_id);
    }
    if (filter?.asset_type) {
      assets = assets.filter((a) => a.asset_type === filter.asset_type);
    }
    return assets;
  }

  public getAssetById(id: string): InfrastructureAsset | undefined {
    const s = this.load();
    return s.assets?.find((a) => a.id === id);
  }

  public addAssetRepair(
    assetId: string,
    repair: Partial<AssetRepairRecord>
  ): InfrastructureAsset {
    const s = this.load();
    const asset = s.assets?.find((a) => a.id === assetId);
    if (!asset) throw new Error(`Asset not found: ${assetId}`);

    const newRepair: AssetRepairRecord = {
      id: `rep-${Date.now()}`,
      asset_id: assetId,
      issue_id: repair.issue_id,
      date: repair.date || new Date().toISOString().split('T')[0],
      description: repair.description || 'Routine civic repair intervention',
      contractor_name: repair.contractor_name || 'Standard Municipal Contractor',
      cost: repair.cost || 150000,
      technique: repair.technique || 'Standard municipal patching technique',
      warranty_end_date:
        repair.warranty_end_date ||
        new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0],
      durability_status: repair.durability_status || 'holding',
    };

    asset.repair_history.unshift(newRepair);
    asset.cumulative_repair_cost += newRepair.cost;
    asset.failure_count += 1;
    asset.rebuild_threshold_pct = Number(
      ((asset.cumulative_repair_cost / asset.replacement_cost) * 100).toFixed(1)
    );

    // Adjust fatigue and health
    asset.fatigue_index = Math.min(1.0, Number((asset.fatigue_index + 0.05).toFixed(2)));
    asset.health_score = Math.max(10, asset.health_score - 4);
    if (asset.health_score < 40) {
      asset.condition = 'critical';
    } else if (asset.health_score < 60) {
      asset.condition = 'poor';
    }

    if (asset.rebuild_threshold_pct >= 55) {
      asset.recommendation = {
        type: 'rebuild_recommended',
        reason: `Cumulative repair expenditures (₹${(asset.cumulative_repair_cost / 100000).toFixed(1)}L) constitute ${asset.rebuild_threshold_pct}% of total replacement value. Continuous spot maintenance is fiscally non-viable.`,
        estimated_rebuild_cost: asset.replacement_cost,
        cumulative_patch_cost: asset.cumulative_repair_cost,
        projected_3yr_savings: Math.round(asset.replacement_cost * 0.35),
      };
    }

    this.save();
    return asset;
  }

  // ====================================================================
  // 2. CIVIC TIME MACHINE
  // ====================================================================
  public getTimeMachineRecords(): TimeMachineLocationRecord[] {
    const s = this.load();
    return s.timeMachineRecords || [];
  }

  public getTimeMachineRecordById(id: string): TimeMachineLocationRecord | undefined {
    const s = this.load();
    return s.timeMachineRecords?.find((r) => r.id === id);
  }

  public getTimeMachineRecordByIssueId(issueId: string): TimeMachineLocationRecord | undefined {
    const s = this.load();
    return s.timeMachineRecords?.find((r) => r.related_issue_id === issueId);
  }

  public addTimeMachineSnapshot(
    recordId: string,
    snapshot: TimeMachineSnapshot
  ): TimeMachineLocationRecord {
    const s = this.load();
    const record = s.timeMachineRecords?.find((r) => r.id === recordId);
    if (!record) throw new Error(`Time Machine record not found: ${recordId}`);

    record.snapshots.push(snapshot);
    if (snapshot.durability_score) {
      const allScores = record.snapshots
        .filter((sn) => sn.durability_score !== undefined)
        .map((sn) => sn.durability_score!);
      const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      record.durability_rating = Number((avg / 20).toFixed(1));
    }
    this.save();
    return record;
  }

  // ====================================================================
  // 3. CIVIC VOLUNTEER SWARM MODE
  // ====================================================================
  public getSwarmMissions(): VolunteerSwarmMission[] {
    const s = this.load();
    return s.swarmMissions || [];
  }

  public getSwarmMissionById(id: string): VolunteerSwarmMission | undefined {
    const s = this.load();
    return s.swarmMissions?.find((m) => m.id === id);
  }

  public joinSwarmMission(
    missionId: string,
    user: UserProfile,
    role: 'lead' | 'volunteer' | 'spotter' = 'volunteer'
  ): VolunteerSwarmMission {
    const s = this.load();
    const mission = s.swarmMissions?.find((m) => m.id === missionId);
    if (!mission) throw new Error(`Mission not found: ${missionId}`);

    const existing = mission.participants.find((p) => p.user_id === user.id);
    if (!existing) {
      mission.participants.push({
        user_id: user.id,
        user_name: user.full_name,
        joined_at: new Date().toISOString(),
        role,
        attended: true,
      });

      // Update volunteer leaderboard karma points
      let entry = s.volunteerLeaderboard.find((l) => l.user_id === user.id);
      if (!entry) {
        entry = {
          user_id: user.id,
          full_name: user.full_name,
          area: 'Ward 175 - Velachery',
          karma_points: 50,
          missions_completed: 1,
          rank: s.volunteerLeaderboard.length + 1,
          badges: [
            {
              id: `b-${Date.now()}`,
              name: 'Civic Scout',
              icon: 'Shield',
              description: 'Enlisted in a civic volunteer swarm mission',
              earned_at: new Date().toISOString().split('T')[0],
            },
          ],
        };
        s.volunteerLeaderboard.push(entry);
      } else {
        entry.karma_points += mission.karma_points_reward;
        entry.missions_completed += 1;
      }
      s.volunteerLeaderboard.sort((a, b) => b.karma_points - a.karma_points);
      s.volunteerLeaderboard.forEach((e, idx) => {
        e.rank = idx + 1;
      });

      this.addAuditLogInternal(s, {
        action: 'JOIN_SWARM_MISSION',
        entity_type: 'SWARM_MISSION',
        entity_id: mission.id,
        actor_email: user.email,
        actor_role: user.role,
        metadata: { mission_title: mission.title, role },
      });

      this.save();
    }
    return mission;
  }

  public submitSwarmProof(
    missionId: string,
    user: UserProfile,
    photoUrl: string,
    note: string,
    lat?: number,
    lng?: number
  ): VolunteerSwarmMission {
    const s = this.load();
    const mission = s.swarmMissions?.find((m) => m.id === missionId);
    if (!mission) throw new Error(`Mission not found: ${missionId}`);

    mission.proofs.push({
      id: `proof-${Date.now()}`,
      uploaded_by: user.id,
      uploader_name: user.full_name,
      photo_url: photoUrl,
      note,
      latitude: lat || mission.latitude,
      longitude: lng || mission.longitude,
      uploaded_at: new Date().toISOString(),
      upvotes: 1,
    });

    mission.status = 'completed';
    this.save();
    return mission;
  }

  public vouchSwarmMission(missionId: string, user: UserProfile): VolunteerSwarmMission {
    const s = this.load();
    const mission = s.swarmMissions?.find((m) => m.id === missionId);
    if (!mission) throw new Error(`Mission not found: ${missionId}`);

    mission.community_confirmations += 1;
    if (mission.community_confirmations >= 15) {
      mission.status = 'verified';
    }
    this.save();
    return mission;
  }

  public getVolunteerLeaderboard(): VolunteerLeaderboardEntry[] {
    const s = this.load();
    return (s.volunteerLeaderboard || []).sort((a, b) => a.rank - b.rank);
  }

  // ====================================================================
  // 4. CIVIC ACCOUNTABILITY GENOME
  // ====================================================================
  public getConstituencyGenomes(): Record<string, ConstituencyGenome> {
    const s = this.load();
    return s.genomes || INITIAL_CONSTITUENCY_GENOMES;
  }

  public getConstituencyGenomeByWard(wardId: string): ConstituencyGenome | undefined {
    const s = this.load();
    return (s.genomes || INITIAL_CONSTITUENCY_GENOMES)[wardId];
  }

  // ====================================================================
  // 7. EVIDENCE-BASED AUTHORITY PERFORMANCE INDEX (EBAPI)
  // ====================================================================
  public getAuthorityPerformanceIndex(): AuthorityIndexResponse {
    const s = this.load();
    const depts = s.departments;
    const recurringClusters = this.getRecurringIssues();

    const scorecards: DepartmentScorecard[] = depts.map((d) => {
      const assignedIssues = s.issues.filter((i) => i.department_id === d.id);
      const totalAssigned = assignedIssues.length;
      const resolvedIssues = assignedIssues.filter(
        (i) => i.status === 'resolved' || i.status === 'closed'
      );

      const onTimeIssues = resolvedIssues.filter((i) => !i.is_overdue);
      const slaCompliancePct =
        totalAssigned > 0
          ? Math.round((onTimeIssues.length / Math.max(1, resolvedIssues.length)) * 100)
          : 85;

      let totalDays = 0;
      resolvedIssues.forEach((i) => {
        if (i.resolved_at) {
          const diff =
            (new Date(i.resolved_at).getTime() - new Date(i.created_at).getTime()) /
            (1000 * 3600 * 24);
          totalDays += Math.max(0.5, diff);
        }
      });
      const avgResolutionDays =
        resolvedIssues.length > 0
          ? Number((totalDays / resolvedIssues.length).toFixed(1))
          : 3.2;

      const verifiedClosures = resolvedIssues.filter(
        (i) => i.verification?.result === 'completely_resolved'
      );
      const verifiedResolutionPct =
        resolvedIssues.length > 0
          ? Math.round((verifiedClosures.length / resolvedIssues.length) * 100)
          : 75;

      const reopenedIssues = assignedIssues.filter(
        (i) => i.status === 'reopened' || i.verification?.result === 'not_resolved'
      );
      const reopeningRatePct =
        resolvedIssues.length > 0
          ? Math.round(
              (reopenedIssues.length /
                Math.max(1, resolvedIssues.length + reopenedIssues.length)) *
                100
            )
          : 12;

      const durabilityRatePct = Math.max(65, 100 - reopeningRatePct * 2);

      // Recurring penalty
      const deptClusters = recurringClusters.filter((c) => {
        const cat = s.categories.find((catItem) => catItem.id === c.categoryId);
        return cat?.default_department_id === d.id;
      });
      const recurringFailurePenalty = Math.min(15, deptClusters.length * 3);

      // Score weight breakdown
      const sla_score = Number(((slaCompliancePct / 100) * 30).toFixed(1)); // 30% weight
      const speed_score = Number(
        Math.max(0, Math.min(20, (6 - avgResolutionDays) * 4)).toFixed(1)
      ); // 20% weight
      const citizen_trust_score = Number(((verifiedResolutionPct / 100) * 25).toFixed(1)); // 25% weight
      const durability_score = Number(((durabilityRatePct / 100) * 25).toFixed(1)); // 25% weight
      const reopening_penalty = Number(
        (recurringFailurePenalty + reopeningRatePct * 0.2).toFixed(1)
      );

      const composite = Math.min(
        100,
        Math.max(
          20,
          Number(
            (
              sla_score +
              speed_score +
              citizen_trust_score +
              durability_score -
              reopening_penalty
            ).toFixed(1)
          )
        )
      );

      let performance_status: DepartmentScorecard['performance_status'] = 'Satisfactory';
      if (composite >= 85) performance_status = 'Exemplary';
      else if (composite >= 70) performance_status = 'Satisfactory';
      else if (composite >= 55) performance_status = 'Needs Improvement';
      else performance_status = 'Critical Intervention';

      const actionable_recommendations: string[] = [];
      if (slaCompliancePct < 80)
        actionable_recommendations.push(
          `Improve initial dispatch triage; SLA breach rate is currently ${(
            100 - slaCompliancePct
          ).toFixed(0)}%.`
        );
      if (reopeningRatePct > 10)
        actionable_recommendations.push(
          `Mandate supervisory photographic pre-audit before marking tickets resolved to curb high reopening rate.`
        );
      if (deptClusters.length > 0)
        actionable_recommendations.push(
          `Address ${deptClusters.length} repeat failure hotspot(s) with capital engineering overhauls rather than spot repairs.`
        );
      if (actionable_recommendations.length === 0)
        actionable_recommendations.push(
          `Maintain high-fidelity field response and continue weekly citizen resolution verification audits.`
        );

      return {
        department_id: d.id,
        department_name: d.name,
        department_code: d.code,
        composite_index: composite,
        rank: 0,
        total_assigned: totalAssigned,
        sla_compliance_pct: slaCompliancePct,
        avg_resolution_days: avgResolutionDays,
        verified_resolution_pct: verifiedResolutionPct,
        reopening_rate_pct: reopeningRatePct,
        durability_rate_pct: durabilityRatePct,
        recurring_failure_penalty: recurringFailurePenalty,
        weights_breakdown: {
          sla_score,
          speed_score,
          citizen_trust_score,
          durability_score,
          reopening_penalty,
        },
        performance_status,
        actionable_recommendations,
      };
    });

    // Sort descending and assign ranks
    scorecards.sort((a, b) => b.composite_index - a.composite_index);
    scorecards.forEach((sc, idx) => {
      sc.rank = idx + 1;
    });

    return {
      generated_at: new Date().toISOString(),
      formula_explanation:
        'Composite Index = SLA Score (30%) + Speed Score (20%) + Citizen Trust Score (25%) + Durability Score (25%) - Reopening & Repeat Penalty',
      scorecards,
    };
  }

  // ====================================================================
  // 6. CONSTITUENCY PULSE BRIEFING
  // ====================================================================
  public getConstituencyPulse(wardId: string = 'ward-175') {
    const s = this.load();
    const ward = s.jurisdictions.find((j) => j.id === wardId) || s.jurisdictions[0];
    const wardIssues = s.issues.filter((i) => i.jurisdiction_id === ward.id);
    const wardAssets = s.assets?.filter((a) => a.ward_id === ward.id) || [];
    const genome = s.genomes?.[ward.id] || Object.values(s.genomes || {})[0];
    const recurring = this.getRecurringIssues().filter((c) => {
      return wardIssues.some((wi) => wi.category_id === c.categoryId);
    });
    const authorityIndex = this.getAuthorityPerformanceIndex();
    const swarmMissions = s.swarmMissions?.filter((m) => m.ward_id === ward.id) || [];

    const total = wardIssues.length;
    const resolved = wardIssues.filter(
      (i) => i.status === 'resolved' || i.status === 'closed'
    ).length;
    const closed = wardIssues.filter((i) => i.status === 'closed').length;
    const verifiedRate = resolved > 0 ? Math.round((closed / resolved) * 100) : 82;
    const avgHealthScore =
      wardAssets.length > 0
        ? Math.round(
            wardAssets.reduce((sum, a) => sum + a.health_score, 0) / wardAssets.length
          )
        : 74;

    return {
      ward_id: ward.id,
      ward_name: ward.name,
      zone: genome?.zone || 'Zone 13 Adyar',
      generated_at: new Date().toISOString(),
      executive_summary: {
        total_complaints: total,
        resolved_count: resolved,
        pending_count: total - resolved,
        citizen_verification_rate_pct: verifiedRate,
        average_asset_health_score: avgHealthScore,
        overall_governance_score: genome?.overall_governance_score || 78.4,
        governance_grade: genome?.governance_grade || 'B+',
      },
      genome,
      recurring_hotspots: recurring.slice(0, 5),
      assets: wardAssets,
      department_scorecards: authorityIndex.scorecards.slice(0, 4),
      swarm_missions: swarmMissions,
      action_items: genome?.policy_prescription || [
        'Mandate capital resurfacing for repeated arterial pothole hotspots.',
        'Enforce contractor 12-month post-repair warranty inspections.',
        'Accelerate citizen resolution verification through community alerts.',
      ],
    };
  }

  public getNotifications(userId?: string) {
    const s = this.load();
    if (!userId) return s.notifications;
    return s.notifications.filter((n) => n.user_id === userId || n.user_id === 'all');
  }

  public markNotificationRead(id: string) {
    const s = this.load();
    const notif = s.notifications.find((n) => n.id === id);
    if (notif) {
      notif.is_read = true;
      this.save();
    }
    return notif;
  }

  public getAuditLogs() {
    return this.load().auditLogs;
  }

  public resetDatabase() {
    this.state = {
      users: DEMO_USERS.map((u) => ({
        ...u,
        password_hash: 'civiclens123',
      })),
      departments: [...INITIAL_DEPARTMENTS],
      jurisdictions: [...INITIAL_JURISDICTIONS],
      categories: [...INITIAL_CATEGORIES],
      routingRules: [...INITIAL_ROUTING_RULES],
      issues: [...INITIAL_ISSUES],
      projects: [...INITIAL_PROJECTS],
      notifications: [...INITIAL_NOTIFICATIONS],
      auditLogs: [...INITIAL_AUDIT_LOGS],
      assets: [...INITIAL_INFRASTRUCTURE_ASSETS],
      timeMachineRecords: [...INITIAL_TIME_MACHINE_RECORDS],
      swarmMissions: [...INITIAL_SWARM_MISSIONS],
      volunteerLeaderboard: [...INITIAL_VOLUNTEER_LEADERBOARD],
      genomes: { ...INITIAL_CONSTITUENCY_GENOMES },
    };
    this.save();
    return true;
  }

  // --- Internals ---
  private routeComplaintInternal(s: DatabaseState, categoryId: string, jurisdictionId?: string) {
    let matchedRule = s.routingRules.find(
      (r) => r.active && r.category_id === categoryId && r.jurisdiction_id === jurisdictionId
    );

    if (!matchedRule) {
      matchedRule = s.routingRules.find(
        (r) => r.active && r.category_id === categoryId && !r.jurisdiction_id
      );
    }

    if (matchedRule) {
      const dept = s.departments.find((d) => d.id === matchedRule?.department_id);
      if (dept) {
        return {
          departmentId: dept.id,
          departmentName: dept.name,
          ruleMatch: `Category rule matched: ${dept.name}`,
        };
      }
    }

    const defaultDept = s.departments[0];
    return {
      departmentId: defaultDept.id,
      departmentName: defaultDept.name,
      ruleMatch: `Default municipal intake fallback: ${defaultDept.name}`,
    };
  }

  private addNotificationInternal(
    s: DatabaseState,
    n: Omit<AppNotification, 'id' | 'is_read' | 'created_at'>
  ) {
    const newNotif: AppNotification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    s.notifications.unshift(newNotif);
  }

  private addAuditLogInternal(
    s: DatabaseState,
    log: Omit<AuditLog, 'id' | 'created_at'>
  ) {
    const newAudit: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    s.auditLogs.unshift(newAudit);
  }
}

export const serverDb = ServerDatabase.getInstance();
