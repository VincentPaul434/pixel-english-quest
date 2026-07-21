import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TeacherCourse, TeacherDashboardData } from '../../features/academy/models/types';
import { saveLesson } from '../../features/lessons/models/api';
import type { LessonForm, LessonSaveStatus } from '../../features/lessons/models/types';
import { duplicateLesson, reorderLessons } from '../../features/platform/models/api';
import {
  archiveLesson, createAssignment, createCourse, createModule, publishAnnouncement, publishLesson, updateCourseStatus
} from '../../features/teacher/models/api';
import { lessonKeys, teacherKeys } from '../queryKeys';

function useTeacherDashboardCache() {
  const queryClient = useQueryClient();
  const setDashboard = (dashboard: TeacherDashboardData) => queryClient.setQueryData(teacherKeys.dashboard(), dashboard);
  return { queryClient, setDashboard };
}

export function useCreateCourseMutation() {
  const { setDashboard } = useTeacherDashboardCache();
  return useMutation({ mutationKey: [...teacherKeys.all, 'courses', 'create'], mutationFn: createCourse, onSuccess: setDashboard });
}

export function useCreateAssignmentMutation() {
  const { setDashboard } = useTeacherDashboardCache();
  return useMutation({
    mutationKey: [...teacherKeys.all, 'assignments', 'create'],
    mutationFn: ({ lessonId, payload }: { lessonId: string; payload: Parameters<typeof createAssignment>[1] }) => createAssignment(lessonId, payload),
    onSuccess: setDashboard
  });
}

export function usePublishAnnouncementMutation() {
  const { setDashboard } = useTeacherDashboardCache();
  return useMutation({ mutationKey: [...teacherKeys.all, 'announcements', 'publish'], mutationFn: publishAnnouncement, onSuccess: setDashboard });
}

export function useCreateModuleMutation() {
  const { setDashboard } = useTeacherDashboardCache();
  return useMutation({
    mutationKey: [...teacherKeys.all, 'modules', 'create'],
    mutationFn: ({ courseId, title }: { courseId: string; title: string }) => createModule(courseId, title),
    onSuccess: setDashboard
  });
}

export function useUpdateCourseStatusMutation() {
  const { setDashboard } = useTeacherDashboardCache();
  return useMutation({
    mutationKey: [...teacherKeys.all, 'courses', 'status'],
    mutationFn: ({ course, status }: { course: TeacherCourse; status: TeacherCourse['status'] }) => updateCourseStatus(course, status),
    onSuccess: setDashboard
  });
}

export function usePublishLessonMutation() {
  const { setDashboard } = useTeacherDashboardCache();
  return useMutation({ mutationKey: [...teacherKeys.all, 'lessons', 'publish'], mutationFn: publishLesson, onSuccess: setDashboard });
}

export function useArchiveLessonMutation() {
  const { queryClient, setDashboard } = useTeacherDashboardCache();
  return useMutation({
    mutationKey: [...teacherKeys.all, 'lessons', 'archive'],
    mutationFn: archiveLesson,
    onSuccess: (dashboard, lessonId) => {
      setDashboard(dashboard);
      queryClient.removeQueries({ queryKey: lessonKeys.detail(lessonId) });
    }
  });
}

export function useDuplicateLessonMutation() {
  const { queryClient } = useTeacherDashboardCache();
  return useMutation({
    mutationKey: [...teacherKeys.all, 'lessons', 'duplicate'],
    mutationFn: duplicateLesson,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teacherKeys.dashboard() })
  });
}

export function useReorderLessonsMutation() {
  const { queryClient } = useTeacherDashboardCache();
  return useMutation({
    mutationKey: [...teacherKeys.all, 'lessons', 'reorder'],
    mutationFn: ({ courseId, lessonIds }: { courseId: string; lessonIds: string[] }) => reorderLessons(courseId, lessonIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teacherKeys.dashboard() })
  });
}

export function useSaveLessonMutation() {
  const { queryClient, setDashboard } = useTeacherDashboardCache();
  return useMutation({
    mutationKey: [...teacherKeys.all, 'lessons', 'save'],
    mutationFn: ({ lessonId, form, status }: { lessonId: string | null; form: LessonForm; status: LessonSaveStatus }) => saveLesson(lessonId, form, status),
    onSuccess: (result, variables) => {
      setDashboard(result.dashboard);
      if (variables.lessonId) queryClient.setQueryData(lessonKeys.detail(variables.lessonId), result.lesson);
    }
  });
}
