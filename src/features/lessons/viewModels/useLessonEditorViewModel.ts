import { useEffect, useMemo, useState } from 'react';
import type { Lesson, QuestionType, TeacherCourse } from '../../academy/models/types';
import { getLesson, saveLesson } from '../models/api';
import type { DraftQuestion, LessonEditorSubmitEvent, LessonEditorViewModel, LessonEditorViewProps, LessonForm, LessonSaveStatus } from '../models/types';

function blankQuestion(): DraftQuestion {
  return {
    prompt: '',
    type: 'multiple_choice',
    choices: ['', '', ''],
    answer: 0,
    explanation: ''
  };
}

function defaultForm(course: TeacherCourse): LessonForm {
  return {
    courseId: course.id,
    moduleId: course.modules[0]?.id || '',
    title: '',
    category: 'reading',
    eyebrow: 'English Quest',
    minutes: 5,
    difficulty: course.difficulty || 'Beginner',
    passage: '',
    audioText: '',
    speakPhrase: '',
    audioUrl: '',
    videoUrl: '',
    resourceUrl: '',
    objectives: '',
    xpReward: 100,
    masteryScore: 75,
    questions: [blankQuestion()]
  };
}

function formFromLesson(lesson: Lesson): LessonForm {
  return {
    courseId: lesson.courseId,
    moduleId: lesson.moduleId || '',
    title: lesson.title,
    category: lesson.category,
    eyebrow: lesson.eyebrow,
    minutes: lesson.minutes,
    difficulty: lesson.difficulty,
    passage: lesson.passage,
    audioText: lesson.audioText || '',
    speakPhrase: lesson.speakPhrase || '',
    audioUrl: lesson.audioUrl || '',
    videoUrl: lesson.videoUrl || '',
    resourceUrl: lesson.resourceUrl || '',
    objectives: lesson.objectives.join('\n'),
    xpReward: lesson.xpReward,
    masteryScore: lesson.masteryScore,
    questions: lesson.questions.map((question) => ({ ...question, answer: question.answer ?? (question.type === 'fill_blank' ? '' : 0) }))
  };
}

export function useLessonEditorViewModel(props: LessonEditorViewProps): LessonEditorViewModel {
  const { courses, lessonId, initialCourseId, onClose, onSaved, notify } = props;
  const firstCourse = courses.find((course) => course.id === initialCourseId) || courses[0];
  const [form, setForm] = useState<LessonForm>(() => defaultForm(firstCourse));
  const [loading, setLoading] = useState(Boolean(lessonId));
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');

  const selectedCourse = useMemo(() => courses.find((course) => course.id === form.courseId) || firstCourse, [courses, firstCourse, form.courseId]);

  useEffect(() => {
    if (!lessonId) return;
    getLesson(lessonId)
      .then((lesson) => setForm(formFromLesson(lesson)))
      .catch((err) => {
        notify(err instanceof Error ? err.message : 'Could not open the lesson editor.');
        onClose();
      })
      .finally(() => setLoading(false));
  }, [lessonId, notify, onClose]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [busy, onClose]);

  const updateQuestion = (index: number, update: Partial<DraftQuestion>) => setForm((current) => ({
    ...current,
    questions: current.questions.map((question, questionIndex) => questionIndex === index ? { ...question, ...update } : question)
  }));

  const changeType = (index: number, type: QuestionType) => {
    if (type === 'true_false') updateQuestion(index, { type, choices: ['True', 'False'], answer: 0 });
    else if (type === 'fill_blank') updateQuestion(index, { type, choices: [], answer: '' });
    else updateQuestion(index, { type, choices: ['', '', ''], answer: 0 });
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= form.questions.length) return;
    setForm((current) => {
      const questions = [...current.questions];
      [questions[index], questions[destination]] = [questions[destination], questions[index]];
      return { ...current, questions };
    });
  };

  const save = (event: LessonEditorSubmitEvent, status: LessonSaveStatus) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    void saveLesson(lessonId, form, status)
      .then((result) => {
        onSaved(result.dashboard);
        notify(status === 'published' ? 'Lesson published and ready for learners.' : 'Lesson draft saved.');
        onClose();
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not save the lesson.'))
      .finally(() => setBusy(false));
  };

  return {
    courses,
    lessonId,
    onClose,
    form,
    setForm,
    loading,
    busy,
    preview,
    error,
    selectedCourse,
    blankQuestion,
    changeType,
    moveQuestion,
    updateQuestion,
    togglePreview: () => setPreview((value) => !value),
    save
  };
}
