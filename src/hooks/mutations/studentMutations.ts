import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Lesson, StudentDashboardData } from '../../features/academy/models/types';
import {
  addVocabulary, completeLesson, deleteVocabulary, resetProgress, saveLessonCheckpoint, saveLessonStudy,
  submitQuickQuiz, submitSpeakingAttempt, updateProfile
} from '../../features/student/models/api';
import { lessonKeys, sessionKeys, studentKeys } from '../queryKeys';

function useStudentDashboardCache() {
  const queryClient = useQueryClient();
  const setDashboard = (dashboard: StudentDashboardData) => {
    queryClient.setQueryData(studentKeys.dashboard(), dashboard);
    queryClient.setQueryData(sessionKeys.me(), dashboard.profile);
  };
  return { queryClient, setDashboard };
}

export function useUpdateProfileMutation() {
  const { setDashboard } = useStudentDashboardCache();
  return useMutation({ mutationKey: [...studentKeys.all, 'update-profile'], mutationFn: updateProfile, onSuccess: setDashboard });
}

export function useResetProgressMutation() {
  const { setDashboard } = useStudentDashboardCache();
  return useMutation({ mutationKey: [...studentKeys.all, 'reset-progress'], mutationFn: resetProgress, onSuccess: setDashboard });
}

export function useCheckpointMutation(lessonId: string) {
  return useMutation({
    mutationKey: [...lessonKeys.detail(lessonId), 'checkpoint'],
    mutationFn: (payload: { lastQuestion: number; draftAnswers: Array<number | string | number[]> }) => saveLessonCheckpoint(lessonId, payload),
    scope: { id: `lesson-checkpoint-${lessonId}` }
  });
}

export function useSaveStudyMutation(lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...lessonKeys.detail(lessonId), 'study'],
    mutationFn: (payload: { notes: string; bookmarked: boolean }) => saveLessonStudy(lessonId, payload),
    onSuccess: (saved) => {
      const lesson = queryClient.getQueryData<Lesson>(lessonKeys.detail(lessonId));
      if (!lesson?.progress) {
        void queryClient.invalidateQueries({ queryKey: lessonKeys.detail(lessonId) });
        return;
      }
      queryClient.setQueryData<Lesson>(lessonKeys.detail(lessonId), {
        ...lesson,
        progress: { ...lesson.progress, notes: saved.notes, bookmarked: saved.bookmarked }
      });
    }
  });
}

export function useCompleteLessonMutation(lessonId: string) {
  const { queryClient, setDashboard } = useStudentDashboardCache();
  return useMutation({
    mutationKey: [...lessonKeys.detail(lessonId), 'complete'],
    mutationFn: (payload: { answers: Array<number | string | number[]>; durationSeconds: number }) => completeLesson(lessonId, payload),
    onSuccess: (result) => {
      setDashboard(result.dashboard);
      void queryClient.invalidateQueries({ queryKey: lessonKeys.detail(lessonId) });
    }
  });
}

export function useSpeakingAttemptMutation(lessonId: string) {
  return useMutation({
    mutationKey: [...lessonKeys.detail(lessonId), 'speaking'],
    mutationFn: (transcript: string) => submitSpeakingAttempt(lessonId, transcript)
  });
}

export function useSubmitQuickQuizMutation() {
  const { setDashboard } = useStudentDashboardCache();
  return useMutation({
    mutationKey: [...studentKeys.quickQuiz(), 'submit'],
    mutationFn: ({ questionId, answer }: { questionId: string; answer: number }) => submitQuickQuiz(questionId, answer),
    onSuccess: (result) => setDashboard(result.dashboard)
  });
}

export function useAddVocabularyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...studentKeys.all, 'vocabulary', 'add'],
    mutationFn: addVocabulary,
    onSuccess: (item) => queryClient.setQueryData<StudentDashboardData>(studentKeys.dashboard(), (dashboard) => dashboard ? {
      ...dashboard,
      vocabulary: [item, ...dashboard.vocabulary]
    } : dashboard)
  });
}

export function useDeleteVocabularyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...studentKeys.all, 'vocabulary', 'delete'],
    mutationFn: deleteVocabulary,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: studentKeys.dashboard() });
      const previous = queryClient.getQueryData<StudentDashboardData>(studentKeys.dashboard());
      queryClient.setQueryData<StudentDashboardData>(studentKeys.dashboard(), (dashboard) => dashboard ? {
        ...dashboard,
        vocabulary: dashboard.vocabulary.filter((item) => item.id !== id)
      } : dashboard);
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(studentKeys.dashboard(), context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: studentKeys.dashboard() })
  });
}
