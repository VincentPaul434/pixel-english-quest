import { apiUrl, getToken, request, type ApiSuccess } from '../../../services/api';
import type { Lesson } from '../../academy/models/types';
import type { AdminData, InvitationPreview, PlatformData } from './types';

export const getPlatform = (signal?: AbortSignal) => request<PlatformData>('/api/platform', { signal });
export const markAllRead = () => request<PlatformData>('/api/notifications/read-all', { method: 'PUT' });
export const enrollCourse = (courseId: string) => request<PlatformData>(`/api/catalog/${courseId}/enroll`, { method: 'POST' });
export const postDiscussion = (courseId: string, body: string) => request<PlatformData['discussions']>(`/api/courses/${courseId}/discussions`, { method: 'POST', body: JSON.stringify({ body }) });
export const submitWork = (assignmentId: string, textContent: string, attachmentUrl = '') => request<PlatformData>(`/api/assignments/${assignmentId}/submissions`, { method: 'POST', body: JSON.stringify({ textContent, attachmentUrl }) });
export const createClassroom = (payload: { courseId: string; name: string }) => request<PlatformData>('/api/teacher/classrooms', { method: 'POST', body: JSON.stringify(payload) });
export const addClassroomStudent = (classroomId: string, studentId: string) => request<PlatformData>(`/api/teacher/classrooms/${classroomId}/students/${studentId}`, { method: 'POST' });
export const removeClassroomStudent = (classroomId: string, studentId: string) => request<PlatformData>(`/api/teacher/classrooms/${classroomId}/students/${studentId}`, { method: 'DELETE' });
export const createClassroomInvitation = (classroomId: string, payload: { assignmentId?: string; approvalRequired: boolean; usageLimit?: number | null; expiresAt?: string | null }) => request<PlatformData>(`/api/teacher/classrooms/${classroomId}/invitations`, { method: 'POST', body: JSON.stringify(payload) });
export const revokeClassroomInvitation = (invitationId: string) => request<PlatformData>(`/api/teacher/invitations/${invitationId}`, { method: 'DELETE' });
export const resolveJoinRequest = (requestId: string, status: 'accepted' | 'rejected') => request<PlatformData>(`/api/teacher/join-requests/${requestId}`, { method: 'PUT', body: JSON.stringify({ status }) });
export const previewInvitation = (code: string, signal?: AbortSignal) => request<InvitationPreview>(`/api/invitations/${encodeURIComponent(code)}`, { signal });
export const joinClassroom = (code: string) => request<PlatformData>(`/api/invitations/${encodeURIComponent(code)}/join`, { method: 'POST' });
export const leaveClassroom = (classroomId: string) => request<PlatformData>(`/api/classrooms/${classroomId}/membership`, { method: 'DELETE' });
export const gradeWork = (submissionId: string, score: number, feedback: string) => request<PlatformData>(`/api/teacher/submissions/${submissionId}/grade`, { method: 'PUT', body: JSON.stringify({ score, feedback }) });
export const createEvent = (payload: { courseId: string; title: string; startsAt: string; description?: string }) => request<PlatformData>('/api/teacher/calendar', { method: 'POST', body: JSON.stringify(payload) });
export const createBankQuestion = (payload: { prompt: string; type: string; choices: string[]; answer: string | number }) => request<PlatformData>('/api/teacher/question-bank', { method: 'POST', body: JSON.stringify(payload) });
export const duplicateLesson = (lessonId: string) => request<{ lesson: Lesson }>(`/api/teacher/lessons/${lessonId}/duplicate`, { method: 'POST' });
export const reorderLessons = (courseId: string, lessonIds: string[]) => request<ApiSuccess>(`/api/teacher/courses/${courseId}/lessons/reorder`, { method: 'PUT', body: JSON.stringify({ lessonIds }) });
export const getAdminData = (signal?: AbortSignal) => request<AdminData>('/api/admin/dashboard', { signal });
export const setAdmin = (userId: string, isAdmin: boolean) => request<AdminData>(`/api/admin/users/${userId}/admin`, { method: 'PUT', body: JSON.stringify({ isAdmin }) });
export const requestVerification = () => request<{ ok: boolean; alreadyVerified?: boolean; developmentToken?: string }>('/api/auth/email-verification/request', { method: 'POST' });
export const confirmVerification = (token: string) => request<ApiSuccess>('/api/auth/email-verification/confirm', { method: 'POST', body: JSON.stringify({ token }) });
export const setupMfa = () => request<{ secret: string; otpauthUrl: string }>('/api/auth/mfa/setup', { method: 'POST' });
export const enableMfa = (code: string) => request<ApiSuccess & { mfaEnabled: true }>('/api/auth/mfa/enable', { method: 'POST', body: JSON.stringify({ code }) });
export const disableMfa = (password: string) => request<ApiSuccess & { mfaEnabled: false }>('/api/auth/mfa/disable', { method: 'POST', body: JSON.stringify({ password }) });

export async function uploadAsset(file: File) {
  const signed = await request<{ signedUrl: string; token?: string; publicUrl: string }>('/api/uploads/sign', {
    method: 'POST', body: JSON.stringify({ filename: file.name, contentType: file.type })
  });
  const response = await fetch(signed.signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream', ...(signed.token ? { 'x-upsert': 'false' } : {}) }, body: file });
  if (!response.ok) throw new Error('The file upload failed.');
  return signed.publicUrl;
}

export async function downloadTeacherReport() {
  const response = await fetch(apiUrl('/api/teacher/reports.csv'), { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!response.ok) throw new Error('Could not download the report.');
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'learning-report.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}
