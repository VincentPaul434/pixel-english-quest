import { request, type ApiSuccess } from '../../../services/api';
import type { Lesson, LessonResult, QuickQuestion, StudentDashboardData, VocabularyItem } from '../../academy/models/types';
import type { QuickQuizSubmitResult, SpeechAttemptResult } from './types';

export function getStudentDashboard(signal?: AbortSignal) {
  return request<StudentDashboardData>('/api/dashboard', { signal });
}

export function updateProfile(payload: { name: string; proficiency: string; learningGoal: string; dailyGoal: number }) {
  return request<StudentDashboardData>('/api/profile', { method: 'PUT', body: JSON.stringify(payload) });
}

export function resetProgress() {
  return request<StudentDashboardData>('/api/reset', { method: 'POST' });
}

export function getLesson(lessonId: string, signal?: AbortSignal) {
  return request<Lesson>(`/api/lessons/${lessonId}`, { signal });
}

export function saveLessonCheckpoint(lessonId: string, payload: { lastQuestion: number; draftAnswers: Array<number | string | number[]> }) {
  return request<{ saved: true; updatedAt: string }>(`/api/lessons/${lessonId}/checkpoint`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function saveLessonStudy(lessonId: string, payload: { notes: string; bookmarked: boolean }) {
  return request<{ saved: true; notes: string; bookmarked: boolean }>(`/api/lessons/${lessonId}/study`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function completeLesson(lessonId: string, payload: { answers: Array<number | string | number[]>; durationSeconds: number }) {
  return request<LessonResult>(`/api/lessons/${lessonId}/complete`, { method: 'POST', body: JSON.stringify(payload) });
}

export function submitSpeakingAttempt(lessonId: string, transcript: string) {
  return request<SpeechAttemptResult>(`/api/lessons/${lessonId}/speaking-attempt`, { method: 'POST', body: JSON.stringify({ transcript }) });
}

export function getQuickQuiz(signal?: AbortSignal) {
  return request<QuickQuestion>('/api/quick-quiz', { signal });
}

export function submitQuickQuiz(questionId: string, answer: number) {
  return request<QuickQuizSubmitResult>('/api/quick-quiz/submit', { method: 'POST', body: JSON.stringify({ questionId, answer }) });
}

export function addVocabulary(payload: { term: string; definition: string }) {
  return request<VocabularyItem>('/api/vocabulary', { method: 'POST', body: JSON.stringify(payload) });
}

export function deleteVocabulary(id: string) {
  return request<ApiSuccess>(`/api/vocabulary/${id}`, { method: 'DELETE' });
}
