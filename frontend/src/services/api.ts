const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://slider-outmatch-silent.ngrok-free.dev/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('bit2code_access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

let isSyncing = false;
let syncPromise: Promise<string | null> | null = null;

async function attemptReauth(): Promise<string | null> {
  if (isSyncing && syncPromise) {
    return syncPromise;
  }

  isSyncing = true;
  syncPromise = (async () => {
    try {
      // 1. Try Firebase user re-sync first if cached
      const storedFb = localStorage.getItem('bit2code_firebase_user');
      if (storedFb) {
        try {
          const parsed = JSON.parse(storedFb);
          const res = await fetch(`${API_BASE_URL}/auth/firebase-login/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
            body: JSON.stringify({
              username: parsed.username,
              email: parsed.email,
              name: parsed.name,
              phone: parsed.phone,
              college: parsed.college,
              department: parsed.department,
              year_of_study: parsed.year_of_study,
              anonymous_label: parsed.anonymous_label,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.access) {
              localStorage.setItem('bit2code_access_token', data.access);
              if (data.refresh) localStorage.setItem('bit2code_refresh_token', data.refresh);
              return data.access;
            }
          }
        } catch { /* proceed to refresh token */ }
      }

      // 2. Try refresh token
      const refreshToken = localStorage.getItem('bit2code_refresh_token');
      if (refreshToken) {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/refresh/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
            body: JSON.stringify({ refresh: refreshToken }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.access) {
              localStorage.setItem('bit2code_access_token', data.access);
              return data.access;
            }
          }
        } catch { /* ignore */ }
      }

      return null;
    } finally {
      isSyncing = false;
      syncPromise = null;
    }
  })();

  return syncPromise;
}

async function request<T>(endpoint: string, options: RequestInit = {}, isRetry: boolean = false): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // If there's no token and we have Firebase credentials, proactively obtain a token
  if (!localStorage.getItem('bit2code_access_token') && localStorage.getItem('bit2code_firebase_user') && !endpoint.startsWith('/auth/')) {
    await attemptReauth();
  }

  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  
  if (!res.ok) {
    // If 401 Unauthorized and not already retrying, try to re-authenticate and retry
    if (res.status === 401 && !isRetry && !endpoint.startsWith('/auth/')) {
      const newToken = await attemptReauth();
      if (newToken) {
        return request<T>(endpoint, options, true);
      }
    }

    let errorData: any = {};
    try {
      errorData = await res.json();
    } catch {
      errorData = { error: `Server error (${res.status})` };
    }
    const message = errorData.error || errorData.detail || errorData.message || (typeof errorData === 'object' ? Object.values(errorData)[0] : 'Request failed');
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return res.json();
}

export const api = {
  // Auth
  register: (data: any) => request<any>('/auth/register/', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login/', { method: 'POST', body: JSON.stringify(data) }),
  firebaseSyncLogin: (data: any) => request<any>('/auth/firebase-login/', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me/'),

  // Algorithms & Auction
  getAlgorithms: () => request<any[]>('/algorithms/'),
  getActiveAuction: () => request<any>('/auction/active/'),
  placeBid: (auctionId: number, amount: number) => request<any>('/auction/bid/', {
    method: 'POST',
    body: JSON.stringify({ auction_id: auctionId, amount })
  }),

  // Coding Session
  startCoding: () => request<any>('/coding/start/', { method: 'POST' }),
  getAssignedProblems: () => request<any>('/coding/problems/'),

  // Submissions & Testing
  submitCode: (problemId: number, language: string, sourceCode: string) => request<any>('/submissions/submit/', {
    method: 'POST',
    body: JSON.stringify({ problem_id: problemId, language, source_code: sourceCode })
  }),
  runSampleCode: (problemId: number, language: string, sourceCode: string, customInput?: string) => request<any>('/submissions/run-sample/', {
    method: 'POST',
    body: JSON.stringify({ problem_id: problemId, language, source_code: sourceCode, custom_input: customInput })
  }),
  getSubmissionHistory: () => request<any[]>('/submissions/history/'),

  // Leaderboard
  getLeaderboard: () => request<any[]>('/leaderboard/'),

  // Admin Controls
  getAdminOverview: () => request<any>('/admin-controls/overview/'),
  startAuction: (algorithmId?: number, durationSeconds: number = 45) => request<any>('/admin-controls/auction/start/', {
    method: 'POST',
    body: JSON.stringify({ algorithm_id: algorithmId, duration_seconds: durationSeconds })
  }),
  closeAuction: (auctionId?: number) => request<any>('/admin-controls/auction/close/', {
    method: 'POST',
    body: JSON.stringify({ auction_id: auctionId })
  }),
  randomAssignRemaining: () => request<any>('/admin-controls/auction/random-assign/', { method: 'POST' }),
  getAdminParticipants: () => request<any[]>('/admin-controls/participants/'),
  getAdminSubmissions: () => request<any[]>('/admin-controls/submissions/'),
  resetEvent: () => request<any>('/admin-controls/event/reset/', { method: 'POST' }),
};
