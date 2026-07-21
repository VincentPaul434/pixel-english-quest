import { getToken, request, setToken, type ApiSuccess } from '../../../services/api';
import type { User } from '../../academy/models/types';

export function hasSessionToken() {
  return Boolean(getToken());
}

export function clearSessionToken() {
  setToken('');
}

export function restoreSession(signal?: AbortSignal) {
  return request<User>('/api/me', { signal });
}

export function logoutSession() {
  return request<ApiSuccess>('/api/auth/logout', { method: 'POST' });
}
