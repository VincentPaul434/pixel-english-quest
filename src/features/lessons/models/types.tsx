import type { Dispatch, SetStateAction } from 'react';
import type { Category, Lesson, Question, QuestionType, TeacherCourse, TeacherDashboardData } from '../../academy/models/types';

export type DraftQuestion = Question & { answer: number | string | number[] };

export type LessonForm = {
  courseId: string;
  moduleId: string;
  title: string;
  category: Category;
  eyebrow: string;
  minutes: number;
  difficulty: string;
  passage: string;
  audioText: string;
  speakPhrase: string;
  audioUrl: string;
  videoUrl: string;
  resourceUrl: string;
  objectives: string;
  xpReward: number;
  masteryScore: number;
  attemptLimit: number;
  shuffleQuestions: boolean;
  availableFrom: string;
  availableUntil: string;
  questions: DraftQuestion[];
};

export type LessonEditorViewProps = {
  courses: TeacherCourse[];
  lessonId: string | null;
  initialCourseId: string;
  onClose: () => void;
  notify: (message: string) => void;
};

export type LessonSaveStatus = 'draft' | 'published';
export type LessonEditorSubmitEvent = { preventDefault: () => void };

export type LessonEditorSaveResponse = {
  lesson: Lesson;
  dashboard: TeacherDashboardData;
};

export type LessonEditorViewModel = {
  courses: TeacherCourse[];
  lessonId: string | null;
  onClose: () => void;
  form: LessonForm;
  setForm: Dispatch<SetStateAction<LessonForm>>;
  loading: boolean;
  busy: boolean;
  preview: boolean;
  error: string;
  selectedCourse: TeacherCourse;
  blankQuestion: () => DraftQuestion;
  changeType: (index: number, type: QuestionType) => void;
  moveQuestion: (index: number, direction: -1 | 1) => void;
  updateQuestion: (index: number, update: Partial<DraftQuestion>) => void;
  togglePreview: () => void;
  save: (event: LessonEditorSubmitEvent, status: LessonSaveStatus) => void;
};
