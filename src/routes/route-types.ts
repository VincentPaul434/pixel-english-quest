export type StudentPage = 'dashboard' | 'courses' | 'assignments' | 'learning-hub' | 'study' | 'achievements' | 'activity';
export type TeacherPage = 'dashboard' | 'courses' | 'students' | 'assignments' | 'operations';
export type AppRouteId = 'auth' | `student-${StudentPage}` | `teacher-${TeacherPage}`;

export type AppRoute = {
  id: AppRouteId;
  path: string;
  feature: 'auth' | 'student' | 'teacher';
  label: string;
  componentPath: string;
};

export type Navigate = (path: string, replace?: boolean) => void;
