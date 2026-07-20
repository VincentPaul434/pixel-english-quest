import { request, setToken } from '../../../services/api';
import type { AuthResponse } from './types';

export async function authenticate(payload: Record<string, string>, endpoint: string) {
  const result = await request<AuthResponse>(endpoint, { method: 'POST', body: JSON.stringify(payload) });
  setToken(result.token);
  return result.user;
}
