import { getToken, request, setToken } from '../../../services/api';
import type { User } from '../../academy/models/types';

export function hasSessionToken() {
  return Boolean(getToken());
}

export function clearSessionToken() {
  setToken('');
}

export function restoreSession() {
  return request<User>('/api/me');
}

export function logoutSession() {
  return request('/api/auth/logout', { method: 'POST' });
}
