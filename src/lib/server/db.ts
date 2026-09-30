import fs from 'fs';
import path from 'path';
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

    const verificationRecord = {
      id: `v-${Date.now()}`,
      issue_id: issueId,
      citizen_id: citizenId,
      citizen_name: citizenName,
      result: result,
      comment: comment,
      new_evidence_url: newEvidenceUrl,
      created_at: nowIso,
    };

    issue.verification = verificationRecord;
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
        note: `Citizen verified: "Completely Resolved". Feedback: "${comment || 'Verified and confirmed safe.'}". Complaint officially closed.`,
        created_at: nowIso,
      });

      this.addAuditLogInternal(s, {
        action: 'VERIFY_RESOLUTION_ACCEPTED',
        entity_type: 'ISSUE',
        entity_id: issue.id,
        actor_email: citizen?.email,
        actor_role: 'citizen',
        metadata: { result, comment },
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

  // --- Spatial Recurring Issues Clustering ---
  public getRecurringIssues() {
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

        return {
          clusterKey: `cluster-${idx}-${c.categoryId}`,
          categoryName: c.categoryName,
          categoryId: c.categoryId,
          locationName: c.locationName,
          latitude: c.latitude,
          longitude: c.longitude,
          occurrenceCount: c.issues.length,
          firstReported: sorted[0].created_at,
          latestReported: sorted[sorted.length - 1].created_at,
          currentActiveCount: activeCount,
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

  public getProjects() {
    return this.load().projects;
  }

  public getProjectById(id: string) {
    return this.load().projects.find((p) => p.id === id);
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
