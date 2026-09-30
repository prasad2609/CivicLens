import {
  CivicIssue,
  UserProfile,
  Department,
  Jurisdiction,
  IssueCategory,
  PublicProject,
  AuditLog,
  AppNotification,
  IssueStatus,
  IssueSeverity,
  VerificationResult,
  UserRole,
} from '@/types';

class CivicApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      let errMsg = `Request failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData.error) errMsg = errorData.error;
      } catch {
        // ignore
      }
      throw new Error(errMsg);
    }

    return res.json();
  }

  // --- Auth ---
  public async login(email: string, password?: string): Promise<{ success: boolean; user: UserProfile }> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  public async register(data: {
    full_name: string;
    email: string;
    password?: string;
    phone?: string;
    role?: UserRole;
    preferred_language?: 'en' | 'ta';
    area?: string;
  }): Promise<{ success: boolean; user: UserProfile }> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async logout(): Promise<{ success: boolean }> {
    return this.request('/api/auth/logout', { method: 'POST' });
  }

  public async getMe(userId?: string): Promise<{ user: UserProfile | null }> {
    const url = userId ? `/api/auth/me?userId=${encodeURIComponent(userId)}` : '/api/auth/me';
    return this.request(url);
  }

  public async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // --- Issues ---
  public async getIssues(filters?: {
    role?: UserRole;
    citizenId?: string;
    departmentId?: string;
    fieldWorkerId?: string;
    status?: IssueStatus;
    severity?: IssueSeverity;
    categoryId?: string;
    jurisdictionId?: string;
    search?: string;
  }): Promise<{ issues: CivicIssue[]; total: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/issues${query}`);
  }

  public async getIssueById(id: string): Promise<{ issue: CivicIssue }> {
    return this.request(`/api/issues/${id}`);
  }

  public async createIssue(data: {
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
    citizenId?: string;
  }): Promise<{ success: boolean; issue: CivicIssue }> {
    return this.request('/api/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateIssueStatus(
    id: string,
    status: IssueStatus,
    note?: string,
    evidenceUrl?: string,
    actorId?: string
  ): Promise<{ success: boolean; issue: CivicIssue }> {
    return this.request(`/api/issues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note, evidenceUrl, actorId }),
    });
  }

  public async assignFieldWorker(
    issueId: string,
    workerId: string,
    note?: string,
    officerId?: string
  ): Promise<{ success: boolean; issue: CivicIssue }> {
    return this.request(`/api/issues/${issueId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ workerId, note, officerId }),
    });
  }

  public async submitFieldWork(
    issueId: string,
    notes: string,
    photoDataUrl?: string,
    isCompleted: boolean = false,
    workerId?: string
  ): Promise<{ success: boolean; issue: CivicIssue }> {
    return this.request(`/api/issues/${issueId}/field-work`, {
      method: 'POST',
      body: JSON.stringify({ notes, photoDataUrl, isCompleted, workerId }),
    });
  }

  public async resolveIssue(
    issueId: string,
    officialNote: string,
    proofPhotoUrl?: string,
    officerId?: string
  ): Promise<{ success: boolean; issue: CivicIssue }> {
    return this.request(`/api/issues/${issueId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ officialNote, proofPhotoUrl, officerId }),
    });
  }

  public async verifyIssue(
    issueId: string,
    result: VerificationResult,
    comment: string,
    newEvidenceUrl?: string,
    citizenId?: string
  ): Promise<{ success: boolean; issue: CivicIssue }> {
    return this.request(`/api/issues/${issueId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ result, comment, newEvidenceUrl, citizenId }),
    });
  }

  public async escalateIssue(
    issueId: string,
    reason: string,
    details?: string,
    citizenId?: string
  ): Promise<{ success: boolean; issue: CivicIssue }> {
    return this.request(`/api/issues/${issueId}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ reason, details, citizenId }),
    });
  }

  public async checkDuplicates(
    categoryId: string,
    lat: number,
    lng: number,
    radius: number = 350
  ): Promise<{ duplicates: CivicIssue[] }> {
    return this.request(
      `/api/issues?checkDuplicates=true&categoryId=${categoryId}&lat=${lat}&lng=${lng}&radius=${radius}`
    );
  }

  // --- Master Data & Analytics ---
  public async getDepartments(): Promise<{ departments: Department[] }> {
    return this.request('/api/departments');
  }

  public async getJurisdictions(): Promise<{ jurisdictions: Jurisdiction[] }> {
    return this.request('/api/jurisdictions');
  }

  public async getCategories(): Promise<{ categories: IssueCategory[] }> {
    return this.request('/api/categories');
  }

  public async getProjects(): Promise<{ projects: PublicProject[]; total: number }> {
    return this.request('/api/projects');
  }

  public async getProjectById(id: string): Promise<{ project: PublicProject }> {
    return this.request(`/api/projects/${id}`);
  }

  public async getConstituencyAnalytics(): Promise<{ analytics: any }> {
    return this.request('/api/analytics/constituency');
  }

  public async getRecurringIssues(): Promise<{ clusters: any[]; totalClusters: number }> {
    return this.request('/api/analytics/recurring');
  }

  public async getNotifications(userId?: string): Promise<{ notifications: AppNotification[]; total: number }> {
    const url = userId ? `/api/notifications?userId=${encodeURIComponent(userId)}` : '/api/notifications';
    return this.request(url);
  }

  public async markNotificationRead(notificationId: string): Promise<{ success: boolean }> {
    return this.request('/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ notificationId }),
    });
  }

  public async getAuditLogs(): Promise<{ auditLogs: AuditLog[]; total: number }> {
    return this.request('/api/audit-logs');
  }

  public async verifyEvidenceAuthenticity(
    photoDataUrl: string,
    caption?: string
  ): Promise<{ success: boolean; detection: any }> {
    return this.request('/api/evidence/verify-authenticity', {
      method: 'POST',
      body: JSON.stringify({ photoDataUrl, caption }),
    });
  }

  public async resetDatabase(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/admin/seed', { method: 'POST' });
  }
}

export const api = new CivicApiClient();
