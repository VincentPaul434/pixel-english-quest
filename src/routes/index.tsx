import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { PixelIcon } from '../shared-components/PixelIcon';
import type { User } from '../features/academy/models/types';

const AuthView = lazy(() => import('../features/auth/views/AuthView').then((module) => ({ default: module.AuthView })));
const StudentWorkspace = lazy(() => import('../features/student').then((module) => ({ default: module.StudentWorkspace })));
const TeacherWorkspace = lazy(() => import('../features/teacher').then((module) => ({ default: module.TeacherWorkspace })));

export type AppRouteId = 'auth' | 'student-workspace' | 'teacher-workspace';
export type RouteMigrationStatus = 'mvvm';

type AuthRoute = {
  id: 'auth';
  path: '/auth';
  feature: 'auth';
  status: 'mvvm';
  componentPath: string;
  Component: ComponentType<{ onAuthenticated: (user: User) => void }>;
};

type WorkspaceRoute = {
  id: 'student-workspace' | 'teacher-workspace';
  path: '/student' | '/teacher';
  feature: 'student' | 'teacher';
  status: 'mvvm';
  componentPath: string;
  Component: ComponentType<{ initialUser: User; onLogout: () => void }>;
};

export type AppRoute = AuthRoute | WorkspaceRoute;

export const routeRegistry: AppRoute[] = [
  {
    id: 'auth',
    path: '/auth',
    feature: 'auth',
    status: 'mvvm',
    componentPath: 'src/features/auth/views/AuthView.tsx',
    Component: AuthView
  },
  {
    id: 'student-workspace',
    path: '/student',
    feature: 'student',
    status: 'mvvm',
    componentPath: 'src/features/student/views/StudentWorkspaceView.tsx',
    Component: StudentWorkspace
  },
  {
    id: 'teacher-workspace',
    path: '/teacher',
    feature: 'teacher',
    status: 'mvvm',
    componentPath: 'src/features/teacher/views/TeacherWorkspaceView.tsx',
    Component: TeacherWorkspace
  }
];

type AcademyRoutesProps = {
  user: User | null;
  onAuthenticated: (user: User) => void;
  onLogout: () => void;
};

function RouteFallback() {
  return <main className="loading-screen"><PixelIcon className="loading-rune" name="sparkle" size={58} /><p>Loading academy route...</p></main>;
}

function withSuspense(children: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export function AcademyRoutes({ user, onAuthenticated, onLogout }: AcademyRoutesProps) {
  if (!user) {
    const route = routeRegistry.find((item): item is AuthRoute => item.id === 'auth');
    if (!route) return null;
    const { Component } = route;
    return withSuspense(<Component onAuthenticated={onAuthenticated} />);
  }

  const route = routeRegistry.find((item): item is WorkspaceRoute => item.id === (user.role === 'teacher' ? 'teacher-workspace' : 'student-workspace'));
  if (!route) return null;
  const { Component } = route;
  return withSuspense(<Component initialUser={user} onLogout={onLogout} />);
}
