const API_BASE = '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message: string;
    details?: any;
    correlation_id?: string;
  };
}

// Helper to get active auth headers
function getHeaders(): HeadersInit {
  const token = localStorage.getItem('nawi_token');
  const activeRole = localStorage.getItem('nawi_active_role') || 'technician';
  const activeUserId = localStorage.getItem('nawi_active_user_id') || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-role': activeRole,
  };

  if (activeUserId) {
    headers['x-user-id'] = activeUserId;
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || `Request failed with status ${response.status}`);
  }

  return json.data as T;
}

export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: () => request('/auth/me'),
    getUsers: () => request('/auth/users'),
  },

  // Instruments
  instruments: {
    list: (params?: { search?: string; status?: string; accuracy_class?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request(`/instruments${q ? `?${q}` : ''}`);
    },
    get: (id: string) => request(`/instruments/${id}`),
    getPassport: (id: string) => request(`/instruments/${id}/passport`),
    getReadiness: (id: string) => request(`/instruments/${id}/readiness`),
    create: (data: any) => request('/instruments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/instruments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/instruments/${id}`, { method: 'DELETE' }),
  },

  // Evaluation Cases
  cases: {
    list: (params?: { search?: string; status?: string; instrument_id?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request(`/cases${q ? `?${q}` : ''}`);
    },
    get: (id: string) => request(`/cases/${id}`),
    create: (data: any) => request('/cases', { method: 'POST', body: JSON.stringify(data) }),
    saveObservations: (id: string, data: any) =>
      request(`/cases/${id}/observations`, { method: 'PUT', body: JSON.stringify(data) }),
    submit: (id: string) => request(`/cases/${id}/submit`, { method: 'POST' }),
  },

  // Reviews
  reviews: {
    approve: (caseId: string, comments?: string) =>
      request(`/reviews/${caseId}/approve`, { method: 'POST', body: JSON.stringify({ comments }) }),
    reject: (caseId: string, reason: string) =>
      request(`/reviews/${caseId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
    createRevision: (caseId: string, correction_notes?: string) =>
      request(`/reviews/${caseId}/create-revision`, { method: 'POST', body: JSON.stringify({ correction_notes }) }),
  },

  // Calculations
  calculate: {
    weighing: (data: any) => request('/calculate/weighing', { method: 'POST', body: JSON.stringify(data) }),
    repeatability: (data: any) => request('/calculate/repeatability', { method: 'POST', body: JSON.stringify(data) }),
    eccentricity: (data: any) => request('/calculate/eccentricity', { method: 'POST', body: JSON.stringify(data) }),
    zeroTare: (data: any) => request('/calculate/zero-tare', { method: 'POST', body: JSON.stringify(data) }),
    mpe: (data: any) => request('/calculate/mpe', { method: 'POST', body: JSON.stringify(data) }),
    validateInstrument: (data: any) =>
      request('/calculate/validate-instrument', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Evidence
  evidence: {
    list: (caseId?: string) => request(`/evidence${caseId ? `?case_id=${caseId}` : ''}`),
    add: (data: any) => request('/evidence', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/evidence/${id}`, { method: 'DELETE' }),
  },

  // Equipment
  equipment: {
    list: () => request('/equipment'),
    create: (data: any) => request('/equipment', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Rules
  rules: {
    list: () => request('/rules'),
    get: (id: string) => request(`/rules/${id}`),
  },

  // Audit
  audit: {
    list: (entityId?: string) => request(`/audit${entityId ? `?entity_id=${entityId}` : ''}`),
  },

  // AI Assistant
  ai: {
    extractSpec: (text: string) => request('/ai/extract-spec', { method: 'POST', body: JSON.stringify({ text }) }),
    explainResult: (data: any) => request('/ai/explain-result', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Dashboard Stats
  stats: {
    get: () => request('/stats'),
  },

  // Reports
  reports: {
    getSnapshot: (caseId: string) => request(`/reports/${caseId}`),
    getCSVUrl: (caseId: string) => `${API_BASE}/reports/${caseId}/csv`,
    getJSONUrl: (caseId: string) => `${API_BASE}/reports/${caseId}/json`,
  },

  // Seed
  seed: {
    reset: () => request('/seed/reset', { method: 'POST' }),
  },
};
