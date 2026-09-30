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

const STORAGE_KEYS = {
  ISSUES: 'civiclens_issues_v1',
  DEPARTMENTS: 'civiclens_departments_v1',
  JURISDICTIONS: 'civiclens_jurisdictions_v1',
  CATEGORIES: 'civiclens_categories_v1',
  PROJECTS: 'civiclens_projects_v1',
  ROUTING_RULES: 'civiclens_routing_rules_v1',
  NOTIFICATIONS: 'civiclens_notifications_v1',
  AUDIT_LOGS: 'civiclens_audit_logs_v1',
  CURRENT_USER: 'civiclens_current_user_v1',
  LANGUAGE: 'civiclens_lang_v1',
};

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

export class CivicDataStore {
  private static instance: CivicDataStore;

  private issues: CivicIssue[] = [];
  private departments: Department[] = [];
  private jurisdictions: Jurisdiction[] = [];
  private categories: IssueCategory[] = [];
  private projects: PublicProject[] = [];
  private routingRules: RoutingRule[] = [];
  private notifications: AppNotification[] = [];
  private auditLogs: AuditLog[] = [];
  private currentUser: UserProfile = DEMO_USERS[0]; // Citizen Dinesh by default
  private language: 'en' | 'ta' = 'en';
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.initData();
  }

  public static getInstance(): CivicDataStore {
    if (!CivicDataStore.instance) {
      CivicDataStore.instance = new CivicDataStore();
    }
    return CivicDataStore.instance;
  }

  private initData() {
    if (typeof window === 'undefined') {
      this.issues = [...INITIAL_ISSUES];
      this.departments = [...INITIAL_DEPARTMENTS];
      this.jurisdictions = [...INITIAL_JURISDICTIONS];
      this.categories = [...INITIAL_CATEGORIES];
      this.projects = [...INITIAL_PROJECTS];
      this.routingRules = [...INITIAL_ROUTING_RULES];
      this.notifications = [...INITIAL_NOTIFICATIONS];
      this.auditLogs = [...INITIAL_AUDIT_LOGS];
      this.currentUser = DEMO_USERS[0];
      return;
    }

    try {
      const storedIssues = localStorage.getItem(STORAGE_KEYS.ISSUES);
      this.issues = storedIssues ? JSON.parse(storedIssues) : [...INITIAL_ISSUES];

      const storedDepts = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
      this.departments = storedDepts ? JSON.parse(storedDepts) : [...INITIAL_DEPARTMENTS];

      const storedJuris = localStorage.getItem(STORAGE_KEYS.JURISDICTIONS);
      this.jurisdictions = storedJuris ? JSON.parse(storedJuris) : [...INITIAL_JURISDICTIONS];

      const storedCats = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      this.categories = storedCats ? JSON.parse(storedCats) : [...INITIAL_CATEGORIES];

      const storedProjs = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      this.projects = storedProjs ? JSON.parse(storedProjs) : [...INITIAL_PROJECTS];

      const storedRules = localStorage.getItem(STORAGE_KEYS.ROUTING_RULES);
      this.routingRules = storedRules ? JSON.parse(storedRules) : [...INITIAL_ROUTING_RULES];

      const storedNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      this.notifications = storedNotifs ? JSON.parse(storedNotifs) : [...INITIAL_NOTIFICATIONS];

      const storedAudits = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      this.auditLogs = storedAudits ? JSON.parse(storedAudits) : [...INITIAL_AUDIT_LOGS];

      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      let parsedUser = null;
      if (storedUser) {
        try {
          parsedUser = JSON.parse(storedUser);
        } catch {
          parsedUser = null;
        }
      }
      this.currentUser = (parsedUser && parsedUser.id && parsedUser.role) ? parsedUser : DEMO_USERS[0];

      const storedLang = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
      this.language = (storedLang === 'ta' ? 'ta' : 'en');
      this.syncWithServer();
    } catch {
      // Fallback
      this.issues = [...INITIAL_ISSUES];
      this.departments = [...INITIAL_DEPARTMENTS];
      this.jurisdictions = [...INITIAL_JURISDICTIONS];
      this.categories = [...INITIAL_CATEGORIES];
      this.projects = [...INITIAL_PROJECTS];
      this.routingRules = [...INITIAL_ROUTING_RULES];
      this.notifications = [...INITIAL_NOTIFICATIONS];
      this.auditLogs = [...INITIAL_AUDIT_LOGS];
      this.currentUser = DEMO_USERS[0];
    }
  }

  public async syncWithServer() {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/issues');
      if (res.ok) {
        const data = await res.json();
        if (data.issues && data.issues.length > 0) {
          this.issues = data.issues;
          this.persist();
        }
      }
    } catch {
      // Offline / fallback mode
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(this.issues));
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(this.departments));
      localStorage.setItem(STORAGE_KEYS.JURISDICTIONS, JSON.stringify(this.jurisdictions));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(this.projects));
      localStorage.setItem(STORAGE_KEYS.ROUTING_RULES, JSON.stringify(this.routingRules));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(this.auditLogs));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, this.language);
    } catch (e) {
      console.warn('Storage persist error', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  // --- Auth & Language ---
  public getCurrentUser(): UserProfile {
    return (this.currentUser && this.currentUser.id && this.currentUser.role)
      ? this.currentUser
      : DEMO_USERS[0];
  }

  public setCurrentUser(user: UserProfile) {
    this.currentUser = (user && user.id && user.role) ? user : DEMO_USERS[0];
    this.persist();
  }

  public switchRole(role: UserRole, departmentId?: string) {
    const match = DEMO_USERS.find((u) => u.role === role && (!departmentId || u.department_id === departmentId));
    if (match) {
      this.setCurrentUser(match);
    } else {
      // Dynamic profile
      const newProfile: UserProfile = {
        id: `user-${role}-${Date.now()}`,
        full_name: `${role.toUpperCase()} User`,
        email: `${role}@civiclens.gov`,
        role: role,
        department_id: departmentId,
        preferred_language: this.language,
        created_at: new Date().toISOString(),
      };
      this.setCurrentUser(newProfile);
    }
  }

  public getLanguage(): 'en' | 'ta' {
    return this.language;
  }

  public setLanguage(lang: 'en' | 'ta') {
    this.language = lang;
    this.persist();
  }

  // --- Master Data Getters ---
  public getDepartments(): Department[] {
    return [...this.departments];
  }

  public getJurisdictions(): Jurisdiction[] {
    return [...this.jurisdictions];
  }

  public getCategories(): IssueCategory[] {
    return [...this.categories];
  }

  public getProjects(): PublicProject[] {
    return [...this.projects];
  }

  public getRoutingRules(): RoutingRule[] {
    return [...this.routingRules];
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  public getNotifications(userId?: string): AppNotification[] {
    const targetId = userId || this.currentUser.id;
    return this.notifications.filter((n) => n.user_id === targetId || n.user_id === 'all');
  }

  public markNotificationAsRead(id: string) {
    this.notifications = this.notifications.map((n) =>
      n.id === id ? { ...n, is_read: true } : n
    );
    this.persist();
  }

  public markAllNotificationsAsRead(userId?: string) {
    const targetId = userId || this.currentUser.id;
    this.notifications = this.notifications.map((n) =>
      n.user_id === targetId ? { ...n, is_read: true } : n
    );
    this.persist();
  }

  // --- Smart Routing Engine ---
  public routeComplaint(
    categoryId: string,
    jurisdictionId?: string
  ): { departmentId: string; departmentName: string; ruleMatch: string } {
    // Check specific category + jurisdiction rule first
    let matchedRule = this.routingRules.find(
      (r) => r.active && r.category_id === categoryId && r.jurisdiction_id === jurisdictionId
    );

    // Fallback to category level rule
    if (!matchedRule) {
      matchedRule = this.routingRules.find(
        (r) => r.active && r.category_id === categoryId && !r.jurisdiction_id
      );
    }

    if (matchedRule) {
      const dept = this.departments.find((d) => d.id === matchedRule?.department_id);
      if (dept) {
        return {
          departmentId: dept.id,
          departmentName: dept.name,
          ruleMatch: `Category rule matched: ${dept.name}`,
        };
      }
    }

    // Default Fallback: Roads / Municipal General
    const defaultDept = this.departments[0];
    return {
      departmentId: defaultDept.id,
      departmentName: defaultDept.name,
      ruleMatch: `Default municipal intake fallback: ${defaultDept.name}`,
    };
  }

  // --- Duplicate Detection Engine ---
  public findPotentialDuplicates(
    categoryId: string,
    lat: number,
    lng: number,
    radiusMeters: number = 300
  ): CivicIssue[] {
    return this.issues.filter((issue) => {
      // Must be same category and active status
      if (issue.category_id !== categoryId) return false;
      if (['closed'].includes(issue.status)) return false;

      const dist = calculateDistanceMeters(lat, lng, issue.latitude, issue.longitude);
      return dist <= radiusMeters;
    });
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
    let result = [...this.issues];

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
            (i.category_name && i.category_name.toLowerCase().includes(query))
        );
      }
    }

    // Sort newest first
    return result.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getIssueById(idOrCode: string): CivicIssue | undefined {
    return this.issues.find(
      (i) => i.id === idOrCode || i.complaint_code.toLowerCase() === idOrCode.toLowerCase()
    );
  }

  // Create Issue
  public createIssue(data: {
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
  }): CivicIssue {
    if (data.authenticity?.is_ai_generated) {
      throw new Error(
        'Complaint rejected: The attached photograph was detected as AI-generated/synthetic. Only authentic camera photos can be submitted.'
      );
    }

    const nextSeq = this.issues.length + 101;
    const complaintCode = `CL-2026-${String(nextSeq).padStart(6, '0')}`;
    const category = this.categories.find((c) => c.id === data.categoryId);
    const jurisdiction = this.jurisdictions.find((j) => j.id === data.jurisdictionId);

    // Smart routing
    const routing = this.routeComplaint(data.categoryId, data.jurisdictionId);

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
        uploaded_by: this.currentUser.id,
        uploader_name: this.currentUser.full_name,
        uploader_role: this.currentUser.role,
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
      citizen_id: this.currentUser.id,
      citizen_name: this.currentUser.full_name,
      citizen_phone: this.currentUser.phone,
      category_id: data.categoryId,
      category_name: category?.name,
      category_code: category?.code,
      title: data.title,
      description: data.description,
      severity: data.severity,
      status: 'submitted',
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
          actor_id: this.currentUser.id,
          actor_name: this.currentUser.full_name,
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

    // Update status to assigned after auto-routing
    newIssue.status = 'assigned';

    this.issues.unshift(newIssue);

    // Audit log
    this.addAuditLog({
      action: 'CREATE_ISSUE',
      entity_type: 'ISSUE',
      entity_id: newIssue.id,
      metadata: { complaint_code: complaintCode, category: category?.name, severity: data.severity },
    });

    // Notification to citizen
    this.addNotification({
      user_id: this.currentUser.id,
      title: `Complaint Submitted: ${complaintCode}`,
      message: `Your report "${data.title.slice(0, 40)}..." has been received and routed to ${routing.departmentName}.`,
      related_issue_id: newIssue.id,
    });

    this.persist();

    if (typeof window !== 'undefined') {
      fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          categoryId: data.categoryId,
          severity: data.severity,
          latitude: data.latitude,
          longitude: data.longitude,
          locationText: data.locationText,
          jurisdictionId: data.jurisdictionId,
          photoDataUrl: data.photoDataUrl,
          photoCaption: data.photoCaption,
          authenticity: data.authenticity,
          citizenId: this.currentUser.id,
        }),
      }).catch(() => {});
    }

    return newIssue;
  }

  // Update Status / Workflow Transitions
  public updateStatus(
    issueId: string,
    newStatus: IssueStatus,
    note?: string,
    evidenceUrl?: string
  ): boolean {
    const issue = this.issues.find((i) => i.id === issueId);
    if (!issue) return false;

    const oldStatus = issue.status;
    const nowIso = new Date().toISOString();
    issue.status = newStatus;
    issue.updated_at = nowIso;

    if (newStatus === 'resolved') {
      issue.resolved_at = nowIso;
    } else if (newStatus === 'closed') {
      issue.closed_at = nowIso;
    }

    issue.timeline.push({
      id: `t-${Date.now()}`,
      issue_id: issueId,
      actor_id: this.currentUser.id,
      actor_name: this.currentUser.full_name,
      actor_role: this.currentUser.role,
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
        uploaded_by: this.currentUser.id,
        uploader_name: this.currentUser.full_name,
        uploader_role: this.currentUser.role,
        file_path: evidenceUrl,
        file_type: 'image/jpeg',
        evidence_type:
          this.currentUser.role === 'field_worker'
            ? 'field_completion'
            : this.currentUser.role === 'officer'
            ? 'officer_resolution'
            : 'citizen_report',
        caption: note || 'Status update evidence photograph',
        created_at: nowIso,
      });
    }

    // Trigger Notifications
    if (newStatus === 'resolved') {
      this.addNotification({
        user_id: issue.citizen_id,
        title: `Resolution Verification: ${issue.complaint_code}`,
        message: `The department has marked "${issue.title.slice(0, 35)}..." as resolved. Please verify if the problem is genuinely fixed.`,
        related_issue_id: issue.id,
      });
    } else {
      this.addNotification({
        user_id: issue.citizen_id,
        title: `Status Updated: ${issue.complaint_code}`,
        message: `Your complaint status has changed to "${newStatus.replace('_', ' ').toUpperCase()}".`,
        related_issue_id: issue.id,
      });
    }

    this.addAuditLog({
      action: 'UPDATE_STATUS',
      entity_type: 'ISSUE',
      entity_id: issue.id,
      metadata: { old_status: oldStatus, new_status: newStatus, note },
    });

    this.persist();

    if (typeof window !== 'undefined') {
      fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note,
          evidenceUrl,
          actorId: this.currentUser?.id,
        }),
      }).catch(() => {});
    }

    return true;
  }

  // Officer assigns Field Worker
  public assignFieldWorker(issueId: string, fieldWorkerId: string, note?: string): boolean {
    const issue = this.issues.find((i) => i.id === issueId);
    if (!issue) return false;

    const worker = DEMO_USERS.find((u) => u.id === fieldWorkerId);
    issue.assigned_field_worker_id = fieldWorkerId;
    issue.assigned_field_worker_name = worker?.full_name || 'Field Technician';
    issue.status = 'in_progress';
    issue.updated_at = new Date().toISOString();

    issue.timeline.push({
      id: `t-${Date.now()}`,
      issue_id: issueId,
      actor_id: this.currentUser.id,
      actor_name: this.currentUser.full_name,
      actor_role: this.currentUser.role,
      event_type: 'FIELD_WORKER_ASSIGNED',
      new_status: 'in_progress',
      note: note || `Dispatched to field technician ${issue.assigned_field_worker_name} for ground intervention.`,
      created_at: new Date().toISOString(),
    });

    this.addNotification({
      user_id: fieldWorkerId,
      title: `New Field Assignment: ${issue.complaint_code}`,
      message: `You have been assigned to inspect and rectify "${issue.title.slice(0, 40)}..." at ${issue.location_text}.`,
      related_issue_id: issue.id,
    });

    this.addNotification({
      user_id: issue.citizen_id,
      title: `Field Worker Dispatched: ${issue.complaint_code}`,
      message: `Field technician ${issue.assigned_field_worker_name} has been assigned to work on your complaint.`,
      related_issue_id: issue.id,
    });

    this.addAuditLog({
      action: 'ASSIGN_FIELD_WORKER',
      entity_type: 'ISSUE',
      entity_id: issue.id,
      metadata: { field_worker_id: fieldWorkerId, worker_name: issue.assigned_field_worker_name },
    });

    this.persist();

    if (typeof window !== 'undefined') {
      fetch(`/api/issues/${issueId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: fieldWorkerId,
          note,
          officerId: this.currentUser?.id,
        }),
      }).catch(() => {});
    }

    return true;
  }

  // Field Worker updates work progress
  public submitFieldWork(
    issueId: string,
    notes: string,
    photoDataUrl?: string,
    isCompleted: boolean = false
  ): boolean {
    const issue = this.issues.find((i) => i.id === issueId);
    if (!issue) return false;

    const nowIso = new Date().toISOString();
    issue.updated_at = nowIso;

    if (photoDataUrl) {
      issue.evidence.push({
        id: `ev-${Date.now()}`,
        issue_id: issueId,
        uploaded_by: this.currentUser.id,
        uploader_name: this.currentUser.full_name,
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
      actor_id: this.currentUser.id,
      actor_name: this.currentUser.full_name,
      actor_role: 'field_worker',
      event_type: isCompleted ? 'FIELD_WORK_COMPLETED' : 'FIELD_WORK_PROGRESS',
      note: isCompleted
        ? `Field work marked completed by technician. Submitted to Officer for resolution review. Notes: ${notes}`
        : `Field update: ${notes}`,
      evidence_url: photoDataUrl,
      created_at: nowIso,
    });

    this.addAuditLog({
      action: isCompleted ? 'FIELD_WORK_COMPLETED' : 'FIELD_WORK_UPDATE',
      entity_type: 'ISSUE',
      entity_id: issue.id,
      metadata: { isCompleted, notes },
    });

    // Notify Department Officer
    if (issue.assigned_officer_id) {
      this.addNotification({
        user_id: issue.assigned_officer_id,
        title: `Field Work Report: ${issue.complaint_code}`,
        message: `${this.currentUser.full_name} has updated task status: "${notes.slice(0, 45)}...".`,
        related_issue_id: issue.id,
      });
    }

    this.persist();

    if (typeof window !== 'undefined') {
      fetch(`/api/issues/${issueId}/field-work`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: this.currentUser?.id,
          notes,
          photoDataUrl,
          isCompleted,
        }),
      }).catch(() => {});
    }

    return true;
  }

  // Officer marks Resolved
  public markOfficerResolved(issueId: string, officialNote: string, proofPhotoUrl?: string): boolean {
    return this.updateStatus(issueId, 'resolved', officialNote, proofPhotoUrl);
  }

  // Citizen Resolution Verification
  public verifyResolution(
    issueId: string,
    result: VerificationResult,
    comment: string,
    newEvidenceUrl?: string
  ): boolean {
    const issue = this.issues.find((i) => i.id === issueId);
    if (!issue) return false;

    const nowIso = new Date().toISOString();
    const verificationRecord = {
      id: `v-${Date.now()}`,
      issue_id: issueId,
      citizen_id: this.currentUser.id,
      citizen_name: this.currentUser.full_name,
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
        actor_id: this.currentUser.id,
        actor_name: this.currentUser.full_name,
        actor_role: 'citizen',
        event_type: 'CITIZEN_VERIFIED_CLOSED',
        old_status: 'resolved',
        new_status: 'closed',
        note: `Citizen verified: "Completely Resolved". Feedback: "${comment || 'Verified and confirmed safe.'}". Complaint officially closed.`,
        created_at: nowIso,
      });

      this.addAuditLog({
        action: 'VERIFY_RESOLUTION_ACCEPTED',
        entity_type: 'ISSUE',
        entity_id: issue.id,
        metadata: { result, comment },
      });
    } else {
      // Partially or Not Resolved -> Reopen complaint!
      issue.status = 'reopened';

      if (newEvidenceUrl) {
        issue.evidence.push({
          id: `ev-${Date.now()}`,
          issue_id: issueId,
          uploaded_by: this.currentUser.id,
          uploader_name: this.currentUser.full_name,
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
        actor_id: this.currentUser.id,
        actor_name: this.currentUser.full_name,
        actor_role: 'citizen',
        event_type: 'CITIZEN_REOPENED_ISSUE',
        old_status: 'resolved',
        new_status: 'reopened',
        note: `Citizen rejected resolution (${result === 'partially_resolved' ? 'Partially Resolved' : 'Not Resolved'}). Ground note: "${comment}". Ticket reopened for corrective action.`,
        evidence_url: newEvidenceUrl,
        created_at: nowIso,
      });

      this.addAuditLog({
        action: 'VERIFY_RESOLUTION_REJECTED',
        entity_type: 'ISSUE',
        entity_id: issue.id,
        metadata: { result, comment },
      });

      // Alert Department
      if (issue.department_id) {
        this.addNotification({
          user_id: 'user-officer-roads', // or dept officer
          title: `COMPLAINT REOPENED: ${issue.complaint_code}`,
          message: `Citizen verified that "${issue.title.slice(0, 35)}..." was NOT properly resolved. Reopened for immediate re-intervention.`,
          related_issue_id: issue.id,
        });
      }
    }

    this.persist();

    if (typeof window !== 'undefined') {
      fetch(`/api/issues/${issueId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenId: this.currentUser?.id,
          result,
          comment,
          newEvidenceUrl,
        }),
      }).catch(() => {});
    }

    return true;
  }

  // Escalate Complaint
  public escalateComplaint(issueId: string, reason: string, details?: string): boolean {
    const issue = this.issues.find((i) => i.id === issueId);
    if (!issue) return false;

    const nowIso = new Date().toISOString();
    const escalationCode = `ESC-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const escRecord = {
      id: `esc-${Date.now()}`,
      escalation_code: escalationCode,
      issue_id: issueId,
      raised_by: this.currentUser.id,
      raiser_name: this.currentUser.full_name,
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
      actor_id: this.currentUser.id,
      actor_name: this.currentUser.full_name,
      actor_role: this.currentUser.role,
      event_type: 'ESCALATION_TRIGGERED',
      old_status: oldStatus,
      new_status: 'escalated',
      note: `Escalated (${escalationCode}). Reason: "${reason}". Transferred to Zonal Commissioner & Representative Oversight.`,
      created_at: nowIso,
    });

    this.addAuditLog({
      action: 'ESCALATE_ISSUE',
      entity_type: 'ISSUE',
      entity_id: issue.id,
      metadata: { escalation_code: escalationCode, reason, details },
    });

    // Notify Representative & Admin
    this.addNotification({
      user_id: 'user-representative-mla',
      title: `Escalation Alert: ${issue.complaint_code}`,
      message: `Citizen escalated complaint regarding "${issue.title.slice(0, 35)}..." (${reason}).`,
      related_issue_id: issue.id,
    });

    this.persist();

    if (typeof window !== 'undefined') {
      fetch(`/api/issues/${issueId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenId: this.currentUser?.id,
          reason,
          details,
        }),
      }).catch(() => {});
    }

    return true;
  }

  // --- Recurring Issues Detection Engine ---
  public getRecurringIssues(): Array<{
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
    issues: CivicIssue[];
  }> {
    // Cluster issues by category and spatial distance (< 400 meters)
    const clusters: Array<{
      categoryName: string;
      categoryId: string;
      locationName: string;
      latitude: number;
      longitude: number;
      issues: CivicIssue[];
    }> = [];

    this.issues.forEach((issue) => {
      // Find matching cluster
      const matchedCluster = clusters.find(
        (c) =>
          c.categoryId === issue.category_id &&
          calculateDistanceMeters(c.latitude, c.longitude, issue.latitude, issue.longitude) <= 400
      );

      if (matchedCluster) {
        matchedCluster.issues.push(issue);
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

    // Filter clusters with 2 or more occurrences
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

  // --- Real Aggregate Statistics (Constituency Metrics) ---
  public getConstituencyMetrics() {
    const total = this.issues.length;
    const resolved = this.issues.filter((i) => i.status === 'resolved' || i.status === 'closed').length;
    const closed = this.issues.filter((i) => i.status === 'closed').length;
    const inProgress = this.issues.filter((i) => i.status === 'in_progress').length;
    const submitted = this.issues.filter((i) => i.status === 'submitted' || i.status === 'assigned').length;
    const reopened = this.issues.filter((i) => i.status === 'reopened').length;
    const escalated = this.issues.filter((i) => i.status === 'escalated').length;
    const overdue = this.issues.filter((i) => i.is_overdue).length;

    // Category distribution
    const categoryCounts: Record<string, number> = {};
    this.categories.forEach((cat) => {
      categoryCounts[cat.name] = this.issues.filter((i) => i.category_id === cat.id).length;
    });

    // Ward distribution
    const wardCounts: Record<string, number> = {};
    this.jurisdictions.forEach((ward) => {
      wardCounts[ward.name] = this.issues.filter((i) => i.jurisdiction_id === ward.id).length;
    });

    // Average resolution time in days (for closed/resolved tickets)
    let totalResolutionDays = 0;
    let resolvedCount = 0;
    this.issues.forEach((i) => {
      if (i.resolved_at) {
        const start = new Date(i.created_at).getTime();
        const end = new Date(i.resolved_at).getTime();
        const days = Math.max(0.5, (end - start) / (1000 * 3600 * 24));
        totalResolutionDays += days;
        resolvedCount++;
      }
    });

    const avgResolutionDays =
      resolvedCount > 0 ? Number((totalResolutionDays / resolvedCount).toFixed(1)) : 3.2;

    const recurringClusters = this.getRecurringIssues();

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
      recurringClustersCount: recurringClusters.length,
    };
  }

  // --- Admin Configuration Actions ---
  public addCategory(cat: Omit<IssueCategory, 'id'>) {
    const newCat: IssueCategory = { ...cat, id: `cat-${Date.now()}` };
    this.categories.push(newCat);
    this.addAuditLog({ action: 'CREATE_CATEGORY', entity_type: 'CATEGORY', entity_id: newCat.id });
    this.persist();
  }

  public addDepartment(dept: Omit<Department, 'id'>) {
    const newDept: Department = { ...dept, id: `dept-${Date.now()}` };
    this.departments.push(newDept);
    this.addAuditLog({ action: 'CREATE_DEPARTMENT', entity_type: 'DEPARTMENT', entity_id: newDept.id });
    this.persist();
  }

  public addProject(proj: Omit<PublicProject, 'id' | 'created_at'>) {
    const newProj: PublicProject = {
      ...proj,
      id: `proj-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.projects.push(newProj);
    this.addAuditLog({ action: 'CREATE_PROJECT', entity_type: 'PROJECT', entity_id: newProj.id });
    this.persist();
  }

  public resetToDemoSeed() {
    this.issues = [...INITIAL_ISSUES];
    this.departments = [...INITIAL_DEPARTMENTS];
    this.jurisdictions = [...INITIAL_JURISDICTIONS];
    this.categories = [...INITIAL_CATEGORIES];
    this.projects = [...INITIAL_PROJECTS];
    this.routingRules = [...INITIAL_ROUTING_RULES];
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.currentUser = DEMO_USERS[0];
    this.persist();
  }

  private addNotification(n: Omit<AppNotification, 'id' | 'is_read' | 'created_at'>) {
    const newNotif: AppNotification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.notifications.unshift(newNotif);
  }

  private addAuditLog(log: Omit<AuditLog, 'id' | 'created_at' | 'actor_id' | 'actor_email' | 'actor_role'>) {
    const newAudit: AuditLog = {
      ...log,
      id: `audit-${Date.now()}`,
      actor_id: this.currentUser?.id,
      actor_email: this.currentUser?.email,
      actor_role: this.currentUser?.role,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(newAudit);
  }
}

export const civicStore = CivicDataStore.getInstance();
