import { lazy } from 'react';
import type { User } from '../../features/academy/models/types';
import type { AppRoute, Navigate, StudentPage } from '../route-types';

const StudentWorkspace = lazy(() => import('../../features/student').then((module) => ({ default: module.StudentWorkspace })));

export const studentPages: StudentPage[] = ['dashboard', 'courses', 'assignments', 'learning-hub', 'study', 'achievements', 'activity'];

export const studentRoutes: AppRoute[] = studentPages.map((page) => ({
  id: `student-${page}`,
  path: `/student/${page}`,
  feature: 'student',
  label: page === 'learning-hub' ? 'Learning hub' : page[0].toUpperCase() + page.slice(1),
  componentPath: 'src/features/student/views/StudentWorkspaceView.tsx'
}));

export function resolveStudentPage(pathname: string): StudentPage {
  const page = pathname.startsWith('/student/') ? pathname.slice('/student/'.length) as StudentPage : 'dashboard';
  return studentPages.includes(page) ? page : 'dashboard';
}

type StudentRoutesProps = {
  user: User;
  pathname: string;
  onLogout: () => void;
  onNavigate: Navigate;
};

export function StudentRoutes({ user, pathname, onLogout, onNavigate }: StudentRoutesProps) {
  return <StudentWorkspace initialUser={user} onLogout={onLogout} page={resolveStudentPage(pathname)} onNavigate={onNavigate} />;
}
