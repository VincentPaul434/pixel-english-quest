export type Category = 'reading' | 'grammar' | 'listening' | 'speaking';

export interface Profile {
  name: string;
  level: number;
  xp: number;
}

export interface LessonSummary {
  id: string;
  category: Category;
  title: string;
  eyebrow: string;
  icon: string;
  minutes: number;
  difficulty: string;
  completed: boolean;
}

export interface Lesson extends LessonSummary {
  passage: string;
  audioText?: string;
  speakPhrase?: string;
  questions: { prompt: string; choices: string[] }[];
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

export interface DashboardData {
  profile: Profile;
  stats: {
    completed: number;
    total: number;
    progress: number;
    readingMinutes: number;
    achievements: number;
    quickQuizWins: number;
  };
  lessons: LessonSummary[];
  achievements: Achievement[];
  activities: Activity[];
}

export interface QuickQuestion {
  id: string;
  prompt: string;
  choices: string[];
}
