import { lazy } from 'react';
import type { User } from '../../features/academy/models/types';
import type { AppRoute } from '../route-types';

const AuthView = lazy(() => import('../../features/auth/views/AuthView').then((module) => ({ default: module.AuthView })));

export const authRoute: AppRoute = {
  id: 'auth',
  path: '/auth',
  feature: 'auth',
  label: 'Sign in',
  componentPath: 'src/features/auth/views/AuthView.tsx'
};

export function AuthRoute({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  return <AuthView onAuthenticated={onAuthenticated} />;
}
