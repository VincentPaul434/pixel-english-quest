export const sessionKeys = {
  all: ['session'] as const,
  me: () => [...sessionKeys.all, 'me'] as const
};

export const studentKeys = {
  all: ['student'] as const,
  dashboard: () => [...studentKeys.all, 'dashboard'] as const,
  quickQuiz: () => [...studentKeys.all, 'quick-quiz'] as const
};

export const lessonKeys = {
  all: ['lessons'] as const,
  detail: (lessonId: string) => [...lessonKeys.all, 'detail', lessonId] as const
};

export const teacherKeys = {
  all: ['teacher'] as const,
  dashboard: () => [...teacherKeys.all, 'dashboard'] as const,
  analytics: () => [...teacherKeys.all, 'analytics'] as const,
  lessonAnalytics: (lessonId: string) => [...teacherKeys.analytics(), lessonId] as const
};

export const platformKeys = {
  all: ['platform'] as const,
  overview: () => [...platformKeys.all, 'overview'] as const,
  invitations: () => [...platformKeys.all, 'invitations'] as const,
  invitation: (code: string) => [...platformKeys.invitations(), code] as const,
  admin: () => [...platformKeys.all, 'admin'] as const
};
