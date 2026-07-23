import type { LessonSummary, TeacherCourse, TeacherStudent, User } from '../../academy/models/types';

export type Notification = { id: string; type: string; title: string; body: string; link: string | null; readAt: string | null; createdAt: string };
export type CalendarEvent = { id: string; courseId: string | null; classroomId: string | null; title: string; description: string; startsAt: string; endsAt: string | null; eventType: string; courseTitle?: string; classroomName?: string; attendance?: Array<{ studentId: string; studentName: string; studentEmail: string; status: 'present' | 'absent' | 'late' | 'excused'; note: string; markedAt: string }> };
export type Discussion = { id: string; courseId: string; courseTitle?: string; parentId: string | null; body: string; createdAt: string; authorId: string; authorName: string };
export type CatalogCourse = { id: string; title: string; description: string; difficulty: string; enrollmentMode: string; teacherName: string; lessonCount: number; studentCount: number; enrolled: boolean };
export type Classroom = { id: string; name: string; code: string; courseId: string; courseTitle: string; teacherName?: string; startsAt: string | null; endsAt: string | null; studentCount?: number };
export type ClassroomInvitation = { id: string; code: string; classroomId: string; classroomName: string; assignmentId: string | null; assignmentTitle: string | null; approvalRequired: boolean; usageLimit: number | null; usesCount: number; expiresAt: string | null; revokedAt: string | null; createdAt: string };
export type InvitationPreview = { id: string; code: string; classroomId: string; classroomName: string; courseId: string; courseTitle: string; teacherName: string; assignmentId: string | null; assignmentTitle: string | null; approvalRequired: boolean; usageLimit: number | null; usesCount: number; expiresAt: string | null; state: 'available' | 'pending' | 'accepted' | 'rejected' | 'expired' | 'revoked' };
export type JoinRequest = { id: string; invitationId: string; studentId: string; studentName: string; studentEmail: string; classroomId: string; classroomName: string; assignmentTitle: string | null; status: 'pending' | 'accepted' | 'rejected'; requestedAt: string; resolvedAt: string | null };
export type RubricResult = { criterion: string; points: number; comment: string };
export type Submission = { id: string; assignmentId: string; assignmentTitle: string; courseTitle: string; studentId?: string; studentName?: string; studentEmail?: string; textContent: string; attachmentUrl: string | null; status: string; score: number | null; maxScore: number; feedback: string; rubric: RubricResult[]; submittedAt: string; gradedAt: string | null; attemptNumber: number };
export type Certificate = { id: string; courseId: string; courseTitle: string; verificationCode: string; issuedAt: string };
export type VerifiedCertificate = {
  valid: true;
  verificationCode: string;
  issuedAt: string;
  studentName: string;
  courseTitle: string;
  teacherName: string;
};
export type QuestionBankItem = { id: string; prompt: string; type: string; choices: unknown[]; answer: unknown; explanation: string; tags: string[]; createdAt: string };
export type AdminData = {
  summary: { users: number; courses: number; lessons: number; attempts: number; submissions: number };
  users: Array<{ id: string; email: string; name: string; role: 'student' | 'teacher'; isAdmin: boolean; accountStatus: 'active' | 'suspended' | 'deactivated'; emailVerifiedAt: string | null; xp: number; createdAt: string }>;
  logs: Array<{ id: string; action: string; entityType: string; entityId: string | null; actorName: string | null; createdAt: string; metadata: Record<string, unknown> }>;
};

export type PlatformData = {
  profile: User;
  notifications: Notification[];
  unreadNotifications: number;
  notificationPreferences: Record<string, boolean>;
  events: CalendarEvent[];
  discussions: Discussion[];
  catalog?: CatalogCourse[];
  classrooms: Classroom[];
  submissions: Submission[];
  certificates?: Certificate[];
  rosters?: Array<{ classroomId: string; students: TeacherStudent[] }>;
  invitations?: ClassroomInvitation[];
  joinRequests?: JoinRequest[];
  invitationStates?: Array<{ id: string; code: string; classroomId: string; classroomName: string; courseTitle: string; teacherName: string; expiresAt: string | null; revokedAt: string | null; status: 'pending' | 'accepted' | 'rejected'; requestedAt: string; resolvedAt: string | null }>;
  questionBank?: QuestionBankItem[];
  lessonVersions?: Array<{ id: string; lessonId: string; lessonTitle: string; version: number; createdAt: string }>;
  admin?: AdminData['summary'];
};

export type StudentLearningHubProps = {
  courses: Array<{ id: string; title: string }>;
  learner: { name: string; level: number; streak: number; progress: number };
  recommendation: LessonSummary | null;
  onResumeLesson: (lesson: LessonSummary) => void;
  notify: (message: string) => void;
};
export type TeacherOperationsProps = { courses: TeacherCourse[]; students: TeacherStudent[]; assignments: Array<{ id: string; title: string; courseId: string }>; user: User; notify: (message: string) => void };
