import { useAuthStore } from '../store/authStore';

function getBaseUrl(): string {
  return useAuthStore.getState().serverUrl || 'http://localhost:3001';
}

async function apiFetch<T>(endpoint: string, options: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${getBaseUrl()}${endpoint}`, { ...fetchOptions, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  register: (data: { phone: string; pin: string; name: string }) =>
    apiFetch<{ user: any; token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { phone: string; pin: string }) =>
    apiFetch<{ user: any; token: string }>('/api/auth/verify', { method: 'POST', body: JSON.stringify(data) }),

  getMe: (token: string) =>
    apiFetch<{ user: any }>('/api/auth/me', { token }),

  // Users
  updateProfile: (token: string, data: any) =>
    apiFetch<{ user: any }>('/api/users/profile', { method: 'PUT', body: JSON.stringify(data), token }),

  searchUsers: (token: string, query: string) =>
    apiFetch<{ users: any[] }>(`/api/users/search?q=${encodeURIComponent(query)}`, { token }),

  getUsers: (token: string) =>
    apiFetch<{ users: any[] }>('/api/users', { token }),

  // Chats
  getChats: (token: string) =>
    apiFetch<{ chats: any[] }>('/api/chats', { token }),

  getChat: (token: string, chatId: string) =>
    apiFetch<{ chat: any }>(`/api/chats/${chatId}`, { token }),

  createDirectChat: (token: string, userId: string) =>
    apiFetch<{ chat: any }>('/api/chats/direct', { method: 'POST', body: JSON.stringify({ userId }), token }),

  createGroup: (token: string, data: { name: string; memberIds: string[] }) =>
    apiFetch<{ chat: any }>('/api/chats/group', { method: 'POST', body: JSON.stringify(data), token }),

  // Messages
  getMessages: (token: string, chatId: string) =>
    apiFetch<{ messages: any[] }>(`/api/messages/${chatId}`, { token }),

  // Status
  getStatuses: (token: string) =>
    apiFetch<{ myStatuses: any; otherStatuses: any[] }>('/api/status', { token }),

  createStatus: (token: string, data: any) =>
    apiFetch<{ status: any }>('/api/status', { method: 'POST', body: JSON.stringify(data), token }),

  viewStatus: (token: string, statusId: string) =>
    apiFetch<{ success: boolean }>(`/api/status/${statusId}/view`, { method: 'POST', token }),

  // Calls
  getCalls: (token: string) =>
    apiFetch<{ calls: any[] }>('/api/calls', { token }),

  // Upload
  uploadFile: async (token: string, uri: string, name: string, type: string) => {
    const formData = new FormData();
    formData.append('file', { uri, name, type } as any);
    const res = await fetch(`${getBaseUrl()}/api/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  // Health check
  checkServer: async (url: string) => {
    const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  },
};
