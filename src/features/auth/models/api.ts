import { request, setToken, type ApiSuccess } from '../../../services/api';
import type { AuthResponse } from './types';

export async function authenticate(payload: Record<string, string>, endpoint: string) {
  const result = await request<AuthResponse>(endpoint, { method: 'POST', body: JSON.stringify(payload) });
  setToken(result.token);
  return result.user;
}

export function requestPasswordReset(email: string) {
  return request<{ ok: boolean; developmentToken?: string }>('/api/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) });
}

export function confirmPasswordReset(token: string, password: string) {
  return request<ApiSuccess>('/api/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, password }) });
}
