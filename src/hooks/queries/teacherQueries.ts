import { queryOptions, useQuery } from '@tanstack/react-query';
import { getLessonAnalytics, getTeacherDashboard } from '../../features/teacher/models/api';
import { teacherKeys } from '../queryKeys';

export const teacherDashboardQueryOptions = () => queryOptions({
  queryKey: teacherKeys.dashboard(),
  queryFn: ({ signal }) => getTeacherDashboard(signal),
  staleTime: 30_000
});

export const lessonAnalyticsQueryOptions = (lessonId: string) => queryOptions({
  queryKey: teacherKeys.lessonAnalytics(lessonId),
  queryFn: ({ signal }) => getLessonAnalytics(lessonId, signal),
  staleTime: 15_000
});

export function useTeacherDashboardQuery() {
  return useQuery(teacherDashboardQueryOptions());
}

export function useLessonAnalyticsQuery(lessonId: string | null) {
  return useQuery({ ...lessonAnalyticsQueryOptions(lessonId || ''), enabled: Boolean(lessonId) });
}
