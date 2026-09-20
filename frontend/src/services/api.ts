const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('bit2code_access_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  
  if (!res.ok) {
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
};
