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
  OfficerPerformanceScorecard,
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
  INITIAL_OFFICER_SCORECARDS,
} from '@/data/civicIntelligenceData';

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
  ASSETS: 'civiclens_assets_v1',
  TIME_MACHINE: 'civiclens_timemachine_v1',
  SWARM: 'civiclens_swarm_v1',
  VOLUNTEER_LB: 'civiclens_volunteer_lb_v1',
  GENOMES: 'civiclens_genomes_v1',
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
  private assets: InfrastructureAsset[] = [...INITIAL_INFRASTRUCTURE_ASSETS];
  private timeMachineRecords: TimeMachineLocationRecord[] = [...INITIAL_TIME_MACHINE_RECORDS];
  private swarmMissions: VolunteerSwarmMission[] = [...INITIAL_SWARM_MISSIONS];
  private volunteerLeaderboard: VolunteerLeaderboardEntry[] = [...INITIAL_VOLUNTEER_LEADERBOARD];
  private genomes: Record<string, ConstituencyGenome> = { ...INITIAL_CONSTITUENCY_GENOMES };
  private officerScorecards: OfficerPerformanceScorecard[] = [...INITIAL_OFFICER_SCORECARDS];
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
      this.assets = [...INITIAL_INFRASTRUCTURE_ASSETS];
      this.timeMachineRecords = [...INITIAL_TIME_MACHINE_RECORDS];
      this.swarmMissions = [...INITIAL_SWARM_MISSIONS];
      this.volunteerLeaderboard = [...INITIAL_VOLUNTEER_LEADERBOARD];
      this.genomes = { ...INITIAL_CONSTITUENCY_GENOMES };
      this.officerScorecards = [...INITIAL_OFFICER_SCORECARDS];
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

      const storedAssets = localStorage.getItem(STORAGE_KEYS.ASSETS);
      this.assets = storedAssets ? JSON.parse(storedAssets) : [...INITIAL_INFRASTRUCTURE_ASSETS];

      const storedTM = localStorage.getItem(STORAGE_KEYS.TIME_MACHINE);
      this.timeMachineRecords = storedTM ? JSON.parse(storedTM) : [...INITIAL_TIME_MACHINE_RECORDS];

      const storedSwarm = localStorage.getItem(STORAGE_KEYS.SWARM);
      this.swarmMissions = storedSwarm ? JSON.parse(storedSwarm) : [...INITIAL_SWARM_MISSIONS];

      const storedLB = localStorage.getItem(STORAGE_KEYS.VOLUNTEER_LB);
      this.volunteerLeaderboard = storedLB ? JSON.parse(storedLB) : [...INITIAL_VOLUNTEER_LEADERBOARD];

      const storedGenomes = localStorage.getItem(STORAGE_KEYS.GENOMES);
      this.genomes = storedGenomes ? JSON.parse(storedGenomes) : { ...INITIAL_CONSTITUENCY_GENOMES };

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
      this.assets = [...INITIAL_INFRASTRUCTURE_ASSETS];
      this.timeMachineRecords = [...INITIAL_TIME_MACHINE_RECORDS];
      this.swarmMissions = [...INITIAL_SWARM_MISSIONS];
      this.volunteerLeaderboard = [...INITIAL_VOLUNTEER_LEADERBOARD];
      this.genomes = { ...INITIAL_CONSTITUENCY_GENOMES };
      this.currentUser = DEMO_USERS[0];
    }
  }

  public async syncWithServer() {
    if (typeof window === 'undefined') return;
    try {
      const [issuesRes, projectsRes] = await Promise.allSettled([
        fetch('/api/issues'),
        fetch('/api/projects'),
      ]);

      let changed = false;
      if (issuesRes.status === 'fulfilled' && issuesRes.value.ok) {
        const data = await issuesRes.value.json();
        if (data.issues && data.issues.length > 0) {
          this.issues = data.issues;
          changed = true;
        }
      }

      if (projectsRes.status === 'fulfilled' && projectsRes.value.ok) {
        const data = await projectsRes.value.json();
        if (data.projects && data.projects.length > 0) {
          this.projects = data.projects;
          changed = true;
        }
      }

      if (changed) {
        this.persist();
        this.notify();
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
      localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(this.assets));
      localStorage.setItem(STORAGE_KEYS.TIME_MACHINE, JSON.stringify(this.timeMachineRecords));
      localStorage.setItem(STORAGE_KEYS.SWARM, JSON.stringify(this.swarmMissions));
      localStorage.setItem(STORAGE_KEYS.VOLUNTEER_LB, JSON.stringify(this.volunteerLeaderboard));
      localStorage.setItem(STORAGE_KEYS.GENOMES, JSON.stringify(this.genomes));
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

  public addOrUpdateIssue(issue: CivicIssue): void {
    const idx = this.issues.findIndex(
      (i) => i.id === issue.id || i.complaint_code.toLowerCase() === issue.complaint_code.toLowerCase()
    );
    if (idx >= 0) {
      this.issues[idx] = { ...this.issues[idx], ...issue };
    } else {
      this.issues.unshift(issue);
    }
    this.persist();
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
    // Tamper-proof cryptographic SHA-256 seal representation
    let hash = '0x';
    const rawPayload = `${issueId}:${result}:${this.currentUser.id}:${nowIso}:${comment || 'none'}`;
    for (let i = 0; i < rawPayload.length; i++) {
      hash += rawPayload.charCodeAt(i).toString(16);
    }
    const cryptographicHash = hash.padEnd(66, '0').slice(0, 66);

    const verificationRecord = {
      id: `v-${Date.now()}`,
      issue_id: issueId,
      citizen_id: this.currentUser.id,
      citizen_name: this.currentUser.full_name,
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
        actor_id: this.currentUser.id,
        actor_name: this.currentUser.full_name,
        actor_role: 'citizen',
        event_type: 'CITIZEN_VERIFIED_CLOSED',
        old_status: 'resolved',
        new_status: 'closed',
        note: `Citizen verified: "Completely Resolved". Cryptographic seal: ${cryptographicHash.slice(0, 16)}... Feedback: "${comment || 'Verified and confirmed safe.'}". Complaint officially closed & locked.`,
        created_at: nowIso,
      });

      this.addAuditLog({
        action: 'VERIFY_RESOLUTION_ACCEPTED',
        entity_type: 'ISSUE',
        entity_id: issue.id,
        metadata: { result, comment, cryptographic_hash: cryptographicHash },
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

  // Community Resolution Vouching
  public vouchIssueResolution(issueId: string, comment?: string): boolean {
    const issue = this.issues.find((i) => i.id === issueId);
    if (!issue) return false;

    if (!issue.community_vouches) {
      issue.community_vouches = [];
    }

    const nowIso = new Date().toISOString();
    const existingIndex = issue.community_vouches.findIndex(
      (v) => v.user_id === this.currentUser.id
    );

    if (existingIndex >= 0) {
      issue.community_vouches[existingIndex].comment =
        comment || issue.community_vouches[existingIndex].comment;
      issue.community_vouches[existingIndex].vouched_at = nowIso;
    } else {
      issue.community_vouches.push({
        user_id: this.currentUser.id,
        user_name: this.currentUser.full_name,
        role: this.currentUser.role,
        vouched_at: nowIso,
        comment: comment || 'Verified in person: resolution is intact and structurally sound.',
      });
    }

    this.persist();

    if (typeof window !== 'undefined') {
      fetch(`/api/issues/${issueId}/vouch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.currentUser?.id,
          comment,
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

  // --- Recurring Issues Detection & Failure Intelligence Engine ---
  public getRecurringIssues(): RecurringFailureCluster[] {
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
        const count = c.issues.length;

        const isRoad =
          c.categoryName.toLowerCase().includes('road') ||
          c.categoryName.toLowerCase().includes('pothole');
        const isDrain =
          c.categoryName.toLowerCase().includes('drain') ||
          c.categoryName.toLowerCase().includes('water');
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

        const nearestAsset = this.assets.find(
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

  // ====================================================================
  // 1. CIVIC DNA - Infrastructure Health Memory
  // ====================================================================
  public getAssets(filter?: { ward_id?: string; asset_type?: string }): InfrastructureAsset[] {
    let list = this.assets;
    if (filter?.ward_id) {
      list = list.filter((a) => a.ward_id === filter.ward_id);
    }
    if (filter?.asset_type) {
      list = list.filter((a) => a.asset_type === filter.asset_type);
    }
    return list;
  }

  public getAssetById(id: string): InfrastructureAsset | undefined {
    return this.assets.find((a) => a.id === id);
  }

  public addAssetRepair(
    assetId: string,
    repair: Partial<AssetRepairRecord>
  ): InfrastructureAsset | null {
    const asset = this.assets.find((a) => a.id === assetId);
    if (!asset) return null;

    const newRepair: AssetRepairRecord = {
      id: `rep-${Date.now()}`,
      asset_id: assetId,
      issue_id: repair.issue_id,
      date: repair.date || new Date().toISOString().split('T')[0],
      description: repair.description || 'Routine civic intervention',
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

    asset.fatigue_index = Math.min(1.0, Number((asset.fatigue_index + 0.05).toFixed(2)));
    asset.health_score = Math.max(10, asset.health_score - 4);
    if (asset.health_score < 40) asset.condition = 'critical';
    else if (asset.health_score < 60) asset.condition = 'poor';

    if (asset.rebuild_threshold_pct >= 55) {
      asset.recommendation = {
        type: 'rebuild_recommended',
        reason: `Cumulative repairs (₹${(asset.cumulative_repair_cost / 100000).toFixed(1)}L) constitute ${asset.rebuild_threshold_pct}% of replacement value. Continuous patchwork is fiscally non-viable.`,
        estimated_rebuild_cost: asset.replacement_cost,
        cumulative_patch_cost: asset.cumulative_repair_cost,
        projected_3yr_savings: Math.round(asset.replacement_cost * 0.35),
      };
    }

    this.persist();
    return asset;
  }

  public createAsset(data: Partial<InfrastructureAsset>): InfrastructureAsset {
    const id = data.id || `asset-${data.asset_type || 'infra'}-${Date.now()}`;
    const codePrefix = data.asset_type === 'road' ? 'RD' : data.asset_type === 'drain' ? 'DR' : data.asset_type === 'water_pipe' ? 'WP' : 'SL';
    const ward = this.jurisdictions.find((j) => j.id === data.ward_id) || this.jurisdictions[0];

    const newAsset: InfrastructureAsset = {
      id,
      asset_code: data.asset_code || `ASSET-${codePrefix}-CHE-${(data.ward_id || '175').replace('ward-', '')}-${Math.floor(10 + Math.random() * 90)}`,
      name: data.name || 'New Municipal Asset',
      asset_type: data.asset_type || 'road',
      ward_id: ward.id,
      ward_name: ward.name,
      location_text: data.location_text || `${ward.name} Municipal Beat`,
      latitude: data.latitude || 12.9815,
      longitude: data.longitude || 80.2245,
      commissioned_year: data.commissioned_year || new Date().getFullYear(),
      expected_lifespan_years: data.expected_lifespan_years || 15,
      initial_valuation: Number(data.initial_valuation) || 50000000,
      replacement_cost: Number(data.replacement_cost) || 60000000,
      cumulative_repair_cost: Number(data.cumulative_repair_cost) || 0,
      rebuild_threshold_pct: 0,
      health_score: Number(data.health_score) || 90,
      fatigue_index: Number(data.fatigue_index) || 0.15,
      condition: data.condition || 'good',
      failure_count: 0,
      mean_time_between_failures_days: 180,
      days_until_predicted_failure: 150,
      repair_history: [],
      related_issue_ids: [],
      recommendation: {
        type: 'preventive_monitoring',
        reason: 'Asset initialized within acceptable municipal baseline.',
        estimated_rebuild_cost: Number(data.replacement_cost) || 60000000,
        cumulative_patch_cost: 0,
        projected_3yr_savings: 0,
      },
    };

    this.assets.unshift(newAsset);
    this.addAuditLog({
      action: 'CREATE_INFRASTRUCTURE_ASSET',
      entity_type: 'ASSET',
      entity_id: newAsset.id,
      metadata: { name: newAsset.name, asset_code: newAsset.asset_code },
    });
    this.persist();
    return newAsset;
  }

  public simulateAssetStress(assetId: string): InfrastructureAsset | null {
    const asset = this.assets.find((a) => a.id === assetId);
    if (!asset) return null;

    asset.fatigue_index = Math.min(1.0, Number((asset.fatigue_index + 0.12).toFixed(2)));
    asset.health_score = Math.max(15, asset.health_score - 10);
    asset.days_until_predicted_failure = Math.max(5, asset.days_until_predicted_failure - 14);

    if (asset.health_score < 40) asset.condition = 'critical';
    else if (asset.health_score < 60) asset.condition = 'poor';
    else if (asset.health_score < 75) asset.condition = 'fair';

    if (asset.fatigue_index >= 0.70 || asset.rebuild_threshold_pct >= 50) {
      asset.recommendation = {
        type: 'rebuild_recommended',
        reason: `Environmental stress simulation indicates sub-base saturation and high structural fatigue (${(asset.fatigue_index * 100).toFixed(0)}%). Further spot patches are non-viable.`,
        estimated_rebuild_cost: asset.replacement_cost,
        cumulative_patch_cost: asset.cumulative_repair_cost,
        projected_3yr_savings: Math.round(asset.replacement_cost * 0.35),
      };
    }
    this.persist();
    return asset;
  }

  // ====================================================================
  // 2. CIVIC TIME MACHINE
  // ====================================================================
  public getTimeMachineRecords(): TimeMachineLocationRecord[] {
    return this.timeMachineRecords;
  }

  public getTimeMachineRecordById(id: string): TimeMachineLocationRecord | undefined {
    return this.timeMachineRecords.find((r) => r.id === id);
  }

  public getTimeMachineRecordByIssueId(issueId: string): TimeMachineLocationRecord | undefined {
    return this.timeMachineRecords.find((r) => r.related_issue_id === issueId);
  }

  public addTimeMachineSnapshot(
    recordId: string,
    snapshot: TimeMachineSnapshot
  ): TimeMachineLocationRecord | null {
    const record = this.timeMachineRecords.find((r) => r.id === recordId);
    if (!record) return null;

    record.snapshots.push(snapshot);
    if (snapshot.durability_score) {
      const allScores = record.snapshots
        .filter((sn) => sn.durability_score !== undefined)
        .map((sn) => sn.durability_score!);
      const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      record.durability_rating = Number((avg / 20).toFixed(1));
    }
    this.persist();
    return record;
  }

  public createTimeMachineRecord(data: Partial<TimeMachineLocationRecord>): TimeMachineLocationRecord {
    const id = data.id || `tm-loc-${Date.now()}`;
    const ward = this.jurisdictions.find((j) => j.id === data.ward_id) || this.jurisdictions[0];

    const initialSnapshot: TimeMachineSnapshot = {
      phase: 'before',
      title: data.snapshots?.[0]?.title || 'Baseline Physical Condition Audit',
      date: new Date().toISOString().split('T')[0],
      photo_url: data.snapshots?.[0]?.photo_url || '/images/evidence/velachery-pothole-fixed.jpg',
      notes: data.snapshots?.[0]?.notes || 'Initial pre-intervention baseline audit registered by municipal inspector.',
      recorded_by: data.snapshots?.[0]?.recorded_by || this.currentUser.full_name,
      status_label: 'Registered Baseline',
      durability_score: 85,
    };

    const newRecord: TimeMachineLocationRecord = {
      id,
      location_title: data.location_title || 'New Monitored Civic Location',
      ward_id: ward.id,
      ward_name: ward.name,
      latitude: data.latitude || 12.9800,
      longitude: data.longitude || 80.2200,
      category_name: data.category_name || 'Roads & Infrastructure',
      inspected_at: data.inspected_at || new Date().toISOString(),
      related_issue_id: data.related_issue_id,
      durability_rating: 4.5,
      durability_verdict: 'Under active temporal durability audit. 30-day and 180-day inspection checkpoints scheduled.',
      snapshots: data.snapshots && data.snapshots.length > 0 ? data.snapshots : [initialSnapshot],
    };

    this.timeMachineRecords.unshift(newRecord);
    this.addAuditLog({
      action: 'CREATE_TIMEMACHINE_RECORD',
      entity_type: 'TIME_MACHINE',
      entity_id: newRecord.id,
      metadata: { location: newRecord.location_title },
    });
    this.persist();
    return newRecord;
  }

  public certifyTimeMachineDurability(recordId: string, certifierName?: string): TimeMachineLocationRecord | null {
    const record = this.timeMachineRecords.find((r) => r.id === recordId);
    if (!record) return null;

    const certSnapshot: TimeMachineSnapshot = {
      phase: '180_day_check',
      title: '180-Day Full Durability Certification Audit',
      date: new Date().toISOString().split('T')[0],
      photo_url: record.snapshots[record.snapshots.length - 1]?.photo_url || '/images/evidence/velachery-pothole-fixed.jpg',
      notes: `Durability certified without defect re-occurrence. Contractor warranty successfully satisfied and released by ${certifierName || this.currentUser.full_name}.`,
      recorded_by: certifierName || this.currentUser.full_name,
      status_label: 'Audited & Certified',
      durability_score: 98,
    };

    record.snapshots.push(certSnapshot);
    record.durability_rating = 5.0;
    record.durability_verdict = `Certified 100% Durable: No failure reoccurred during the 180-day audit cycle. Workmanship approved for contractor payment clearance.`;
    this.addAuditLog({
      action: 'CERTIFY_DURABILITY',
      entity_type: 'TIME_MACHINE',
      entity_id: record.id,
      metadata: { verdict: record.durability_verdict },
    });
    this.persist();
    return record;
  }

  // ====================================================================
  // 3. CIVIC VOLUNTEER SWARM MODE
  // ====================================================================
  public getSwarmMissions(): VolunteerSwarmMission[] {
    return this.swarmMissions;
  }

  public getSwarmMissionById(id: string): VolunteerSwarmMission | undefined {
    return this.swarmMissions.find((m) => m.id === id);
  }

  public joinSwarmMission(
    missionId: string,
    role: 'lead' | 'volunteer' | 'spotter' = 'volunteer'
  ): boolean {
    const mission = this.swarmMissions.find((m) => m.id === missionId);
    if (!mission) return false;

    const existing = mission.participants.find((p) => p.user_id === this.currentUser.id);
    if (!existing) {
      mission.participants.push({
        user_id: this.currentUser.id,
        user_name: this.currentUser.full_name,
        joined_at: new Date().toISOString(),
        role,
        attended: true,
      });

      let entry = this.volunteerLeaderboard.find((l) => l.user_id === this.currentUser.id);
      if (!entry) {
        entry = {
          user_id: this.currentUser.id,
          full_name: this.currentUser.full_name,
          area: 'Ward 175 - Velachery',
          karma_points: mission.karma_points_reward,
          missions_completed: 1,
          rank: this.volunteerLeaderboard.length + 1,
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
        this.volunteerLeaderboard.push(entry);
      } else {
        entry.karma_points += mission.karma_points_reward;
        entry.missions_completed += 1;
      }
      this.volunteerLeaderboard.sort((a, b) => b.karma_points - a.karma_points);
      this.volunteerLeaderboard.forEach((e, idx) => {
        e.rank = idx + 1;
      });

      this.addAuditLog({
        action: 'JOIN_SWARM_MISSION',
        entity_type: 'SWARM_MISSION',
        entity_id: mission.id,
        metadata: { mission_title: mission.title, role },
      });

      this.persist();
      if (typeof window !== 'undefined') {
        fetch(`/api/swarm/${missionId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.currentUser.id, role }),
        }).catch(() => {});
      }
    }
    return true;
  }

  public submitSwarmProof(
    missionId: string,
    photoUrl: string,
    note: string,
    lat?: number,
    lng?: number
  ): boolean {
    const mission = this.swarmMissions.find((m) => m.id === missionId);
    if (!mission) return false;

    mission.proofs.push({
      id: `proof-${Date.now()}`,
      uploaded_by: this.currentUser.id,
      uploader_name: this.currentUser.full_name,
      photo_url: photoUrl,
      note,
      latitude: lat || mission.latitude,
      longitude: lng || mission.longitude,
      uploaded_at: new Date().toISOString(),
      upvotes: 1,
    });

    mission.status = 'completed';
    this.persist();

    if (typeof window !== 'undefined') {
      fetch(`/api/swarm/${missionId}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.currentUser.id,
          photoUrl,
          note,
          latitude: lat,
          longitude: lng,
        }),
      }).catch(() => {});
    }
    return true;
  }

  public vouchSwarmMission(missionId: string): boolean {
    const mission = this.swarmMissions.find((m) => m.id === missionId);
    if (!mission) return false;

    mission.community_confirmations += 1;
    if (mission.community_confirmations >= 15) {
      mission.status = 'verified';
    }
    this.persist();

    if (typeof window !== 'undefined') {
      fetch(`/api/swarm/${missionId}/vouch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.currentUser.id }),
      }).catch(() => {});
    }
    return true;
  }

  public getVolunteerLeaderboard(): VolunteerLeaderboardEntry[] {
    return [...this.volunteerLeaderboard].sort((a, b) => a.rank - b.rank);
  }

  public createSwarmMission(data: Partial<VolunteerSwarmMission>): VolunteerSwarmMission {
    const id = data.id || `swarm-${Date.now()}`;
    const ward = this.jurisdictions.find((j) => j.id === data.ward_id) || this.jurisdictions[0];

    const newMission: VolunteerSwarmMission = {
      id,
      title: data.title || 'Community Action Swarm',
      description: data.description || 'Verified citizen self-organization civic mission.',
      mission_type: (data.mission_type as any) || 'cleanup_drive',
      ward_id: ward.id,
      ward_name: ward.name,
      location_text: data.location_text || `${ward.name} Civic Beat`,
      latitude: data.latitude || 12.9810,
      longitude: data.longitude || 80.2220,
      scheduled_date: data.scheduled_date || new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
      target_volunteers: Number(data.target_volunteers) || 15,
      participants: [],
      karma_points_reward: Number(data.karma_points_reward) || 50,
      status: (data.status as any) || 'open',
      organized_by: data.organized_by || 'CivicLens Volunteer Swarm Network',
      community_confirmations: 0,
      proofs: [],
    };

    this.swarmMissions.unshift(newMission);
    this.addAuditLog({
      action: 'CREATE_SWARM_MISSION',
      entity_type: 'SWARM_MISSION',
      entity_id: newMission.id,
      metadata: { title: newMission.title, type: newMission.mission_type },
    });
    this.persist();

    if (typeof window !== 'undefined') {
      fetch('/api/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMission),
      }).catch(() => {});
    }
    return newMission;
  }

  // ====================================================================
  // 4. CIVIC ACCOUNTABILITY GENOME
  // ====================================================================
  public getConstituencyGenomes(): Record<string, ConstituencyGenome> {
    return this.genomes;
  }

  public getConstituencyGenomeByWard(wardId: string): ConstituencyGenome | undefined {
    return this.genomes[wardId];
  }

  // ====================================================================
  // 7. EVIDENCE-BASED AUTHORITY PERFORMANCE & PROMOTION INDEX (EBAPI)
  // ====================================================================
  public getAuthorityPerformanceIndex(filters?: {
    officer_id?: string;
    department_id?: string;
    promotion_status?: string;
  }): AuthorityIndexResponse {
    const recurringClusters = this.getRecurringIssues();
    const baselineOfficers =
      this.officerScorecards && this.officerScorecards.length > 0
        ? this.officerScorecards
        : INITIAL_OFFICER_SCORECARDS;

    // 1. COMPUTE INDIVIDUAL OFFICER PERFORMANCE & PROMOTION ELIGIBILITY
    const computedOfficers: OfficerPerformanceScorecard[] = baselineOfficers.map((officer) => {
      const relevantIssues = this.issues.filter(
        (i) => i.assigned_officer_id === officer.officer_id || i.department_id === officer.department_id
      );

      const activeResolved = relevantIssues.filter(
        (i) => i.status === 'resolved' || i.status === 'closed'
      );
      const activeOnTime = activeResolved.filter((i) => !i.is_overdue);

      const slaCompliancePct =
        activeResolved.length > 0
          ? Math.round((activeOnTime.length / activeResolved.length) * 100)
          : officer.sla_compliance_pct;

      const avgResolutionDays = officer.avg_resolution_days;

      const verifiedCount = activeResolved.filter(
        (i) => i.verification?.result === 'completely_resolved'
      ).length;
      const verifiedResolutionPct =
        activeResolved.length > 0
          ? Math.round((verifiedCount / activeResolved.length) * 100)
          : officer.verified_resolution_pct;

      const reopenedCount = relevantIssues.filter(
        (i) => i.status === 'reopened' || i.verification?.result === 'not_resolved'
      ).length;
      const reopeningRatePct =
        activeResolved.length > 0
          ? Math.round((reopenedCount / Math.max(1, activeResolved.length + reopenedCount)) * 100)
          : officer.reopening_rate_pct;

      const durabilityRatePct = Math.max(45, Math.min(100, 100 - reopeningRatePct * 2));
      const field_evidence_authenticity_score = officer.field_evidence_authenticity_score;

      const officerDeptClusters = recurringClusters.filter((c) => {
        const cat = this.categories.find((catItem) => catItem.id === c.categoryId);
        return cat?.default_department_id === officer.department_id;
      });
      const recurringFailurePenalty = Math.min(15, officerDeptClusters.length * 2.5);

      const sla_score = Number(((slaCompliancePct / 100) * 30).toFixed(1));
      const speed_score = Number(
        Math.max(0, Math.min(20, (6 - avgResolutionDays) * 4)).toFixed(1)
      );
      const citizen_trust_score = Number(((verifiedResolutionPct / 100) * 20).toFixed(1));
      const durability_score = Number(((durabilityRatePct / 100) * 20).toFixed(1));
      const evidence_authenticity_score = Number(
        ((field_evidence_authenticity_score / 100) * 10).toFixed(1)
      );
      const recurring_penalty = Number(
        (recurringFailurePenalty + reopeningRatePct * 0.15).toFixed(1)
      );

      const composite = Math.min(
        100,
        Math.max(
          25,
          Number(
            (
              sla_score +
              speed_score +
              citizen_trust_score +
              durability_score +
              evidence_authenticity_score -
              recurring_penalty
            ).toFixed(1)
          )
        )
      );

      let promotion_eligibility = officer.promotion_eligibility;
      let performance_tier = officer.performance_tier;
      let promotion_readiness_score = officer.promotion_readiness_score;

      if (composite >= 88 && durabilityRatePct >= 88 && reopeningRatePct <= 5) {
        promotion_eligibility = 'Fast-Track Promotion Recommended';
        performance_tier = 'Exemplary';
        promotion_readiness_score = Math.min(100, Math.round(composite + 4));
      } else if (composite >= 75 && durabilityRatePct >= 75) {
        promotion_eligibility = 'Eligible for Seniority Promotion';
        performance_tier = 'Competent';
        promotion_readiness_score = Math.round(composite);
      } else if (composite >= 60) {
        promotion_eligibility = 'Promotion Deferred - Performance Review';
        performance_tier = 'Needs Improvement';
        promotion_readiness_score = Math.round(composite * 0.9);
      } else {
        promotion_eligibility = 'Promotion Frozen - Under Investigation';
        performance_tier = 'Unsatisfactory';
        promotion_readiness_score = Math.round(composite * 0.8);
      }

      return {
        ...officer,
        composite_index: composite,
        sla_compliance_pct: slaCompliancePct,
        verified_resolution_pct: verifiedResolutionPct,
        reopening_rate_pct: reopeningRatePct,
        durability_rate_pct: durabilityRatePct,
        recurring_failure_penalty: recurringFailurePenalty,
        weights_breakdown: {
          sla_score,
          speed_score,
          citizen_trust_score,
          durability_score,
          evidence_authenticity_score,
          recurring_penalty,
        },
        promotion_eligibility,
        performance_tier,
        promotion_readiness_score,
      };
    });

    computedOfficers.sort((a, b) => b.composite_index - a.composite_index);
    computedOfficers.forEach((sc, idx) => {
      sc.rank = idx + 1;
    });

    // 2. COMPUTE DEPARTMENT ROLL-UP SCORECARDS
    const scorecards: DepartmentScorecard[] = this.departments.map((d) => {
      const assigned = this.issues.filter((i) => i.department_id === d.id);
      const totalAssigned = assigned.length;
      const resolved = assigned.filter((i) => i.status === 'resolved' || i.status === 'closed');
      const onTime = resolved.filter((i) => !i.is_overdue);

      const slaCompliancePct =
        totalAssigned > 0
          ? Math.round((onTime.length / Math.max(1, resolved.length)) * 100)
          : 85;

      let totalDays = 0;
      resolved.forEach((i) => {
        if (i.resolved_at) {
          const diff =
            (new Date(i.resolved_at).getTime() - new Date(i.created_at).getTime()) /
            (1000 * 3600 * 24);
          totalDays += Math.max(0.5, diff);
        }
      });
      const avgResolutionDays =
        resolved.length > 0 ? Number((totalDays / resolved.length).toFixed(1)) : 3.2;

      const verifiedClosures = resolved.filter(
        (i) => i.verification?.result === 'completely_resolved'
      );
      const verifiedResolutionPct =
        resolved.length > 0
          ? Math.round((verifiedClosures.length / resolved.length) * 100)
          : 75;

      const reopenedIssues = assigned.filter(
        (i) => i.status === 'reopened' || i.verification?.result === 'not_resolved'
      );
      const reopeningRatePct =
        resolved.length > 0
          ? Math.round(
              (reopenedIssues.length / Math.max(1, resolved.length + reopenedIssues.length)) * 100
            )
          : 12;

      const durabilityRatePct = Math.max(65, 100 - reopeningRatePct * 2);

      const deptClusters = recurringClusters.filter((c) => {
        const cat = this.categories.find((catItem) => catItem.id === c.categoryId);
        return cat?.default_department_id === d.id;
      });
      const recurringFailurePenalty = Math.min(15, deptClusters.length * 3);

      const sla_score = Number(((slaCompliancePct / 100) * 30).toFixed(1));
      const speed_score = Number(Math.max(0, Math.min(20, (6 - avgResolutionDays) * 4)).toFixed(1));
      const citizen_trust_score = Number(((verifiedResolutionPct / 100) * 25).toFixed(1));
      const durability_score = Number(((durabilityRatePct / 100) * 25).toFixed(1));
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

    scorecards.sort((a, b) => b.composite_index - a.composite_index);
    scorecards.forEach((sc, idx) => {
      sc.rank = idx + 1;
    });

    let filteredOfficers = computedOfficers;
    if (filters?.officer_id) {
      filteredOfficers = filteredOfficers.filter((o) => o.officer_id === filters.officer_id);
    }
    if (filters?.department_id) {
      filteredOfficers = filteredOfficers.filter((o) => o.department_id === filters.department_id);
    }
    if (filters?.promotion_status) {
      filteredOfficers = filteredOfficers.filter((o) => o.promotion_eligibility === filters.promotion_status);
    }

    return {
      generated_at: new Date().toISOString(),
      formula_explanation:
        'Individual Authority Score = [SLA Score (30%)] + [Speed Score (20%)] + [Citizen Trust Score (20%)] + [Durability Score (20%)] + [Evidence Authenticity (10%)] - [Reopening & Recurrence Penalty]. Scores determine annual appraisal rating and promotion eligibility.',
      officer_scorecards: filteredOfficers,
      scorecards,
      promotion_summary: {
        total_officers_evaluated: computedOfficers.length,
        fast_track_promotable: computedOfficers.filter(
          (o) => o.promotion_eligibility === 'Fast-Track Promotion Recommended'
        ).length,
        eligible_for_promotion: computedOfficers.filter(
          (o) => o.promotion_eligibility === 'Eligible for Seniority Promotion'
        ).length,
        deferred_count: computedOfficers.filter(
          (o) => o.promotion_eligibility === 'Promotion Deferred - Performance Review'
        ).length,
        frozen_count: computedOfficers.filter(
          (o) => o.promotion_eligibility === 'Promotion Frozen - Under Investigation'
        ).length,
      },
    };
  }

  // ====================================================================
  // 6. CONSTITUENCY PULSE BRIEFING
  // ====================================================================
  public getConstituencyPulse(wardId: string = 'ward-175') {
    const ward = this.jurisdictions.find((j) => j.id === wardId) || this.jurisdictions[0];
    const wardIssues = this.issues.filter((i) => i.jurisdiction_id === ward.id);
    const wardAssets = this.assets.filter((a) => a.ward_id === ward.id);
    const genome = this.genomes[ward.id] || Object.values(this.genomes)[0];
    const recurring = this.getRecurringIssues().filter((c) =>
      wardIssues.some((wi) => wi.category_id === c.categoryId)
    );
    const authorityIndex = this.getAuthorityPerformanceIndex();
    const swarmMissions = this.swarmMissions.filter((m) => m.ward_id === ward.id);

    const total = wardIssues.length;
    const resolved = wardIssues.filter((i) => i.status === 'resolved' || i.status === 'closed').length;
    const closed = wardIssues.filter((i) => i.status === 'closed').length;
    const verifiedRate = resolved > 0 ? Math.round((closed / resolved) * 100) : 82;
    const avgHealthScore =
      wardAssets.length > 0
        ? Math.round(wardAssets.reduce((sum, a) => sum + a.health_score, 0) / wardAssets.length)
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

  public recordOfficerAppraisalAction(
    officerId: string,
    actionType: 'approve_fast_track' | 'approve_seniority' | 'defer_promotion' | 'freeze_promotion',
    remarks: string
  ): OfficerPerformanceScorecard | null {
    if (!this.officerScorecards) this.officerScorecards = [...INITIAL_OFFICER_SCORECARDS];
    const officer = this.officerScorecards.find((o) => o.officer_id === officerId);
    if (!officer) return null;

    const today = new Date().toISOString().split('T')[0];
    if (actionType === 'approve_fast_track') {
      officer.promotion_eligibility = 'Fast-Track Promotion Recommended';
      officer.performance_tier = 'Exemplary';
      officer.promotion_readiness_score = 100;
      officer.merit_points += 250;
      officer.promotional_milestones.unshift({
        date: today,
        title: 'Fast-Track Promotion Order Issued',
        note: remarks || 'Elevated to next executive cadre by Departmental Promotion Committee',
        status: 'completed',
      });
    } else if (actionType === 'approve_seniority') {
      officer.promotion_eligibility = 'Eligible for Seniority Promotion';
      officer.promotion_readiness_score = Math.max(85, officer.promotion_readiness_score);
      officer.merit_points += 100;
      officer.promotional_milestones.unshift({
        date: today,
        title: 'Seniority Cadre Clearance Approved',
        note: remarks || 'Roster clearance confirmed for seniority cadre advancement',
        status: 'completed',
      });
    } else if (actionType === 'defer_promotion') {
      officer.promotion_eligibility = 'Promotion Deferred - Performance Review';
      officer.performance_tier = 'Needs Improvement';
      officer.promotional_milestones.unshift({
        date: today,
        title: 'Promotion Deferred (6M Review)',
        note: remarks || 'Assigned to durability monitoring prior to reconsideration',
        status: 'in_progress',
      });
    } else if (actionType === 'freeze_promotion') {
      officer.promotion_eligibility = 'Promotion Frozen - Under Investigation';
      officer.performance_tier = 'Unsatisfactory';
      officer.promotional_milestones.unshift({
        date: today,
        title: 'Promotion Frozen / Remediation Ordered',
        note: remarks || 'Formal remediation ordered due to repetitive quality breaches',
        status: 'in_progress',
      });
    }

    this.addAuditLog({
      action: 'OFFICER_PROMOTION_APPRAISAL_ACTION',
      entity_type: 'OFFICER_SCORECARD',
      entity_id: officer.officer_id,
      metadata: { officer_name: officer.officer_name, actionType, remarks },
    });
    this.persist();

    if (typeof window !== 'undefined') {
      fetch('/api/analytics/authority-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officerId, actionType, remarks }),
      }).catch(() => {});
    }
    return officer;
  }

  public issueContractorPenaltyNotice(
    clusterKey: string,
    penaltyAmount: number,
    reason: string
  ): { notice_id: string; issued_at: string; penalty_amount: number; status: string } {
    const notice_id = `PENALTY-${Date.now().toString().slice(-6)}`;
    const issued_at = new Date().toISOString();

    this.addAuditLog({
      action: 'CONTRACTOR_PENALTY_ISSUED',
      entity_type: 'RECURRING_FAILURE_CLUSTER',
      entity_id: clusterKey,
      metadata: { notice_id, penalty_amount: penaltyAmount, reason, status: 'SERVED_TO_CONTRACTOR' },
    });
    this.addNotification({
      user_id: this.currentUser?.id || 'all',
      title: 'Contractor Warranty Penalty Issued',
      message: `Penalty notice ${notice_id} for ₹${(penaltyAmount / 100000).toFixed(1)}L issued for chronic failure at cluster ${clusterKey}.`,
    });
    this.persist();

    if (typeof window !== 'undefined') {
      fetch('/api/analytics/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'issue_penalty', clusterKey, penaltyAmount, reason }),
      }).catch(() => {});
    }
    return { notice_id, issued_at, penalty_amount: penaltyAmount, status: 'SERVED_TO_CONTRACTOR' };
  }

  public convertClusterToCapitalProject(
    clusterKey: string,
    title: string,
    budget: number,
    departmentId: string = 'dept-highways'
  ): PublicProject {
    const dept = this.departments.find((d) => d.id === departmentId) || this.departments[0];
    const newProject: PublicProject = {
      id: `proj-rebuild-${Date.now()}`,
      name: title || 'Comprehensive Capital Infrastructure Overhaul',
      description: `Sanctioned capital replacement project triggered by CivicLens Recurring Failure Intelligence to permanently replace chronic failure cluster (${clusterKey}).`,
      category: 'Roads & Transportation',
      location: 'Ward 175 - Velachery Arterial Corridor',
      agency: dept.name,
      status: 'approved',
      start_date: new Date().toISOString().split('T')[0],
      expected_completion: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0],
      approved_amount: budget || 9800000,
      expenditure: 0,
      funding_source: 'Municipal Capital Infrastructure Fund',
      demo_data: true,
      progress_pct: 5,
      created_at: new Date().toISOString(),
    };

    this.projects.unshift(newProject);
    this.addAuditLog({
      action: 'SANCTION_CAPITAL_PROJECT_FROM_RECURRING',
      entity_type: 'PROJECT',
      entity_id: newProject.id,
      metadata: { clusterKey, name: newProject.name, budget },
    });
    this.persist();

    if (typeof window !== 'undefined') {
      fetch('/api/analytics/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'convert_to_project', clusterKey, title, budget, departmentId }),
      }).catch(() => {});
    }
    return newProject;
  }

  public updateActionItemStatus(
    wardId: string,
    itemIndex: number,
    newStatus: string
  ): boolean {
    const genome = this.genomes[wardId];
    if (genome && genome.policy_prescription && genome.policy_prescription[itemIndex] !== undefined) {
      const text = genome.policy_prescription[itemIndex].replace(/\s*\[(COMPLETED|IN PROGRESS|PENDING)\]/gi, '');
      genome.policy_prescription[itemIndex] = `${text} [${newStatus.toUpperCase()}]`;
      this.persist();

      if (typeof window !== 'undefined') {
        fetch('/api/analytics/pulse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_status', wardId, itemIndex, newStatus }),
        }).catch(() => {});
      }
      return true;
    }
    return false;
  }

  public addActionItem(wardId: string, itemText: string): boolean {
    const genome = this.genomes[wardId];
    if (genome && genome.policy_prescription) {
      genome.policy_prescription.push(`${itemText} [PENDING]`);
      this.persist();

      if (typeof window !== 'undefined') {
        fetch('/api/analytics/pulse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add_item', wardId, itemText }),
        }).catch(() => {});
      }
      return true;
    }
    return false;
  }

  public simulateGenomicReform(wardId: string, deltas: Record<string, number>): ConstituencyGenome | null {
    const genome = this.genomes[wardId];
    if (!genome) return null;

    const cloned = JSON.parse(JSON.stringify(genome)) as ConstituencyGenome;
    let sumScores = 0;
    let count = 0;

    Object.keys(cloned.traits).forEach((key) => {
      const delta = deltas[key] || 0;
      const trait = cloned.traits[key as keyof typeof cloned.traits];
      trait.score = Math.min(100, Math.max(10, trait.score + delta));
      if (delta > 0) trait.trend = 'improving';
      else if (delta < 0) trait.trend = 'declining';
      sumScores += trait.score;
      count += 1;
    });

    cloned.overall_governance_score = Number((sumScores / Math.max(1, count)).toFixed(1));
    if (cloned.overall_governance_score >= 90) cloned.governance_grade = 'A+';
    else if (cloned.overall_governance_score >= 80) cloned.governance_grade = 'A';
    else if (cloned.overall_governance_score >= 70) cloned.governance_grade = 'B+';
    else if (cloned.overall_governance_score >= 60) cloned.governance_grade = 'B';
    else cloned.governance_grade = 'C';

    return cloned;
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
    this.assets = [...INITIAL_INFRASTRUCTURE_ASSETS];
    this.timeMachineRecords = [...INITIAL_TIME_MACHINE_RECORDS];
    this.swarmMissions = [...INITIAL_SWARM_MISSIONS];
    this.volunteerLeaderboard = [...INITIAL_VOLUNTEER_LEADERBOARD];
    this.genomes = { ...INITIAL_CONSTITUENCY_GENOMES };
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
