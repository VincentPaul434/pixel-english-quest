import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  useAddVocabularyMutation, useCheckpointMutation, useCompleteLessonMutation, useDeleteVocabularyMutation,
  useSaveStudyMutation, useSpeakingAttemptMutation, useSubmitQuickQuizMutation, useUpdateProfileMutation
} from '../../../hooks/mutations/studentMutations';
import { useLessonQuery, useQuickQuizQuery } from '../../../hooks/queries/studentQueries';
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

export function useProfileEditorViewModel({ profile, onClose }: ProfileEditorProps): ProfileEditorViewModel {
  const [name, setName] = useState(profile.name);
  const [proficiency, setProficiency] = useState(profile.proficiency);
  const [learningGoal, setLearningGoal] = useState(profile.learningGoal);
  const [dailyGoal, setDailyGoal] = useState(profile.dailyGoal);
  const updateProfileMutation = useUpdateProfileMutation();
  const busy = updateProfileMutation.isPending;
  const error = updateProfileMutation.error instanceof Error ? updateProfileMutation.error.message : '';

  const save = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await updateProfileMutation.mutateAsync({ name, proficiency, learningGoal, dailyGoal });
      onClose();
    } catch { /* The mutation error is exposed to the form above. */ }
  };

  return { name, proficiency, learningGoal, dailyGoal, busy, error, setName, setProficiency, setLearningGoal, setDailyGoal, save };
}

export function useOnboardingViewModel({ profile }: OnboardingProps): OnboardingViewModel {
  const [proficiency, setProficiency] = useState('Beginner');
  const [learningGoal, setLearningGoal] = useState('Speak and understand everyday English');
  const [dailyGoal, setDailyGoal] = useState(15);
  const updateProfileMutation = useUpdateProfileMutation();
  const busy = updateProfileMutation.isPending;

  const submit = () => {
    void updateProfileMutation.mutateAsync({ name: profile.name, proficiency, learningGoal, dailyGoal }).catch(() => undefined);
  };

  return { proficiency, learningGoal, dailyGoal, busy, setProficiency, setLearningGoal, setDailyGoal, submit };
}

export function useLessonDialogViewModel({ summary, onClose, notify }: LessonDialogProps): LessonDialogViewModel {
  const lessonQuery = useLessonQuery(summary.id);
  const checkpointMutation = useCheckpointMutation(summary.id);
  const studyMutation = useSaveStudyMutation(summary.id);
  const completeMutation = useCompleteLessonMutation(summary.id);
  const speakingMutation = useSpeakingAttemptMutation(summary.id);
  const lesson = lessonQuery.data ?? null;
  const [answers, setAnswers] = useState<Array<number | string | number[]>>([]);
  const result = completeMutation.data ?? null;
  const busy = completeMutation.isPending;
  const [notes, setNotes] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [speechBusy, setSpeechBusy] = useState(false);
  const speechResult = speakingMutation.data ?? null;
  const startedAt = useRef(Date.now());
  const initializedLessonId = useRef('');

  useEffect(() => {
    const loaded = lessonQuery.data;
    if (loaded && initializedLessonId.current !== loaded.id) {
      initializedLessonId.current = loaded.id;
      const drafts = loaded.progress?.draftAnswers || [];
      setAnswers(loaded.questions.map((question, index) => drafts[index] ?? (['fill_blank', 'essay'].includes(question.type) ? '' : ['matching', 'ordering'].includes(question.type) ? [] : -1)));
      setNotes(loaded.progress?.notes || '');
      setBookmarked(Boolean(loaded.progress?.bookmarked));
      window.setTimeout(() => document.querySelector(`[data-question-index="${loaded.progress?.lastQuestion || 0}"]`)?.scrollIntoView({ block: 'center' }), 150);
    }
    if (lessonQuery.error) {
      notify(lessonQuery.error instanceof Error ? lessonQuery.error.message : 'Could not open the lesson.');
      onClose();
    }
    return () => { window.speechSynthesis.cancel(); };
  }, [lessonQuery.data, lessonQuery.error, notify, onClose]);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.82;
    utterance.pitch = 1.03;
    window.speechSynthesis.speak(utterance);
  };

  const choose = (questionIndex: number, value: number | string | number[]) => {
    setAnswers((current) => {
      const next = current.map((answer, index) => index === questionIndex ? value : answer);
      checkpointMutation.mutate({ lastQuestion: questionIndex, draftAnswers: next });
      return next;
    });
  };

  const saveStudy = () => {
    void studyMutation.mutateAsync({ notes, bookmarked })
      .then(() => notify('Study notes saved.'))
      .catch((err) => notify(err instanceof Error ? err.message : 'Could not save notes.'));
  };

  const submit = () => {
    if (!lesson) return;
    const incomplete = lesson.questions.some((question, index) => ['fill_blank', 'essay'].includes(question.type)
      ? !String(answers[index] || '').trim()
      : ['matching', 'ordering'].includes(question.type) ? !Array.isArray(answers[index]) || (answers[index] as number[]).length !== question.choices.length
        : Number(answers[index]) < 0);
    if (incomplete) return notify('Answer every question before submitting.');
    void completeMutation.mutateAsync({ answers, durationSeconds: Math.round((Date.now() - startedAt.current) / 1000) })
      .then((completed) => {
        notify(completed.firstCompletion ? `Quest mastered! +${lesson.xpReward} XP` : completed.passed ? 'Practice attempt saved.' : 'Review the feedback and try again.');
      })
      .catch((err) => notify(err instanceof Error ? err.message : 'Could not submit the lesson.'));
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
      void speakingMutation.mutateAsync(transcript).catch((err) => notify(err instanceof Error ? err.message : 'Could not score the phrase.'));
    };
    recognition.onerror = () => notify('The microphone could not hear a clear phrase.');
    recognition.onend = () => setSpeechBusy(false);
    setSpeechBusy(true);
    recognition.start();
  };

  const restart = () => {
    if (!lesson) return;
    completeMutation.reset();
    setAnswers(lesson.questions.map((question) => ['fill_blank', 'essay'].includes(question.type) ? '' : ['matching', 'ordering'].includes(question.type) ? [] : -1));
    startedAt.current = Date.now();
  };

  return { lesson, answers, result, busy, notes, bookmarked, speechBusy, speechResult, setAnswers, setNotes, setBookmarked, speak, choose, saveStudy, submit, practiseSpeaking, restart };
}

export function useQuickQuizDialogViewModel({ onClose, notify }: QuickQuizDialogProps): QuickQuizDialogViewModel {
  const quizQuery = useQuickQuizQuery();
  const submitQuizMutation = useSubmitQuickQuizMutation();
  const question = quizQuery.data ?? null;
  const [choice, setChoice] = useState<number | null>(null);
  const result = submitQuizMutation.data ?? null;
  const busy = quizQuery.isFetching || submitQuizMutation.isPending;

  const load = () => {
    setChoice(null);
    submitQuizMutation.reset();
    void quizQuery.refetch();
  };

  useEffect(() => {
    if (!quizQuery.error) return;
    notify(quizQuery.error instanceof Error ? quizQuery.error.message : 'Could not load a quiz.');
    onClose();
  }, [quizQuery.error, notify, onClose]);

  const submit = () => {
    if (!question || choice === null) return;
    void submitQuizMutation.mutateAsync({ questionId: question.id, answer: choice })
      .then((completed) => {
        notify(completed.xpAwarded ? `Critical hit! +${completed.xpAwarded} XP` : completed.correct ? 'Correct! Daily XP already claimed.' : 'Knowledge gained-keep going.');
      })
      .catch((err) => notify(err instanceof Error ? err.message : 'Could not submit the quiz.'));
  };

  return { question, choice, result, busy, setChoice, load, submit };
}

export function useVocabularyPanelViewModel({ notify }: VocabularyPanelProps): VocabularyPanelViewModel {
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const addMutation = useAddVocabularyMutation();
  const deleteMutation = useDeleteVocabularyMutation();

  const add = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await addMutation.mutateAsync({ term, definition });
      setTerm('');
      setDefinition('');
      notify('Word added to your study deck.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not add the word.');
    }
  };

  const remove = (id: string) => {
    void deleteMutation.mutateAsync(id).catch((err) => notify(err instanceof Error ? err.message : 'Could not remove the word.'));
  };

  return { term, definition, setTerm, setDefinition, add, remove };
}
