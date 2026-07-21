import { request } from '../../../services/api';
import type { LessonEditorSaveResponse, LessonForm, LessonSaveStatus } from './types';

export function saveLesson(lessonId: string | null, form: LessonForm, status: LessonSaveStatus) {
  const payload = {
    ...form,
    status,
    moduleId: form.moduleId || null,
    objectives: form.objectives.split('\n').map((item) => item.trim()).filter(Boolean),
    questions: form.questions.map((question) => ({ ...question, choices: question.choices.map((choice) => choice.trim()) }))
  };

  return request<LessonEditorSaveResponse>(
    lessonId ? `/api/teacher/lessons/${lessonId}` : '/api/teacher/lessons',
    { method: lessonId ? 'PUT' : 'POST', body: JSON.stringify(payload) }
  );
}
