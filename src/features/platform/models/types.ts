import type { Assignment, TeacherCourse, TeacherStudent, User } from '../../academy/models/types';

export type Notification = { id: string; type: string; title: string; body: string; link: string | null; readAt: string | null; createdAt: string };
export type CalendarEvent = { id: string; courseId: string | null; classroomId: string | null; title: string; description: string; startsAt: string; endsAt: string | null; eventType: string; courseTitle?: string };
export type Discussion = { id: string; courseId: string; courseTitle?: string; parentId: string | null; body: string; createdAt: string; authorId: string; authorName: string };
export type CatalogCourse = { id: string; title: string; description: string; difficulty: string; enrollmentMode: string; teacherName: string; lessonCount: number; studentCount: number; enrolled: boolean };
export type Classroom = { id: string; name: string; code: string; courseId: string; courseTitle: string; teacherName?: string; startsAt: string | null; endsAt: string | null; studentCount?: number };
export type Submission = { id: string; assignmentId: string; assignmentTitle: string; courseTitle: string; studentId?: string; studentName?: string; studentEmail?: string; textContent: string; attachmentUrl: string | null; status: string; score: number | null; maxScore: number; feedback: string; submittedAt: string; gradedAt: string | null; attemptNumber: number };
export type Certificate = { id: string; courseId: string; courseTitle: string; verificationCode: string; issuedAt: string };
export type QuestionBankItem = { id: string; prompt: string; type: string; choices: unknown[]; answer: unknown; explanation: string; tags: string[]; createdAt: string };
export type AdminData = {
  summary: { users: number; courses: number; lessons: number; attempts: number; submissions: number };
  users: Array<{ id: string; email: string; name: string; role: string; isAdmin: boolean; emailVerifiedAt: string | null; xp: number; createdAt: string }>;
  logs: Array<{ id: string; action: string; entityType: string; entityId: string | null; actorName: string | null; createdAt: string; metadata: Record<string, unknown> }>;
};

export type PlatformData = {
  profile: User;
  notifications: Notification[];
  unreadNotifications: number;
  events: CalendarEvent[];
  discussions: Discussion[];
  catalog?: CatalogCourse[];
  classrooms: Classroom[];
  submissions: Submission[];
  certificates?: Certificate[];
  rosters?: Array<{ classroomId: string; students: TeacherStudent[] }>;
  questionBank?: QuestionBankItem[];
  lessonVersions?: Array<{ id: string; lessonId: string; lessonTitle: string; version: number; createdAt: string }>;
  admin?: AdminData['summary'];
};

export type StudentLearningHubProps = { courses: Array<{ id: string; title: string }>; assignments: Assignment[]; notify: (message: string) => void };
export type TeacherOperationsProps = { courses: TeacherCourse[]; students: TeacherStudent[]; user: User; notify: (message: string) => void };
