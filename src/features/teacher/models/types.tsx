import type { Dispatch, FormEventHandler, ReactNode, SetStateAction } from 'react';
import type { LessonAnalytics, TeacherCourse, TeacherDashboardData, User } from '../../academy/models/types';

export type TeacherTab = 'overview' | 'content' | 'students' | 'assignments' | 'operations';
export type Notify = (message: string) => void;
export type DashboardSaved = (data: TeacherDashboardData) => void;

export type TeacherWorkspaceViewProps = {
  initialUser: User;
  onLogout: () => void;
};

export type TeacherModalProps = {
  children: ReactNode;
  onClose: () => void;
  label: string;
  wide?: boolean;
};

export type LessonEditorTarget = {
  lessonId: string | null;
  courseId: string;
};

export type AssignmentTarget = {
  course: TeacherCourse;
  lessonId: string;
};

export type TeacherContentActions = {
  addModule: (course: TeacherCourse) => void;
  updateCourse: (course: TeacherCourse, status: TeacherCourse['status']) => void;
  openAnnouncement: () => void;
  openCourseForm: () => void;
  openEditor: (editor: LessonEditorTarget) => void;
  openAssignment: (assignment: AssignmentTarget) => void;
  publishLesson: (lessonId: string) => void;
  archiveLesson: (lessonId: string) => void;
  openAnalytics: (lessonId: string) => void;
  duplicateLesson: (lessonId: string) => void;
  moveLesson: (course: TeacherCourse, lessonId: string, direction: -1 | 1) => void;
};

export type TeacherWorkspaceViewModel = {
  data: TeacherDashboardData | null;
  tab: TeacherTab;
  menuOpen: boolean;
  courseForm: boolean;
  announcementForm: boolean;
  editor: LessonEditorTarget | null;
  assignment: AssignmentTarget | null;
  analytics: LessonAnalytics | null;
  toast: string;
  error: string;
  contentActions: TeacherContentActions;
  setTab: Dispatch<SetStateAction<TeacherTab>>;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  setCourseForm: Dispatch<SetStateAction<boolean>>;
  setAnnouncementForm: Dispatch<SetStateAction<boolean>>;
  setEditor: Dispatch<SetStateAction<LessonEditorTarget | null>>;
  setAssignment: Dispatch<SetStateAction<AssignmentTarget | null>>;
  setAnalytics: Dispatch<SetStateAction<LessonAnalytics | null>>;
  setData: Dispatch<SetStateAction<TeacherDashboardData | null>>;
  notify: Notify;
  onLogout: () => void;
};

export type CourseFormProps = {
  onClose: () => void;
  onSaved: DashboardSaved;
  notify: Notify;
};

export type CourseFormViewModel = {
  title: string;
  description: string;
  difficulty: string;
  catalogVisibility: 'private' | 'public';
  enrollmentMode: 'invite' | 'self';
  certificateEnabled: boolean;
  busy: boolean;
  setTitle: Dispatch<SetStateAction<string>>;
  setDescription: Dispatch<SetStateAction<string>>;
  setDifficulty: Dispatch<SetStateAction<string>>;
  setCatalogVisibility: Dispatch<SetStateAction<'private' | 'public'>>;
  setEnrollmentMode: Dispatch<SetStateAction<'invite' | 'self'>>;
  setCertificateEnabled: Dispatch<SetStateAction<boolean>>;
  submit: FormEventHandler<HTMLFormElement>;
};

export type AssignmentFormProps = {
  course: TeacherCourse;
  lessonId: string;
  students: TeacherDashboardData['students'];
  onClose: () => void;
  onSaved: DashboardSaved;
  notify: Notify;
};

export type AssignmentFormViewModel = {
  lesson: TeacherCourse['lessons'][number];
  title: string;
  dueAt: string;
  instructions: string;
  submissionType: string;
  allowResubmission: boolean;
  selected: string[];
  busy: boolean;
  setTitle: Dispatch<SetStateAction<string>>;
  setDueAt: Dispatch<SetStateAction<string>>;
  setInstructions: Dispatch<SetStateAction<string>>;
  setSubmissionType: Dispatch<SetStateAction<string>>;
  setAllowResubmission: Dispatch<SetStateAction<boolean>>;
  setSelected: Dispatch<SetStateAction<string[]>>;
  toggle: (id: string) => void;
  submit: FormEventHandler<HTMLFormElement>;
};

export type AnnouncementFormProps = {
  courses: TeacherCourse[];
  onClose: () => void;
  onSaved: DashboardSaved;
  notify: Notify;
};

export type AnnouncementFormViewModel = {
  courseId: string;
  title: string;
  body: string;
  busy: boolean;
  setCourseId: Dispatch<SetStateAction<string>>;
  setTitle: Dispatch<SetStateAction<string>>;
  setBody: Dispatch<SetStateAction<string>>;
  submit: FormEventHandler<HTMLFormElement>;
};
