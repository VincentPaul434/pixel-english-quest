import type { Dispatch, FormEventHandler, SetStateAction } from 'react';
import type { Category, Lesson, LessonResult, LessonSummary, QuickQuestion, StudentDashboardData, User, VocabularyItem } from '../../academy/models/types';
import type { StudentPage } from '../../../routes/route-types';

export type StudentWorkspaceViewProps = {
  initialUser: User;
  onLogout: () => void;
  page: StudentPage;
  onNavigate: (path: string) => void;
};

export type RecognitionInstance = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

export type SpeechAttemptResult = {
  transcript: string;
  accuracy: number;
  feedback: string;
};

export type QuickQuizSubmitResult = {
  correct: boolean;
  answer: number;
  explanation: string;
  xpAwarded: number;
  dashboard: StudentDashboardData;
};

export type LessonDialogProps = {
  summary: LessonSummary;
  onClose: () => void;
  onDashboard: (data: StudentDashboardData) => void;
  notify: (message: string) => void;
};

export type QuickQuizDialogProps = {
  onClose: () => void;
  onDashboard: (data: StudentDashboardData) => void;
  notify: (message: string) => void;
};

export type VocabularyPanelProps = {
  items: VocabularyItem[];
  onChanged: (items: VocabularyItem[]) => void;
  notify: (message: string) => void;
};

export type StudentWorkspaceViewModel = {
  data: StudentDashboardData | null;
  error: string;
  selectedLesson: LessonSummary | null;
  selectedCategory: Category | 'all';
  quizOpen: boolean;
  profileOpen: boolean;
  menuOpen: boolean;
  toast: string;
  showAllLessons: boolean;
  lessons: LessonSummary[];
  visibleLessons: LessonSummary[];
  xpInLevel: number;
  notify: (message: string) => void;
  reset: () => void;
  setData: Dispatch<SetStateAction<StudentDashboardData | null>>;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  setProfileOpen: Dispatch<SetStateAction<boolean>>;
  setQuizOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedCategory: Dispatch<SetStateAction<Category | 'all'>>;
  setSelectedLesson: Dispatch<SetStateAction<LessonSummary | null>>;
  setShowAllLessons: Dispatch<SetStateAction<boolean>>;
};

export type LessonLoadState = {
  lesson: Lesson | null;
  answers: Array<number | string | number[]>;
  result: LessonResult | null;
};

export type ProfileEditorProps = {
  profile: User;
  onClose: () => void;
  onSaved: (data: StudentDashboardData) => void;
};

export type ProfileEditorViewModel = {
  name: string;
  proficiency: string;
  learningGoal: string;
  dailyGoal: number;
  busy: boolean;
  error: string;
  setName: Dispatch<SetStateAction<string>>;
  setProficiency: Dispatch<SetStateAction<string>>;
  setLearningGoal: Dispatch<SetStateAction<string>>;
  setDailyGoal: Dispatch<SetStateAction<number>>;
  save: FormEventHandler<HTMLFormElement>;
};

export type OnboardingProps = {
  profile: User;
  onComplete: (data: StudentDashboardData) => void;
};

export type OnboardingViewModel = {
  proficiency: string;
  learningGoal: string;
  dailyGoal: number;
  busy: boolean;
  setProficiency: Dispatch<SetStateAction<string>>;
  setLearningGoal: Dispatch<SetStateAction<string>>;
  setDailyGoal: Dispatch<SetStateAction<number>>;
  submit: () => void;
};

export type LessonDialogViewModel = {
  lesson: Lesson | null;
  answers: Array<number | string | number[]>;
  result: LessonResult | null;
  busy: boolean;
  notes: string;
  bookmarked: boolean;
  speechBusy: boolean;
  speechResult: SpeechAttemptResult | null;
  setResult: Dispatch<SetStateAction<LessonResult | null>>;
  setAnswers: Dispatch<SetStateAction<Array<number | string | number[]>>>;
  setNotes: Dispatch<SetStateAction<string>>;
  setBookmarked: Dispatch<SetStateAction<boolean>>;
  speak: (text: string) => void;
  choose: (questionIndex: number, value: number | string | number[]) => void;
  saveStudy: () => void;
  submit: () => void;
  practiseSpeaking: () => void;
  restart: () => void;
};

export type QuickQuizDialogViewModel = {
  question: QuickQuestion | null;
  choice: number | null;
  result: Omit<QuickQuizSubmitResult, 'dashboard'> | null;
  busy: boolean;
  setChoice: Dispatch<SetStateAction<number | null>>;
  load: () => void;
  submit: () => void;
};

export type VocabularyPanelViewModel = {
  term: string;
  definition: string;
  setTerm: Dispatch<SetStateAction<string>>;
  setDefinition: Dispatch<SetStateAction<string>>;
  add: FormEventHandler<HTMLFormElement>;
  remove: (id: string) => void;
};
