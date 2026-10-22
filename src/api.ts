// CO2 Evidence Ledger - API Client
// Detects whether a real backend is available or falls back to demo mode

import type {
  User, Organization, Project, Activity, EvidenceDocument,
  Claim, LedgerEvent, ClaimStatus, IntegrityResult, ExportManifest
} from './types';
import { mockApi } from './services.mock';

// ============ CONFIGURATION ============

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// ============ API MODE DETECTION ============

let apiMode: 'real' | 'demo' | 'unknown' = 'unknown';

export async function detectApiMode(): Promise<'real' | 'demo'> {
  if (apiMode !== 'unknown') return apiMode as 'real' | 'demo';
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'ok' && data.mode !== 'DEMO_FRONTEND_ONLY') {
        apiMode = 'real';
        return 'real';
      }
    }
  } catch {
    // Backend not available
  }
  
  apiMode = 'demo';
  return 'demo';
}

export function getApiMode(): string {
  return apiMode === 'unknown' ? 'detecting...' : apiMode;
}

// ============ REAL API CLIENT ============

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

const realApi = {
  async health() {
    return apiRequest<{ status: string; mode: string }>('/api/health');
  },

  async ready() {
    return apiRequest<{ ready: boolean; database: string }>('/api/ready');
  },

  async login(email: string, password: string): Promise<User> {
    return apiRequest<User>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async logout(): Promise<void> {
    await apiRequest('/api/v1/auth/logout', { method: 'POST' });
  },

  async me(): Promise<User | null> {
    try {
      return await apiRequest<User>('/api/v1/auth/me');
    } catch {
      return null;
    }
  },

  async getOrganizations(): Promise<Organization[]> {
    return apiRequest<Organization[]>('/api/v1/organizations');
  },

  async createOrganization(name: string): Promise<Organization> {
    return apiRequest<Organization>('/api/v1/organizations', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async getProjects(orgId: string): Promise<Project[]> {
    return apiRequest<Project[]>(`/api/v1/projects?organizationId=${orgId}`);
  },

  async createProject(orgId: string, data: Omit<Project, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    return apiRequest<Project>('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getActivities(projectId: string): Promise<Activity[]> {
    return apiRequest<Activity[]>(`/api/v1/activities?projectId=${projectId}`);
  },

  async createActivity(projectId: string, data: any): Promise<Activity> {
    return apiRequest<Activity>('/api/v1/activities', {
      method: 'POST',
      body: JSON.stringify({ ...data, projectId }),
    });
  },

  async getEvidences(orgId: string): Promise<EvidenceDocument[]> {
    return apiRequest<EvidenceDocument[]>(`/api/v1/evidence?organizationId=${orgId}`);
  },

  async uploadEvidence(file: File): Promise<EvidenceDocument> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/evidence`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  async getClaims(orgId: string): Promise<Claim[]> {
    return apiRequest<Claim[]>(`/api/v1/claims?organizationId=${orgId}`);
  },

  async createClaim(orgId: string, projectId: string, data: { title: string; description: string }): Promise<Claim> {
    return apiRequest<Claim>('/api/v1/claims', {
      method: 'POST',
      body: JSON.stringify({ ...data, projectId }),
    });
  },

  async updateClaimStatus(claimId: string, status: ClaimStatus): Promise<Claim> {
    return apiRequest<Claim>(`/api/v1/claims/${claimId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async linkEvidenceToClaim(claimId: string, evidenceId: string): Promise<void> {
    await apiRequest(`/api/v1/claims/${claimId}/evidence`, {
      method: 'POST',
      body: JSON.stringify({ evidenceId }),
    });
  },

  async linkActivityToClaim(claimId: string, activityId: string): Promise<void> {
    await apiRequest(`/api/v1/claims/${claimId}/activities`, {
      method: 'POST',
      body: JSON.stringify({ activityId }),
    });
  },

  async getEvents(claimId: string): Promise<LedgerEvent[]> {
    return apiRequest<LedgerEvent[]>(`/api/v1/claims/${claimId}/events`);
  },

  async verifyChain(claimId: string): Promise<IntegrityResult> {
    return apiRequest<IntegrityResult>(`/api/v1/claims/${claimId}/verify`);
  },

  async exportClaim(claimId: string): Promise<ExportManifest> {
    return apiRequest<ExportManifest>(`/api/v1/claims/${claimId}/export`);
  },
};

// ============ UNIFIED API ============

let currentApi: typeof realApi | typeof mockApi = mockApi;

export async function initializeApi(): Promise<void> {
  const mode = await detectApiMode();
  currentApi = mode === 'real' ? realApi : mockApi;
}

export function getApi() {
  return currentApi;
}

// Re-export for convenience
export { mockApi };
export { realApi };
