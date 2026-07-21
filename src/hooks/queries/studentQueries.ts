import { queryOptions, useQuery } from '@tanstack/react-query';
import { getLesson, getQuickQuiz, getStudentDashboard } from '../../features/student/models/api';
import { lessonKeys, studentKeys } from '../queryKeys';

export const studentDashboardQueryOptions = () => queryOptions({
  queryKey: studentKeys.dashboard(),
  queryFn: ({ signal }) => getStudentDashboard(signal),
  staleTime: 30_000
});

export const lessonQueryOptions = (lessonId: string) => queryOptions({
  queryKey: lessonKeys.detail(lessonId),
  queryFn: ({ signal }) => getLesson(lessonId, signal),
  staleTime: 5 * 60_000
});

export const quickQuizQueryOptions = () => queryOptions({
  queryKey: studentKeys.quickQuiz(),
  queryFn: ({ signal }) => getQuickQuiz(signal),
  staleTime: 0,
  gcTime: 2 * 60_000
});

export function useStudentDashboardQuery() {
  return useQuery(studentDashboardQueryOptions());
}

export function useLessonQuery(lessonId: string) {
  return useQuery({ ...lessonQueryOptions(lessonId), enabled: Boolean(lessonId) });
}

export function useQuickQuizQuery() {
  return useQuery(quickQuizQueryOptions());
}
