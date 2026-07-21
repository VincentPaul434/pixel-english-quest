import { useEffect, useMemo, useRef, useState } from 'react';
import type { Lesson, QuestionType, TeacherCourse } from '../../academy/models/types';
import { useSaveLessonMutation } from '../../../hooks/mutations/teacherMutations';
import { useLessonQuery } from '../../../hooks/queries/studentQueries';
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
    attemptLimit: 0,
    shuffleQuestions: false,
    availableFrom: '',
    availableUntil: '',
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
    attemptLimit: lesson.attemptLimit || 0,
    shuffleQuestions: Boolean(lesson.shuffleQuestions),
    availableFrom: lesson.availableFrom ? lesson.availableFrom.slice(0, 16) : '',
    availableUntil: lesson.availableUntil ? lesson.availableUntil.slice(0, 16) : '',
    questions: lesson.questions.map((question) => ({ ...question, answer: question.answer ?? (['fill_blank', 'essay'].includes(question.type) ? '' : ['matching', 'ordering'].includes(question.type) ? question.choices.map((_, index) => index) : 0) }))
  };
}

export function useLessonEditorViewModel(props: LessonEditorViewProps): LessonEditorViewModel {
  const { courses, lessonId, initialCourseId, onClose, notify } = props;
  const firstCourse = courses.find((course) => course.id === initialCourseId) || courses[0];
  const [form, setForm] = useState<LessonForm>(() => defaultForm(firstCourse));
  const [preview, setPreview] = useState(false);
  const lessonQuery = useLessonQuery(lessonId || '');
  const saveMutation = useSaveLessonMutation();
  const initializedLessonId = useRef('');
  const reportedError = useRef<unknown>(null);
  const loading = Boolean(lessonId) && lessonQuery.isPending;
  const busy = saveMutation.isPending;
  const error = saveMutation.error instanceof Error ? saveMutation.error.message : '';

  const selectedCourse = useMemo(() => courses.find((course) => course.id === form.courseId) || firstCourse, [courses, firstCourse, form.courseId]);

  useEffect(() => {
    if (lessonQuery.data && initializedLessonId.current !== lessonQuery.data.id) {
      initializedLessonId.current = lessonQuery.data.id;
      setForm(formFromLesson(lessonQuery.data));
    }
    if (lessonQuery.error && reportedError.current !== lessonQuery.error) {
      reportedError.current = lessonQuery.error;
      notify(lessonQuery.error instanceof Error ? lessonQuery.error.message : 'Could not open the lesson editor.');
      onClose();
    }
  }, [lessonQuery.data, lessonQuery.error, notify, onClose]);

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
    else if (['fill_blank', 'essay'].includes(type)) updateQuestion(index, { type, choices: [], answer: '' });
    else if (['matching', 'ordering'].includes(type)) updateQuestion(index, { type, choices: ['', '', ''], answer: [0, 1, 2] });
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
    void saveMutation.mutateAsync({ lessonId, form, status })
      .then(() => {
        notify(status === 'published' ? 'Lesson published and ready for learners.' : 'Lesson draft saved.');
        onClose();
      })
      .catch(() => undefined);
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
