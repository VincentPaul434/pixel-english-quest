import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PixelIcon } from '../../components/PixelIcon';
import { request } from '../../services/api';
import type { Category, Lesson, Question, QuestionType, TeacherCourse, TeacherDashboardData } from '../../types/academy';

type DraftQuestion = Question & { answer: number | string };

const blankQuestion = (): DraftQuestion => ({
  prompt: '',
  type: 'multiple_choice',
  choices: ['', '', ''],
  answer: 0,
  explanation: ''
});

type LessonForm = {
  courseId: string;
  moduleId: string;
  title: string;
  category: Category;
  eyebrow: string;
  minutes: number;
  difficulty: string;
  passage: string;
  audioText: string;
  speakPhrase: string;
  audioUrl: string;
  videoUrl: string;
  resourceUrl: string;
  objectives: string;
  xpReward: number;
  masteryScore: number;
  questions: DraftQuestion[];
};

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

export function LessonEditor({ courses, lessonId, initialCourseId, onClose, onSaved, notify }: {
  courses: TeacherCourse[];
  lessonId: string | null;
  initialCourseId: string;
  onClose: () => void;
  onSaved: (dashboard: TeacherDashboardData) => void;
  notify: (message: string) => void;
}) {
  const firstCourse = courses.find((course) => course.id === initialCourseId) || courses[0];
  const [form, setForm] = useState<LessonForm>(() => defaultForm(firstCourse));
  const [loading, setLoading] = useState(Boolean(lessonId));
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');

  const selectedCourse = useMemo(() => courses.find((course) => course.id === form.courseId) || firstCourse, [courses, firstCourse, form.courseId]);

  useEffect(() => {
    if (!lessonId) return;
    request<Lesson>(`/api/lessons/${lessonId}`).then((lesson) => {
      setForm({
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
      });
    }).catch((err) => { notify(err instanceof Error ? err.message : 'Could not open the lesson editor.'); onClose(); }).finally(() => setLoading(false));
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

  const payload = (status: 'draft' | 'published') => ({
    ...form,
    status,
    moduleId: form.moduleId || null,
    objectives: form.objectives.split('\n').map((item) => item.trim()).filter(Boolean),
    questions: form.questions.map((question) => ({ ...question, choices: question.choices.map((choice) => choice.trim()) }))
  });

  const save = async (event: FormEvent, status: 'draft' | 'published') => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await request<{ lesson: Lesson; dashboard: TeacherDashboardData }>(
        lessonId ? `/api/teacher/lessons/${lessonId}` : '/api/teacher/lessons',
        { method: lessonId ? 'PUT' : 'POST', body: JSON.stringify(payload(status)) }
      );
      onSaved(result.dashboard);
      notify(status === 'published' ? 'Lesson published and ready for learners.' : 'Lesson draft saved.');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the lesson.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="modal-layer"><div className="editor-loading panel"><PixelIcon name="sparkle" size={50} /><p>Loading lesson workshop...</p></div></div>;

  return (
    <div className="modal-layer editor-layer" role="dialog" aria-modal="true" aria-label="Lesson editor">
      <button className="modal-scrim" onClick={onClose} aria-label="Dismiss lesson editor" />
      <section className="lesson-editor panel">
        <header className="editor-header"><div><span className="overline"><PixelIcon name="magic" size={15} /> Teacher lesson workshop</span><h2>{lessonId ? 'Edit lesson' : 'Create a new lesson'}</h2><p>Build content, media, assessment, and mastery rules in one place.</p></div><div><button className="secondary-button" onClick={() => setPreview((value) => !value)}><PixelIcon name={preview ? 'pencil' : 'play'} /> {preview ? 'Edit' : 'Preview'}</button><button className="icon-button" onClick={onClose} aria-label="Close lesson editor"><PixelIcon name="close" /></button></div></header>

        {preview ? (
          <div className="editor-preview">
            <div className="modal-heading compact"><span><PixelIcon name={form.category === 'grammar' ? 'grammar' : form.category === 'listening' ? 'headphones' : form.category === 'speaking' ? 'mic' : 'book'} /></span><div><small>{selectedCourse.title} · {form.minutes} min</small><h2>{form.title || 'Untitled lesson'}</h2><p>{form.difficulty} · {form.masteryScore}% mastery · {form.xpReward} XP</p></div></div>
            {form.objectives && <div className="objective-list"><strong>Learning objectives</strong>{form.objectives.split('\n').filter(Boolean).map((objective) => <span key={objective}><PixelIcon name="check" size={14} /> {objective}</span>)}</div>}
            <div className="passage">{form.passage || 'Your lesson content preview will appear here.'}</div>
            {form.speakPhrase && <div className="speaking-lab"><PixelIcon name="mic" /><div><strong>Speaking phrase</strong><p>{form.speakPhrase}</p></div></div>}
            <div className="questions">{form.questions.map((question, index) => <fieldset key={index}><legend><span>{index + 1}</span>{question.prompt || 'Question prompt'}</legend>{question.type === 'fill_blank' ? <input className="fill-answer" disabled placeholder="Learner answer" /> : question.choices.map((choice, choiceIndex) => <label key={choiceIndex}><input type="radio" disabled /><i>{String.fromCharCode(65 + choiceIndex)}</i>{choice || `Choice ${choiceIndex + 1}`}</label>)}</fieldset>)}</div>
          </div>
        ) : (
          <form className="editor-body" onSubmit={(event) => void save(event, 'draft')}>
            <section className="editor-section"><div className="editor-section-title"><span>1</span><div><h3>Lesson details</h3><p>Place the lesson in your curriculum and define learner expectations.</p></div></div><div className="form-grid three-columns"><label>Course<select value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value, moduleId: courses.find((course) => course.id === event.target.value)?.modules[0]?.id || '' })}>{courses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select></label><label>Module<select value={form.moduleId} onChange={(event) => setForm({ ...form, moduleId: event.target.value })}><option value="">No module</option>{selectedCourse.modules.map((module) => <option value={module.id} key={module.id}>{module.title}</option>)}</select></label><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as Category })}><option value="reading">Reading</option><option value="grammar">Grammar</option><option value="listening">Listening</option><option value="speaking">Speaking</option></select></label><label className="span-two">Lesson title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={120} required placeholder="e.g. The Secret Library" /></label><label>Difficulty<select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label>Estimated minutes<input type="number" min={1} max={240} value={form.minutes} onChange={(event) => setForm({ ...form, minutes: Number(event.target.value) })} /></label><label>Passing score<input type="number" min={1} max={100} value={form.masteryScore} onChange={(event) => setForm({ ...form, masteryScore: Number(event.target.value) })} /></label><label>XP reward<input type="number" min={0} max={5000} value={form.xpReward} onChange={(event) => setForm({ ...form, xpReward: Number(event.target.value) })} /></label><label className="span-three">Learning objectives <small>One objective per line</small><textarea rows={3} value={form.objectives} onChange={(event) => setForm({ ...form, objectives: event.target.value })} placeholder="Understand the main idea&#10;Use context clues for new words" /></label></div></section>

            <section className="editor-section"><div className="editor-section-title"><span>2</span><div><h3>Content & media</h3><p>Add the teaching material and optional hosted resources.</p></div></div><div className="form-grid two-columns"><label className="span-two">Lesson content<textarea className="content-textarea" rows={9} value={form.passage} onChange={(event) => setForm({ ...form, passage: event.target.value })} required placeholder="Write the explanation, story, or instructions learners will study..." /></label>{form.category === 'listening' && <label className="span-two">Listening script<textarea rows={4} value={form.audioText} onChange={(event) => setForm({ ...form, audioText: event.target.value })} placeholder="Text used for browser narration and accessibility..." /></label>}{form.category === 'speaking' && <label className="span-two">Speaking phrase<input value={form.speakPhrase} onChange={(event) => setForm({ ...form, speakPhrase: event.target.value })} placeholder="Phrase learners should pronounce" /></label>}<label>Recorded audio URL<input type="url" value={form.audioUrl} onChange={(event) => setForm({ ...form, audioUrl: event.target.value })} placeholder="https://.../audio.mp3" /></label><label>Video URL<input type="url" value={form.videoUrl} onChange={(event) => setForm({ ...form, videoUrl: event.target.value })} placeholder="https://.../lesson-video" /></label><label className="span-two">Downloadable resource URL<input type="url" value={form.resourceUrl} onChange={(event) => setForm({ ...form, resourceUrl: event.target.value })} placeholder="https://.../worksheet.pdf" /></label></div></section>

            <section className="editor-section"><div className="editor-section-title"><span>3</span><div><h3>Assessment questions</h3><p>Mix multiple choice, true/false, and fill-in-the-blank questions.</p></div></div><div className="question-builder">{form.questions.map((question, index) => <article className="question-editor" key={index}><header><strong>Question {index + 1}</strong><div><button type="button" onClick={() => moveQuestion(index, -1)} disabled={index === 0}>↑</button><button type="button" onClick={() => moveQuestion(index, 1)} disabled={index === form.questions.length - 1}>↓</button><button type="button" className="danger-link" onClick={() => setForm({ ...form, questions: form.questions.filter((_, questionIndex) => questionIndex !== index) })} disabled={form.questions.length === 1}><PixelIcon name="close" size={14} /> Remove</button></div></header><div className="form-grid two-columns"><label className="span-two">Prompt<input value={question.prompt} onChange={(event) => updateQuestion(index, { prompt: event.target.value })} placeholder="Ask a clear question" /></label><label>Question type<select value={question.type} onChange={(event) => changeType(index, event.target.value as QuestionType)}><option value="multiple_choice">Multiple choice</option><option value="true_false">True or false</option><option value="fill_blank">Fill in the blank</option></select></label>{question.type === 'fill_blank' ? <label>Correct answer<input value={String(question.answer)} onChange={(event) => updateQuestion(index, { answer: event.target.value })} /></label> : <label>Correct choice<select value={Number(question.answer)} onChange={(event) => updateQuestion(index, { answer: Number(event.target.value) })}>{question.choices.map((choice, choiceIndex) => <option value={choiceIndex} key={choiceIndex}>{String.fromCharCode(65 + choiceIndex)} · {choice || `Choice ${choiceIndex + 1}`}</option>)}</select></label>}{question.type !== 'fill_blank' && <div className="choice-editor span-two">{question.choices.map((choice, choiceIndex) => <label key={choiceIndex}><span>{String.fromCharCode(65 + choiceIndex)}</span><input value={choice} onChange={(event) => updateQuestion(index, { choices: question.choices.map((item, itemIndex) => itemIndex === choiceIndex ? event.target.value : item) })} placeholder={`Choice ${choiceIndex + 1}`} />{question.type === 'multiple_choice' && question.choices.length > 2 && <button type="button" onClick={() => updateQuestion(index, { choices: question.choices.filter((_, itemIndex) => itemIndex !== choiceIndex), answer: 0 })}><PixelIcon name="close" size={13} /></button>}</label>)}{question.type === 'multiple_choice' && question.choices.length < 8 && <button type="button" onClick={() => updateQuestion(index, { choices: [...question.choices, ''] })}>+ Add choice</button>}</div>}<label className="span-two">Answer explanation<textarea rows={2} value={question.explanation || ''} onChange={(event) => updateQuestion(index, { explanation: event.target.value })} placeholder="Explain why the answer is correct" /></label></div></article>)}</div><button type="button" className="add-question" onClick={() => setForm({ ...form, questions: [...form.questions, blankQuestion()] })}><PixelIcon name="quiz" /> Add another question</button></section>

            {error && <div className="form-error" role="alert"><PixelIcon name="close" size={16} /> {error}</div>}
            <footer className="editor-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="secondary-button" disabled={busy}>{busy ? 'Saving...' : 'Save draft'}</button><button type="button" className="primary-button" disabled={busy} onClick={(event) => void save(event as unknown as FormEvent, 'published')}><PixelIcon name="sparkle" /> {busy ? 'Publishing...' : 'Publish lesson'}</button></footer>
          </form>
        )}
      </section>
    </div>
  );
}
