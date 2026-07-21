export type Category = 'reading' | 'grammar' | 'listening' | 'speaking';
export type Role = 'student' | 'teacher';
export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'essay' | 'matching' | 'ordering';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  proficiency: string;
  learningGoal: string;
  dailyGoal: number;
  onboardingComplete: boolean;
  isAdmin: boolean;
  emailVerified: boolean;
  locale: string;
  mfaEnabled: boolean;
  xp: number;
  level: number;
}

export interface LessonProgress {
  status: 'not_started' | 'in_progress' | 'completed';
  bestScore: number;
  lastScore: number;
  attempts: number;
  lastQuestion: number;
  draftAnswers: Array<number | string | number[]>;
  bookmarked: boolean;
  notes: string;
}

export interface LessonSummary {
  id: string;
  courseId: string;
  courseTitle?: string;
  moduleId?: string | null;
  moduleTitle?: string | null;
  category: Category;
  title: string;
  eyebrow: string;
  icon: string;
  minutes: number;
  difficulty: string;
  xpReward: number;
  masteryScore: number;
  attemptLimit?: number;
  shuffleQuestions?: boolean;
  availableFrom?: string | null;
  availableUntil?: string | null;
  version?: number;
  position: number;
  status: 'draft' | 'published' | 'archived';
  completed: boolean;
  progress: LessonProgress | null;
}

export interface Question {
  id?: string;
  prompt: string;
  type: QuestionType;
  choices: string[];
  answer?: number | string | number[];
  points?: number;
  settings?: Record<string, unknown>;
  explanation?: string;
}

export interface Lesson extends LessonSummary {
  passage: string;
  audioText?: string | null;
  speakPhrase?: string | null;
  audioUrl?: string | null;
  videoUrl?: string | null;
  resourceUrl?: string | null;
  objectives: string[];
  questions: Question[];
}

export interface Activity {
  id: string;
  timestamp: string;
  type: string;
  icon: string;
  title: string;
  detail: string;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  instructions?: string;
  submissionType?: 'quiz' | 'text' | 'file' | 'mixed';
  maxScore?: number;
  allowResubmission?: boolean;
  dueAt: string | null;
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  status: 'assigned' | 'completed';
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  courseTitle: string;
  teacherName?: string;
}

export interface VocabularyItem {
  id: string;
  term: string;
  definition: string;
  createdAt: string;
}

export interface StudentDashboardData {
  profile: User;
  stats: {
    completed: number;
    total: number;
    progress: number;
    learningMinutes: number;
    achievements: number;
    quickQuizWins: number;
    streak: number;
  };
  lessons: LessonSummary[];
  achievements: Achievement[];
  activities: Activity[];
  assignments: Assignment[];
  announcements: Announcement[];
  vocabulary: VocabularyItem[];
  recommendation: LessonSummary | null;
  skillMastery: Array<{ category: Category; score: number }>;
}

export interface QuickQuestion {
  id: string;
  prompt: string;
  choices: string[];
}

export interface LessonResult {
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  masteryScore: number;
  firstCompletion: boolean;
  review: Array<{
    prompt: string;
    type: QuestionType;
    selected: number | string | number[];
    answer: number | string | number[];
    correct: boolean;
    explanation: string;
  }>;
  dashboard: StudentDashboardData;
}

export interface TeacherCourse {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  status: 'draft' | 'published' | 'archived';
  catalogVisibility: 'private' | 'public';
  enrollmentMode: 'invite' | 'self';
  certificateEnabled: boolean;
  prerequisiteCourseId?: string | null;
  moduleCount: number;
  lessonCount: number;
  studentCount: number;
  modules: Array<{ id: string; title: string; position: number }>;
  lessons: Array<{
    id: string;
    title: string;
    category: Category;
    difficulty: string;
    minutes: number;
    status: 'draft' | 'published' | 'archived';
    moduleId: string | null;
    masteryScore: number;
    questionCount: number;
  }>;
}

export interface TeacherStudent {
  id: string;
  name: string;
  email: string;
  proficiency: string;
  xp: number;
  courseCount: number;
  completedLessons: number;
  averageScore: number;
}

export interface TeacherDashboardData {
  profile: User;
  stats: { courses: number; publishedLessons: number; students: number; attempts: number };
  courses: TeacherCourse[];
  students: TeacherStudent[];
  assignments: Array<{
    id: string;
    title: string;
    dueAt: string | null;
    lessonTitle: string;
    courseTitle: string;
    studentCount: number;
    completedCount: number;
  }>;
  announcements: Announcement[];
}

export interface LessonAnalytics {
  lesson: { id: string; title: string };
  summary: { attempts: number; averageScore: number; passRate: number };
  attempts: Array<{
    id: string;
    studentId: string;
    studentName: string;
    score: number;
    passed: number;
    correct: number;
    total: number;
    durationSeconds: number;
    createdAt: string;
  }>;
  questions: Array<{ prompt: string; attempts: number; correctRate: number }>;
}
