import { request } from '../../../services/api';
import type { LessonAnalytics, TeacherCourse, TeacherDashboardData } from '../../academy/models/types';

export function getTeacherDashboard(signal?: AbortSignal) {
  return request<TeacherDashboardData>('/api/teacher/dashboard', { signal });
}

export function createCourse(payload: { title: string; description: string; difficulty: string; catalogVisibility: 'private' | 'public'; enrollmentMode: 'invite' | 'self'; certificateEnabled: boolean }) {
  return request<TeacherDashboardData>('/api/teacher/courses', { method: 'POST', body: JSON.stringify(payload) });
}

export function createAssignment(lessonId: string, payload: { title: string; dueAt: string | null; studentIds: string[]; instructions: string; submissionType: string; allowResubmission: boolean }) {
  return request<TeacherDashboardData>(`/api/teacher/lessons/${lessonId}/assign`, { method: 'POST', body: JSON.stringify(payload) });
}

export function publishAnnouncement(payload: { courseId: string; title: string; body: string }) {
  return request<TeacherDashboardData>('/api/teacher/announcements', { method: 'POST', body: JSON.stringify(payload) });
}

export function createModule(courseId: string, title: string) {
  return request<TeacherDashboardData>(`/api/teacher/courses/${courseId}/modules`, { method: 'POST', body: JSON.stringify({ title }) });
}

export function updateCourseStatus(course: TeacherCourse, status: TeacherCourse['status']) {
  return request<TeacherDashboardData>(`/api/teacher/courses/${course.id}`, { method: 'PUT', body: JSON.stringify({ ...course, status }) });
}

export function publishLesson(lessonId: string) {
  return request<TeacherDashboardData>(`/api/teacher/lessons/${lessonId}/publish`, { method: 'POST' });
}

export function archiveLesson(lessonId: string) {
  return request<TeacherDashboardData>(`/api/teacher/lessons/${lessonId}`, { method: 'DELETE' });
}

export function getLessonAnalytics(lessonId: string, signal?: AbortSignal) {
  return request<LessonAnalytics>(`/api/teacher/lessons/${lessonId}/analytics`, { signal });
}
