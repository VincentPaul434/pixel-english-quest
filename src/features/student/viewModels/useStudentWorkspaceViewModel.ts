import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Category, LessonSummary } from '../../academy/models/types';
import { useResetProgressMutation } from '../../../hooks/mutations/studentMutations';
import { useStudentDashboardQuery } from '../../../hooks/queries/studentQueries';
import type { StudentWorkspaceViewModel, StudentWorkspaceViewProps } from '../models/types';

export function useStudentWorkspaceViewModel(_props?: StudentWorkspaceViewProps): StudentWorkspaceViewModel {
  const dashboardQuery = useStudentDashboardQuery();
  const resetMutation = useResetProgressMutation();
  const data = dashboardQuery.data ?? null;
  const error = dashboardQuery.error instanceof Error ? dashboardQuery.error.message : '';
  const [selectedLesson, setSelectedLesson] = useState<LessonSummary | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [quizOpen, setQuizOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [showAllLessons, setShowAllLessons] = useState(false);

  const notify = useCallback((message: string) => setToast(message), []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const lessons = useMemo(() => data?.lessons.filter((lesson) => selectedCategory === 'all' || lesson.category === selectedCategory) || [], [data, selectedCategory]);
  const visibleLessons = showAllLessons ? lessons : lessons.slice(0, 6);

  const reset = () => {
    if (!window.confirm('Reset your attempts, XP, achievements, vocabulary, and activity? Your account and enrollment remain.')) return;
    void resetMutation.mutateAsync()
      .then(() => notify('A fresh adventure begins.'))
      .catch((err) => notify(err instanceof Error ? err.message : 'Could not reset progress.'));
  };

  return {
    data,
    error,
    selectedLesson,
    selectedCategory,
    quizOpen,
    profileOpen,
    menuOpen,
    toast,
    showAllLessons,
    lessons,
    visibleLessons,
    xpInLevel: data ? data.profile.xp % 250 : 0,
    notify,
    reset,
    setMenuOpen,
    setProfileOpen,
    setQuizOpen,
    setSelectedCategory,
    setSelectedLesson,
    setShowAllLessons
  };
}
