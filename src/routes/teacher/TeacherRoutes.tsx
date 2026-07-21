import { lazy } from 'react';
import type { User } from '../../features/academy/models/types';
import type { AppRoute, Navigate, TeacherPage } from '../route-types';

const TeacherWorkspace = lazy(() => import('../../features/teacher').then((module) => ({ default: module.TeacherWorkspace })));

export const teacherPages: TeacherPage[] = ['dashboard', 'courses', 'students', 'assignments', 'operations'];

export const teacherRoutes: AppRoute[] = teacherPages.map((page) => ({
  id: `teacher-${page}`,
  path: `/teacher/${page}`,
  feature: 'teacher',
  label: page[0].toUpperCase() + page.slice(1),
  componentPath: 'src/features/teacher/views/TeacherWorkspaceView.tsx'
}));

export function resolveTeacherPage(pathname: string): TeacherPage {
  const page = pathname.startsWith('/teacher/') ? pathname.slice('/teacher/'.length) as TeacherPage : 'dashboard';
  return teacherPages.includes(page) ? page : 'dashboard';
}

type TeacherRoutesProps = {
  user: User;
  pathname: string;
  onLogout: () => void;
  onNavigate: Navigate;
};

export function TeacherRoutes({ user, pathname, onLogout, onNavigate }: TeacherRoutesProps) {
  return <TeacherWorkspace initialUser={user} onLogout={onLogout} page={resolveTeacherPage(pathname)} onNavigate={onNavigate} />;
}
