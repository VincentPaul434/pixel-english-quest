import { apiUrl, getToken, request, type ApiSuccess } from '../../../services/api';
import type { Lesson } from '../../academy/models/types';
import type { AdminData, InvitationPreview, PlatformData, VerifiedCertificate } from './types';

export const getPlatform = (signal?: AbortSignal) => request<PlatformData>('/api/platform', { signal });
export const markAllRead = () => request<PlatformData>('/api/notifications/read-all', { method: 'PUT' });
export const markNotificationRead = (notificationId: string) => request<PlatformData>(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
export const updateNotificationPreferences = (preferences: Record<string, boolean>) => request<PlatformData>('/api/notifications/preferences', { method: 'PUT', body: JSON.stringify(preferences) });
export const enrollCourse = (courseId: string) => request<PlatformData>(`/api/catalog/${courseId}/enroll`, { method: 'POST' });
export const postDiscussion = (courseId: string, body: string, parentId?: string) => request<PlatformData['discussions']>(`/api/courses/${courseId}/discussions`, { method: 'POST', body: JSON.stringify({ body, parentId }) });
export const submitWork = (assignmentId: string, textContent: string, attachmentUrl = '') => request<PlatformData>(`/api/assignments/${assignmentId}/submissions`, { method: 'POST', body: JSON.stringify({ textContent, attachmentUrl }) });
export const createClassroom = (payload: { courseId: string; name: string }) => request<PlatformData>('/api/teacher/classrooms', { method: 'POST', body: JSON.stringify(payload) });
export const addClassroomStudent = (classroomId: string, studentId: string) => request<PlatformData>(`/api/teacher/classrooms/${classroomId}/students/${studentId}`, { method: 'POST' });
export const addClassroomStudentByEmail = (classroomId: string, email: string) => request<PlatformData>(`/api/teacher/classrooms/${classroomId}/students`, { method: 'POST', body: JSON.stringify({ email }) });
export const removeClassroomStudent = (classroomId: string, studentId: string) => request<PlatformData>(`/api/teacher/classrooms/${classroomId}/students/${studentId}`, { method: 'DELETE' });
export const removeClassroomStudents = (classroomId: string, studentIds: string[]) => request<PlatformData>(`/api/teacher/classrooms/${classroomId}/students`, { method: 'DELETE', body: JSON.stringify({ studentIds }) });
export const createClassroomInvitation = (classroomId: string, payload: { assignmentId?: string; approvalRequired: boolean; usageLimit?: number | null; expiresAt?: string | null }) => request<PlatformData>(`/api/teacher/classrooms/${classroomId}/invitations`, { method: 'POST', body: JSON.stringify(payload) });
export const revokeClassroomInvitation = (invitationId: string) => request<PlatformData>(`/api/teacher/invitations/${invitationId}`, { method: 'DELETE' });
export const resolveJoinRequest = (requestId: string, status: 'accepted' | 'rejected') => request<PlatformData>(`/api/teacher/join-requests/${requestId}`, { method: 'PUT', body: JSON.stringify({ status }) });
export const previewInvitation = (code: string, signal?: AbortSignal) => request<InvitationPreview>(`/api/invitations/${encodeURIComponent(code)}`, { signal });
export const joinClassroom = (code: string) => request<PlatformData>(`/api/invitations/${encodeURIComponent(code)}/join`, { method: 'POST' });
export const leaveClassroom = (classroomId: string) => request<PlatformData>(`/api/classrooms/${classroomId}/membership`, { method: 'DELETE' });
export const gradeWork = (submissionId: string, score: number, feedback: string) => request<PlatformData>(`/api/teacher/submissions/${submissionId}/grade`, { method: 'PUT', body: JSON.stringify({ score, feedback }) });
export const createEvent = (payload: { courseId?: string; classroomId?: string; title: string; startsAt: string; endsAt?: string; description?: string; eventType?: string }) => request<PlatformData>('/api/teacher/calendar', { method: 'POST', body: JSON.stringify(payload) });
export const markAttendance = (eventId: string, payload: { studentId: string; status: 'present' | 'absent' | 'late' | 'excused'; note?: string }) => request<PlatformData>(`/api/teacher/calendar/${eventId}/attendance`, { method: 'PUT', body: JSON.stringify(payload) });
export type QuestionBankPayload = { prompt: string; type: string; choices: string[]; answer: string | number; explanation?: string; tags?: string[] };
export const createBankQuestion = (payload: QuestionBankPayload) => request<PlatformData>('/api/teacher/question-bank', { method: 'POST', body: JSON.stringify(payload) });
export const updateBankQuestion = (questionId: string, payload: QuestionBankPayload) => request<PlatformData>(`/api/teacher/question-bank/${questionId}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteBankQuestion = (questionId: string) => request<PlatformData>(`/api/teacher/question-bank/${questionId}`, { method: 'DELETE' });
export const duplicateLesson = (lessonId: string) => request<{ lesson: Lesson }>(`/api/teacher/lessons/${lessonId}/duplicate`, { method: 'POST' });
export const reorderLessons = (courseId: string, lessonIds: string[]) => request<ApiSuccess>(`/api/teacher/courses/${courseId}/lessons/reorder`, { method: 'PUT', body: JSON.stringify({ lessonIds }) });
export const getAdminData = (signal?: AbortSignal) => request<AdminData>('/api/admin/dashboard', { signal });
export const setAdmin = (userId: string, isAdmin: boolean) => request<AdminData>(`/api/admin/users/${userId}/admin`, { method: 'PUT', body: JSON.stringify({ isAdmin }) });
export const setUserRole = (userId: string, role: 'student' | 'teacher') => request<AdminData>(`/api/admin/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
export const setAccountStatus = (userId: string, status: 'active' | 'suspended' | 'deactivated') => request<AdminData>(`/api/admin/users/${userId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
export const requestVerification = () => request<{ ok: boolean; alreadyVerified?: boolean; developmentToken?: string }>('/api/auth/email-verification/request', { method: 'POST' });
export const confirmVerification = (token: string) => request<ApiSuccess>('/api/auth/email-verification/confirm', { method: 'POST', body: JSON.stringify({ token }) });
export const setupMfa = () => request<{ secret: string; otpauthUrl: string }>('/api/auth/mfa/setup', { method: 'POST' });
export const enableMfa = (code: string) => request<ApiSuccess & { mfaEnabled: true; recoveryCodes: string[] }>('/api/auth/mfa/enable', { method: 'POST', body: JSON.stringify({ code }) });
export const regenerateMfaRecoveryCodes = (password: string) => request<ApiSuccess & { recoveryCodes: string[] }>('/api/auth/mfa/recovery-codes', { method: 'POST', body: JSON.stringify({ password }) });
export const disableMfa = (password: string) => request<ApiSuccess & { mfaEnabled: false }>('/api/auth/mfa/disable', { method: 'POST', body: JSON.stringify({ password }) });

export async function verifyCertificate(code: string, signal?: AbortSignal) {
  const response = await fetch(apiUrl(`/api/certificates/${encodeURIComponent(code)}`), { signal });
  const data = await response.json().catch(() => ({ error: 'The certificate service returned an unreadable response.' }));
  if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Could not verify this certificate.');
  return data as VerifiedCertificate;
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const UPLOAD_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,.doc,.docx,.xls,.xlsx,.ppt,.pptx';

export async function uploadAsset({ file, signal, onProgress }: { file: File; signal?: AbortSignal; onProgress?: (percent: number) => void }) {
  if (!file.size || file.size > MAX_UPLOAD_BYTES) throw new Error('Choose a file between 1 byte and 10 MB.');
  const signed = await request<{ signedUrl: string; token?: string; publicUrl: string }>('/api/uploads/sign', {
    method: 'POST', signal, body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size })
  });
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    xhr.open('PUT', signed.signedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    if (signed.token) xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    });
    xhr.addEventListener('load', () => {
      signal?.removeEventListener('abort', abort);
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error('The file upload failed. Check the storage bucket policy and try again.'));
    });
    xhr.addEventListener('error', () => { signal?.removeEventListener('abort', abort); reject(new Error('The file upload could not reach cloud storage.')); });
    xhr.addEventListener('abort', () => { signal?.removeEventListener('abort', abort); reject(new DOMException('Upload cancelled.', 'AbortError')); });
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    else xhr.send(file);
  });
  onProgress?.(100);
  return signed.publicUrl;
}

export async function downloadTeacherReport(filters: { courseId?: string; from?: string; to?: string } = {}) {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => Boolean(value)) as Array<[string, string]>);
  const response = await fetch(apiUrl(`/api/teacher/reports.csv${params.size ? `?${params}` : ''}`), { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!response.ok) throw new Error('Could not download the report.');
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filters.courseId ? `learning-report-${filters.courseId}.csv` : 'learning-report.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}
