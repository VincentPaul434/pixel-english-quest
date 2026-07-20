import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Lesson, LessonResult, QuickQuestion, VocabularyItem } from '../../academy/models/types';
import {
  addVocabulary,
  completeLesson,
  deleteVocabulary,
  getLesson,
  getQuickQuiz,
  saveLessonCheckpoint,
  saveLessonStudy,
  submitQuickQuiz,
  submitSpeakingAttempt,
  updateProfile
} from '../models/api';
import type {
  LessonDialogProps,
  LessonDialogViewModel,
  OnboardingProps,
  OnboardingViewModel,
  ProfileEditorProps,
  ProfileEditorViewModel,
  QuickQuizDialogProps,
  QuickQuizDialogViewModel,
  RecognitionInstance,
  VocabularyPanelProps,
  VocabularyPanelViewModel
} from '../models/types';

export function useProfileEditorViewModel({ profile, onClose, onSaved }: ProfileEditorProps): ProfileEditorViewModel {
  const [name, setName] = useState(profile.name);
  const [proficiency, setProficiency] = useState(profile.proficiency);
  const [learningGoal, setLearningGoal] = useState(profile.learningGoal);
  const [dailyGoal, setDailyGoal] = useState(profile.dailyGoal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      onSaved(await updateProfile({ name, proficiency, learningGoal, dailyGoal }));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.');
    } finally {
      setBusy(false);
    }
  };

  return { name, proficiency, learningGoal, dailyGoal, busy, error, setName, setProficiency, setLearningGoal, setDailyGoal, save };
}

export function useOnboardingViewModel({ profile, onComplete }: OnboardingProps): OnboardingViewModel {
  const [proficiency, setProficiency] = useState('Beginner');
  const [learningGoal, setLearningGoal] = useState('Speak and understand everyday English');
  const [dailyGoal, setDailyGoal] = useState(15);
  const [busy, setBusy] = useState(false);

  const submit = () => {
    setBusy(true);
    void updateProfile({ name: profile.name, proficiency, learningGoal, dailyGoal })
      .then(onComplete)
      .finally(() => setBusy(false));
  };

  return { proficiency, learningGoal, dailyGoal, busy, setProficiency, setLearningGoal, setDailyGoal, submit };
}

export function useLessonDialogViewModel({ summary, onClose, onDashboard, notify }: LessonDialogProps): LessonDialogViewModel {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [answers, setAnswers] = useState<Array<number | string>>([]);
  const [result, setResult] = useState<LessonResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [speechBusy, setSpeechBusy] = useState(false);
  const [speechResult, setSpeechResult] = useState<{ transcript: string; accuracy: number; feedback: string } | null>(null);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    let mounted = true;
    getLesson(summary.id).then((loaded) => {
      if (!mounted) return;
      setLesson(loaded);
      const drafts = loaded.progress?.draftAnswers || [];
      setAnswers(loaded.questions.map((question, index) => drafts[index] ?? (question.type === 'fill_blank' ? '' : -1)));
      setNotes(loaded.progress?.notes || '');
      setBookmarked(Boolean(loaded.progress?.bookmarked));
      window.setTimeout(() => document.querySelector(`[data-question-index="${loaded.progress?.lastQuestion || 0}"]`)?.scrollIntoView({ block: 'center' }), 150);
    }).catch((err) => {
      notify(err instanceof Error ? err.message : 'Could not open the lesson.');
      onClose();
    });
    return () => { mounted = false; window.speechSynthesis.cancel(); };
  }, [summary.id, notify, onClose]);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.82;
    utterance.pitch = 1.03;
    window.speechSynthesis.speak(utterance);
  };

  const choose = (questionIndex: number, value: number | string) => {
    setAnswers((current) => {
      const next = current.map((answer, index) => index === questionIndex ? value : answer);
      void saveLessonCheckpoint(summary.id, { lastQuestion: questionIndex, draftAnswers: next }).catch(() => undefined);
      return next;
    });
  };

  const saveStudy = () => {
    void saveLessonStudy(summary.id, { notes, bookmarked })
      .then(() => notify('Study notes saved.'))
      .catch((err) => notify(err instanceof Error ? err.message : 'Could not save notes.'));
  };

  const submit = () => {
    if (!lesson) return;
    const incomplete = lesson.questions.some((question, index) => question.type === 'fill_blank' ? !String(answers[index] || '').trim() : Number(answers[index]) < 0);
    if (incomplete) return notify('Answer every question before submitting.');
    setBusy(true);
    void completeLesson(lesson.id, { answers, durationSeconds: Math.round((Date.now() - startedAt.current) / 1000) })
      .then((completed) => {
        setResult(completed);
        onDashboard(completed.dashboard);
        notify(completed.firstCompletion ? `Quest mastered! +${lesson.xpReward} XP` : completed.passed ? 'Practice attempt saved.' : 'Review the feedback and try again.');
      })
      .catch((err) => notify(err instanceof Error ? err.message : 'Could not submit the lesson.'))
      .finally(() => setBusy(false));
  };

  const practiseSpeaking = () => {
    if (!lesson?.speakPhrase) return;
    const browser = window as unknown as { SpeechRecognition?: new () => RecognitionInstance; webkitSpeechRecognition?: new () => RecognitionInstance };
    const Recognition = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Recognition) return notify('Speech recognition is not available in this browser. Try Chrome or Edge.');
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      void submitSpeakingAttempt(lesson.id, transcript).then(setSpeechResult).catch((err) => notify(err instanceof Error ? err.message : 'Could not score the phrase.'));
    };
    recognition.onerror = () => notify('The microphone could not hear a clear phrase.');
    recognition.onend = () => setSpeechBusy(false);
    setSpeechBusy(true);
    recognition.start();
  };

  const restart = () => {
    if (!lesson) return;
    setResult(null);
    setAnswers(lesson.questions.map((question) => question.type === 'fill_blank' ? '' : -1));
    startedAt.current = Date.now();
  };

  return { lesson, answers, result, busy, notes, bookmarked, speechBusy, speechResult, setResult, setAnswers, setNotes, setBookmarked, speak, choose, saveStudy, submit, practiseSpeaking, restart };
}

export function useQuickQuizDialogViewModel({ onClose, onDashboard, notify }: QuickQuizDialogProps): QuickQuizDialogViewModel {
  const [question, setQuestion] = useState<QuickQuestion | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const [result, setResult] = useState<QuickQuizDialogViewModel['result']>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setChoice(null);
    setResult(null);
    setBusy(true);
    void getQuickQuiz()
      .then(setQuestion)
      .catch((err) => {
        notify(err instanceof Error ? err.message : 'Could not load a quiz.');
        onClose();
      })
      .finally(() => setBusy(false));
  };

  useEffect(() => { load(); }, []);

  const submit = () => {
    if (!question || choice === null) return;
    setBusy(true);
    void submitQuickQuiz(question.id, choice)
      .then((completed) => {
        setResult(completed);
        onDashboard(completed.dashboard);
        notify(completed.xpAwarded ? `Critical hit! +${completed.xpAwarded} XP` : completed.correct ? 'Correct! Daily XP already claimed.' : 'Knowledge gained-keep going.');
      })
      .catch((err) => notify(err instanceof Error ? err.message : 'Could not submit the quiz.'))
      .finally(() => setBusy(false));
  };

  return { question, choice, result, busy, setChoice, load, submit };
}

export function useVocabularyPanelViewModel({ items, onChanged, notify }: VocabularyPanelProps): VocabularyPanelViewModel {
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');

  const add = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const item = await addVocabulary({ term, definition });
      onChanged([item, ...items]);
      setTerm('');
      setDefinition('');
      notify('Word added to your study deck.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not add the word.');
    }
  };

  const remove = (id: string) => {
    void deleteVocabulary(id).then(() => onChanged(items.filter((item: VocabularyItem) => item.id !== id)));
  };

  return { term, definition, setTerm, setDefinition, add, remove };
}
