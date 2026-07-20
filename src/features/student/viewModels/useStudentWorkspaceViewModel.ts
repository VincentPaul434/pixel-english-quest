import { useEffect, useMemo, useState } from 'react';
import type { Category, LessonSummary, StudentDashboardData } from '../../academy/models/types';
import { getStudentDashboard, resetProgress } from '../models/api';
import type { StudentWorkspaceViewModel, StudentWorkspaceViewProps } from '../models/types';

export function useStudentWorkspaceViewModel(_props?: StudentWorkspaceViewProps): StudentWorkspaceViewModel {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [error, setError] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<LessonSummary | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [quizOpen, setQuizOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [showAllLessons, setShowAllLessons] = useState(false);

  const notify = (message: string) => setToast(message);

  useEffect(() => {
    getStudentDashboard().then(setData).catch((err) => setError(err instanceof Error ? err.message : 'Could not load the dashboard.'));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const lessons = useMemo(() => data?.lessons.filter((lesson) => selectedCategory === 'all' || lesson.category === selectedCategory) || [], [data, selectedCategory]);
  const visibleLessons = showAllLessons ? lessons : lessons.slice(0, 6);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  const reset = () => {
    if (!window.confirm('Reset your attempts, XP, achievements, vocabulary, and activity? Your account and enrollment remain.')) return;
    void resetProgress()
      .then((dashboard) => {
        setData(dashboard);
        notify('A fresh adventure begins.');
      })
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
    scrollTo,
    setData,
    setMenuOpen,
    setProfileOpen,
    setQuizOpen,
    setSelectedCategory,
    setSelectedLesson,
    setShowAllLessons
  };
}
