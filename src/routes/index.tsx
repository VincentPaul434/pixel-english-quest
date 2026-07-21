import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { PixelIcon } from '../shared-components/PixelIcon';
import type { User } from '../features/academy/models/types';
import { AuthRoute, authRoute } from './auth/AuthRoute';
import { StudentRoutes, studentRoutes } from './student/StudentRoutes';
import { TeacherRoutes, teacherRoutes } from './teacher/TeacherRoutes';
import type { AppRoute, Navigate } from './route-types';

export type { AppRoute, AppRouteId, Navigate, StudentPage, TeacherPage } from './route-types';

export const routeRegistry: AppRoute[] = [authRoute, ...studentRoutes, ...teacherRoutes];

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

function cleanPathname(pathname: string) {
  const cleaned = pathname.replace(/\/+$/, '');
  return cleaned || '/';
}

function useBrowserRoute() {
  const [pathname, setPathname] = useState(() => cleanPathname(window.location.pathname));

  useEffect(() => {
    const syncPath = () => setPathname(cleanPathname(window.location.pathname));
    window.addEventListener('popstate', syncPath);
    return () => window.removeEventListener('popstate', syncPath);
  }, []);

  const navigate = useCallback<Navigate>((path, replace = false) => {
    const nextPath = cleanPathname(path);
    if (nextPath === cleanPathname(window.location.pathname)) return;
    window.history[replace ? 'replaceState' : 'pushState']({}, '', `${nextPath}${window.location.search}`);
    setPathname(nextPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return { pathname, navigate };
}

export function AcademyRoutes({ user, onAuthenticated, onLogout }: AcademyRoutesProps) {
  const { pathname, navigate } = useBrowserRoute();
  const roleHome = user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
  const route = useMemo(() => routeRegistry.find((item) => item.path === pathname), [pathname]);

  useEffect(() => {
    if (!user && pathname !== '/auth') {
      navigate('/auth', true);
      return;
    }
    if (user?.role !== 'teacher' && new URLSearchParams(window.location.search).has('invite') && (pathname === '/student' || pathname === '/student/dashboard')) {
      navigate('/student/learning-hub', true);
      return;
    }
    if (user && (pathname === '/' || pathname === '/auth' || pathname === '/student' || pathname === '/teacher')) {
      navigate(roleHome, true);
      return;
    }
    if (user?.role === 'teacher' && pathname.startsWith('/student')) {
      navigate('/teacher/dashboard', true);
      return;
    }
    if (user?.role !== 'teacher' && user && pathname.startsWith('/teacher')) {
      navigate('/student/dashboard', true);
      return;
    }
    if (user && !route && !['/', '/student', '/teacher'].includes(pathname)) navigate(roleHome, true);
  }, [navigate, pathname, roleHome, route, user]);

  if (!user) return withSuspense(<AuthRoute onAuthenticated={onAuthenticated} />);
  if (user.role === 'teacher') return withSuspense(<TeacherRoutes user={user} pathname={pathname} onLogout={onLogout} onNavigate={navigate} />);
  return withSuspense(<StudentRoutes user={user} pathname={pathname} onLogout={onLogout} onNavigate={navigate} />);
}
