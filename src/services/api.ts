const configuredApiUrl = import.meta.env.VITE_API_URL
  || (import.meta.env.VITE_API_HOST ? `https://${import.meta.env.VITE_API_HOST}` : '');
const API_BASE = configuredApiUrl.replace(/\/$/, '');
const TOKEN_KEY = 'pixel-academy-session';

export type ApiSuccess = { ok: true };

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token: string) {
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers
    }
  });
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = { error: 'The academy server returned an unreadable response.' };
  }
  if (!response.ok) {
    const message = typeof data === 'object' && data && 'error' in data ? String(data.error) : 'Something went wrong.';
    if (response.status === 401) window.dispatchEvent(new CustomEvent('academy:unauthorized'));
    throw new ApiError(message, response.status);
  }
  return data as T;
}

export function apiUrl(path: string) {
  return `${API_BASE}${path}`;
}
