import { useCallback, useEffect, useState } from 'react';
import type { LessonAnalytics, TeacherCourse } from '../../academy/models/types';
import type { AssignmentTarget, LessonEditorTarget, TeacherTab, TeacherWorkspaceViewModel, TeacherWorkspaceViewProps } from '../models/types';
import {
  useArchiveLessonMutation, useCreateModuleMutation, useDuplicateLessonMutation, usePublishLessonMutation,
  useReorderLessonsMutation, useUpdateCourseStatusMutation
} from '../../../hooks/mutations/teacherMutations';
import { useLessonAnalyticsQuery, useTeacherDashboardQuery } from '../../../hooks/queries/teacherQueries';

export function useTeacherWorkspaceViewModel({ onLogout, page, onNavigate }: TeacherWorkspaceViewProps): TeacherWorkspaceViewModel {
  const dashboardQuery = useTeacherDashboardQuery();
  const createModuleMutation = useCreateModuleMutation();
  const updateCourseMutation = useUpdateCourseStatusMutation();
  const publishLessonMutation = usePublishLessonMutation();
  const archiveLessonMutation = useArchiveLessonMutation();
  const duplicateLessonMutation = useDuplicateLessonMutation();
  const reorderLessonsMutation = useReorderLessonsMutation();
  const data = dashboardQuery.data ?? null;
  const tab: TeacherTab = page === 'dashboard' ? 'overview' : page === 'courses' ? 'content' : page;
  const setTab = (nextTab: TeacherTab) => onNavigate(`/teacher/${nextTab === 'overview' ? 'dashboard' : nextTab === 'content' ? 'courses' : nextTab}`);
  const [menuOpen, setMenuOpen] = useState(false);
  const [courseForm, setCourseForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState(false);
  const [editor, setEditor] = useState<LessonEditorTarget | null>(null);
  const [assignment, setAssignment] = useState<AssignmentTarget | null>(null);
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);
  const analyticsQuery = useLessonAnalyticsQuery(analyticsId);
  const analytics = analyticsQuery.data ?? null;
  const setAnalytics = (value: LessonAnalytics | null) => setAnalyticsId(value?.lesson.id ?? null);
  const [toast, setToast] = useState('');
  const error = dashboardQuery.error instanceof Error ? dashboardQuery.error.message : '';
  const notify = useCallback((message: string) => setToast(message), []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (analyticsQuery.error) notify(analyticsQuery.error instanceof Error ? analyticsQuery.error.message : 'Could not load analytics.');
  }, [analyticsQuery.error, notify]);

  const addModule = async (course: TeacherCourse) => {
    const title = window.prompt('Module title');
    if (!title?.trim()) return;
    try {
      await createModuleMutation.mutateAsync({ courseId: course.id, title });
      notify('Module added.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not add the module.');
    }
  };

  const updateCourse = async (course: TeacherCourse, status: TeacherCourse['status']) => {
    try {
      await updateCourseMutation.mutateAsync({ course, status });
      notify(status === 'published' ? 'Course published and learners enrolled.' : 'Course updated.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update the course.');
    }
  };

  const publishTeacherLesson = async (id: string) => {
    try {
      await publishLessonMutation.mutateAsync(id);
      notify('Lesson published.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not publish the lesson.');
    }
  };

  const archiveTeacherLesson = async (id: string) => {
    if (!window.confirm('Archive this lesson? Existing attempt records will remain available.')) return;
    try {
      await archiveLessonMutation.mutateAsync(id);
      notify('Lesson archived.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not archive the lesson.');
    }
  };

  const openAnalytics = async (id: string) => {
    setAnalyticsId(id);
  };

  const duplicateTeacherLesson = async (id: string) => {
    try {
      await duplicateLessonMutation.mutateAsync(id);
      notify('Lesson duplicated as a draft.');
    } catch (err) { notify(err instanceof Error ? err.message : 'Could not duplicate the lesson.'); }
  };

  const moveTeacherLesson = async (course: TeacherCourse, lessonId: string, direction: -1 | 1) => {
    const index = course.lessons.findIndex((lesson) => lesson.id === lessonId);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= course.lessons.length) return;
    const lessonIds = course.lessons.map((lesson) => lesson.id);
    [lessonIds[index], lessonIds[destination]] = [lessonIds[destination], lessonIds[index]];
    try { await reorderLessonsMutation.mutateAsync({ courseId: course.id, lessonIds }); notify('Lesson order updated.'); }
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
    notify,
    onLogout
  };
}
