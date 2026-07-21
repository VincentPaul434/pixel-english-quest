import { useEffect, useState } from 'react';
import type { LessonAnalytics, TeacherCourse, TeacherDashboardData } from '../../academy/models/types';
import { archiveLesson, createModule, getLessonAnalytics, getTeacherDashboard, publishLesson, updateCourseStatus } from '../models/api';
import type { AssignmentTarget, LessonEditorTarget, TeacherTab, TeacherWorkspaceViewModel, TeacherWorkspaceViewProps } from '../models/types';
import { duplicateLesson, reorderLessons } from '../../platform/models/api';

export function useTeacherWorkspaceViewModel({ onLogout, page, onNavigate }: TeacherWorkspaceViewProps): TeacherWorkspaceViewModel {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const tab: TeacherTab = page === 'dashboard' ? 'overview' : page === 'courses' ? 'content' : page;
  const setTab = (nextTab: TeacherTab) => onNavigate(`/teacher/${nextTab === 'overview' ? 'dashboard' : nextTab === 'content' ? 'courses' : nextTab}`);
  const [menuOpen, setMenuOpen] = useState(false);
  const [courseForm, setCourseForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState(false);
  const [editor, setEditor] = useState<LessonEditorTarget | null>(null);
  const [assignment, setAssignment] = useState<AssignmentTarget | null>(null);
  const [analytics, setAnalytics] = useState<LessonAnalytics | null>(null);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const notify = (message: string) => setToast(message);

  useEffect(() => {
    getTeacherDashboard().then(setData).catch((err) => setError(err instanceof Error ? err.message : 'Could not load the teacher workspace.'));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const addModule = async (course: TeacherCourse) => {
    const title = window.prompt('Module title');
    if (!title?.trim()) return;
    try {
      setData(await createModule(course.id, title));
      notify('Module added.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not add the module.');
    }
  };

  const updateCourse = async (course: TeacherCourse, status: TeacherCourse['status']) => {
    try {
      setData(await updateCourseStatus(course, status));
      notify(status === 'published' ? 'Course published and learners enrolled.' : 'Course updated.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update the course.');
    }
  };

  const publishTeacherLesson = async (id: string) => {
    try {
      setData(await publishLesson(id));
      notify('Lesson published.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not publish the lesson.');
    }
  };

  const archiveTeacherLesson = async (id: string) => {
    if (!window.confirm('Archive this lesson? Existing attempt records will remain available.')) return;
    try {
      setData(await archiveLesson(id));
      notify('Lesson archived.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not archive the lesson.');
    }
  };

  const openAnalytics = async (id: string) => {
    try {
      setAnalytics(await getLessonAnalytics(id));
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not load analytics.');
    }
  };

  const duplicateTeacherLesson = async (id: string) => {
    try {
      await duplicateLesson(id);
      setData(await getTeacherDashboard());
      notify('Lesson duplicated as a draft.');
    } catch (err) { notify(err instanceof Error ? err.message : 'Could not duplicate the lesson.'); }
  };

  const moveTeacherLesson = async (course: TeacherCourse, lessonId: string, direction: -1 | 1) => {
    const index = course.lessons.findIndex((lesson) => lesson.id === lessonId);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= course.lessons.length) return;
    const lessonIds = course.lessons.map((lesson) => lesson.id);
    [lessonIds[index], lessonIds[destination]] = [lessonIds[destination], lessonIds[index]];
    try { await reorderLessons(course.id, lessonIds); setData(await getTeacherDashboard()); notify('Lesson order updated.'); }
    catch (err) { notify(err instanceof Error ? err.message : 'Could not reorder lessons.'); }
  };

  const contentActions = {
    addModule: (course: TeacherCourse) => void addModule(course),
    updateCourse: (course: TeacherCourse, status: TeacherCourse['status']) => void updateCourse(course, status),
    openAnnouncement: () => setAnnouncementForm(true),
    openCourseForm: () => setCourseForm(true),
    openEditor: setEditor,
    openAssignment: setAssignment,
    publishLesson: (id: string) => void publishTeacherLesson(id),
    archiveLesson: (id: string) => void archiveTeacherLesson(id),
    openAnalytics: (id: string) => void openAnalytics(id),
    duplicateLesson: (id: string) => void duplicateTeacherLesson(id),
    moveLesson: (course: TeacherCourse, id: string, direction: -1 | 1) => void moveTeacherLesson(course, id, direction)
  };

  return {
    data,
    tab,
    menuOpen,
    courseForm,
    announcementForm,
    editor,
    assignment,
    analytics,
    toast,
    error,
    contentActions,
    setTab,
    setMenuOpen,
    setCourseForm,
    setAnnouncementForm,
    setEditor,
    setAssignment,
    setAnalytics,
    setData,
    notify,
    onLogout
  };
}
