import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  Headphones,
  Home,
  LogOut,
  Menu,
  Mic2,
  Pencil,
  Play,
  RotateCcw,
  ScrollText,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  X,
  Zap
} from 'lucide-react';
import type { Category, DashboardData, Lesson, LessonSummary, QuickQuestion } from './types';

const categories: { id: Category | 'quiz'; label: string; icon: string; description: string }[] = [
  { id: 'reading', label: 'Book worm', icon: '📗', description: 'Read magical short stories' },
  { id: 'quiz', label: 'Pop up Quiz!', icon: '❓', description: 'Win XP with a quick question' },
  { id: 'grammar', label: 'Grammar', icon: '📜', description: 'Forge stronger sentences' },
  { id: 'listening', label: 'Listening', icon: '🎧', description: 'Follow spoken directions' },
  { id: 'speaking', label: 'Speaking', icon: '🎙️', description: 'Practise confident phrases' }
];

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

function formatTime(minutes: number) {
  if (minutes < 60) return `${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [lessonResult, setLessonResult] = useState<{ score: number; correct: number; total: number } | null>(null);
  const [quickQuiz, setQuickQuiz] = useState<QuickQuestion | null>(null);
  const [quickChoice, setQuickChoice] = useState<number | null>(null);
  const [quickResult, setQuickResult] = useState<{ correct: boolean; answer: number; explanation: string } | null>(null);
  const [profileEdit, setProfileEdit] = useState(false);
  const [name, setName] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);

  const loadDashboard = async () => {
    try {
      const dashboard = await request<DashboardData>('/api/dashboard');
      setData(dashboard);
      setName(dashboard.profile.name);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach the academy server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredLessons = useMemo(
    () => data?.lessons.filter((item) => item.category === selectedCategory) ?? [],
    [data, selectedCategory]
  );

  const closeModal = () => {
    setSelectedCategory(null);
    setLesson(null);
    setAnswers([]);
    setLessonResult(null);
    setQuickQuiz(null);
    setQuickChoice(null);
    setQuickResult(null);
    setProfileEdit(false);
  };

  const openCategory = async (id: Category | 'quiz') => {
    if (id === 'quiz') {
      try {
        setBusy(true);
        const question = await request<QuickQuestion>('/api/quick-quiz');
        setQuickQuiz(question);
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Could not summon a quiz.');
      } finally {
        setBusy(false);
      }
      return;
    }
    setSelectedCategory(id);
  };

  const openLesson = async (summary: LessonSummary) => {
    try {
      setBusy(true);
      const fullLesson = await request<Lesson>(`/api/lessons/${summary.id}`);
      setLesson(fullLesson);
      setAnswers(Array(fullLesson.questions.length).fill(-1));
      setLessonResult(null);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not open that lesson.');
    } finally {
      setBusy(false);
    }
  };

  const submitLesson = async () => {
    if (!lesson || answers.some((answer) => answer < 0)) {
      setToast('Choose an answer for every question first.');
      return;
    }
    try {
      setBusy(true);
      const result = await request<{ score: number; correct: number; total: number; firstCompletion: boolean; dashboard: DashboardData }>(`/api/lessons/${lesson.id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ answers })
      });
      setLessonResult(result);
      setData(result.dashboard);
      setToast(result.firstCompletion ? '+ Quest completed and XP earned!' : 'Practice saved to your activity log.');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not save the quest.');
    } finally {
      setBusy(false);
    }
  };

  const submitQuickQuiz = async () => {
    if (!quickQuiz || quickChoice === null) return;
    try {
      setBusy(true);
      const result = await request<{ correct: boolean; answer: number; explanation: string; dashboard: DashboardData }>('/api/quick-quiz/submit', {
        method: 'POST',
        body: JSON.stringify({ questionId: quickQuiz.id, answer: quickChoice })
      });
      setQuickResult(result);
      setData(result.dashboard);
      setToast(result.correct ? 'Critical hit! +20 XP' : 'Knowledge gained — try another!');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not submit the quiz.');
    } finally {
      setBusy(false);
    }
  };

  const nextQuickQuiz = async () => {
    setQuickChoice(null);
    setQuickResult(null);
    setBusy(true);
    try {
      setQuickQuiz(await request<QuickQuestion>('/api/quick-quiz'));
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async () => {
    try {
      setBusy(true);
      const dashboard = await request<DashboardData>('/api/profile', { method: 'PUT', body: JSON.stringify({ name }) });
      setData(dashboard);
      setProfileEdit(false);
      setProfileOpen(false);
      setToast('Profile updated!');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not update the profile.');
    } finally {
      setBusy(false);
    }
  };

  const resetProgress = async () => {
    if (!window.confirm('Reset all lesson progress, XP, achievements, and activity?')) return;
    try {
      setBusy(true);
      const dashboard = await request<DashboardData>('/api/reset', { method: 'POST' });
      setData(dashboard);
      setName(dashboard.profile.name);
      setProfileOpen(false);
      setToast('A fresh adventure begins.');
    } finally {
      setBusy(false);
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.82;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  if (loading) {
    return (
      <main className="loading-screen">
        <div className="loading-rune">✦</div>
        <p>Opening the academy gates...</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="loading-screen">
        <h1>The gates are sealed</h1>
        <p>{error}</p>
        <button className="primary-button" onClick={loadDashboard}>Try again</button>
      </main>
    );
  }

  const xpInLevel = data.profile.xp % 250;

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-button menu-button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <Menu size={27} />
        </button>
        <button className="brand" onClick={() => scrollTo('dashboard')} aria-label="AFK Academy home">
          <span className="brand-mark">A</span><span>AFK</span><i>Academy</i>
        </button>
        <div className="topbar-spacer" />
        <div className="level-chip"><Sparkles size={14} /> LVL {data.profile.level}</div>
        <button className="profile-trigger" onClick={() => setProfileOpen((value) => !value)}>
          <span className="mini-avatar" aria-hidden>🧙</span>
          <span>{data.profile.name}</span>
          <ChevronDown size={17} />
        </button>
        {profileOpen && (
          <div className="profile-menu panel">
            <div className="profile-summary">
              <span className="profile-avatar">🧙</span>
              <div><strong>{data.profile.name}</strong><small>Level {data.profile.level} Explorer</small></div>
            </div>
            <div className="xp-label"><span>{xpInLevel} / 250 XP</span><span>Next level</span></div>
            <div className="mini-progress"><i style={{ width: `${(xpInLevel / 250) * 100}%` }} /></div>
            <button onClick={() => { setProfileEdit(true); setProfileOpen(false); }}><Pencil size={16} /> Edit name</button>
            <button className="danger-link" onClick={resetProgress}><RotateCcw size={16} /> Reset progress</button>
          </div>
        )}
      </header>

      <aside className={`side-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="drawer-head"><span className="brand"><span className="brand-mark">A</span><span>AFK</span></span><button className="icon-button" onClick={() => setMenuOpen(false)}><X /></button></div>
        <nav>
          <button onClick={() => scrollTo('dashboard')}><Home /> Dashboard</button>
          <button onClick={() => scrollTo('categories')}><BookOpen /> Lessons</button>
          <button onClick={() => scrollTo('achievements')}><Trophy /> Achievements</button>
          <button onClick={() => scrollTo('activity')}><ScrollText /> Activity</button>
        </nav>
        <div className="drawer-tip"><span>🔥</span><strong>Keep your flame alive</strong><small>Complete one quest today.</small></div>
        <button className="drawer-close" onClick={() => setMenuOpen(false)}><LogOut /> Close menu</button>
      </aside>
      {menuOpen && <button className="scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <main id="dashboard" className="dashboard">
        <section className="welcome-card panel">
          <div>
            <span className="overline"><Sparkles size={15} /> Your learning adventure</span>
            <h1>Welcome back, <em>{data.profile.name}!</em> <span className="wave">👋</span></h1>
            <p>Improve your English reading skills through interactive lessons and activities.</p>
            <button className="primary-button" onClick={() => scrollTo('categories')}><Play size={17} fill="currentColor" /> Continue adventure</button>
          </div>
          <div className="hero-character" aria-label="Pixel wizard reading a book">
            <span className="magic-star one">✦</span><span className="magic-star two">✧</span>
            <div className="character-head">🧙</div>
            <div className="book">📖</div>
            <div className="character-shadow" />
          </div>
        </section>

        <section className="progress-card panel">
          <div className="section-title-row">
            <div className="section-title"><span className="title-icon sword">🗡️</span><div><small>Current quest</small><h2>Your Progress</h2></div></div>
            <strong className="progress-percent">{data.stats.progress}%</strong>
          </div>
          <div className="progress-track" aria-label={`${data.stats.progress}% completed`}>
            <div className="progress-fill" style={{ width: `${data.stats.progress}%` }}><i /></div>
          </div>
          <div className="progress-caption"><span>{data.stats.completed} of {data.stats.total} quests completed</span><span>{Math.max(0, data.stats.total - data.stats.completed)} remaining</span></div>
        </section>

        <section className="stats-grid" aria-label="Learning stats">
          <article className="stat-card panel"><div className="stat-icon blue"><BookOpen /></div><div><span>Lessons</span><strong>{data.stats.completed}</strong><small>completed</small></div></article>
          <article className="stat-card panel"><div className="stat-icon gold"><Clock3 /></div><div><span>Reading Time</span><strong>{formatTime(data.stats.readingMinutes)}</strong><small>total focus</small></div></article>
          <article className="stat-card panel"><div className="stat-icon amber"><Trophy /></div><div><span>Achievements</span><strong>{data.stats.achievements}</strong><small>of {data.achievements.length} badges</small></div></article>
        </section>

        <section id="categories" className="categories-card panel section-anchor">
          <div className="section-title-row">
            <div className="section-title"><Star className="yellow" fill="currentColor" /><div><small>Choose your path</small><h2>Learning Categories</h2></div></div>
            <span className="section-hint">Every quest earns XP</span>
          </div>
          <div className="category-grid">
            {categories.map((category) => {
              const completed = category.id === 'quiz'
                ? data.stats.quickQuizWins
                : data.lessons.filter((item) => item.category === category.id && item.completed).length;
              const total = category.id === 'quiz' ? null : data.lessons.filter((item) => item.category === category.id).length;
              return (
                <button data-testid={`category-${category.id}`} className={`category-button category-${category.id}`} onClick={() => openCategory(category.id)} key={category.id} disabled={busy}>
                  <span className="category-icon">{category.icon}</span>
                  <span><strong>{category.label}</strong><small>{category.description}</small></span>
                  <i>{total ? `${completed}/${total}` : `${completed} wins`}</i>
                </button>
              );
            })}
          </div>
        </section>

        <section id="achievements" className="achievements-card panel section-anchor">
          <div className="section-title-row">
            <div className="section-title"><Award className="yellow" /><div><small>Treasure shelf</small><h2>Achievements</h2></div></div>
            <span className="section-hint">{data.stats.achievements}/{data.achievements.length} unlocked</span>
          </div>
          <div className="achievement-grid">
            {data.achievements.map((achievement) => (
              <article className={achievement.unlocked ? 'achievement unlocked' : 'achievement locked'} key={achievement.id}>
                <span>{achievement.unlocked ? achievement.icon : '🔒'}</span>
                <div><strong>{achievement.title}</strong><small>{achievement.description}</small></div>
                {achievement.unlocked && <Check size={16} />}
              </article>
            ))}
          </div>
        </section>

        <section id="activity" className="activity-card panel section-anchor">
          <div className="section-title-row">
            <div className="section-title"><ScrollText className="parchment" /><div><small>Quest journal</small><h2>Recent Activity</h2></div></div>
            {data.activities.length > 0 && <span className="live-dot"><i /> Live</span>}
          </div>
          {data.activities.length === 0 ? (
            <div className="empty-activity"><div><span className="bullet">•</span><p><strong>No activity yet.</strong><small>Choose a learning path to begin your story.</small></p></div><div className="slime"><i>••</i><span>💬</span></div></div>
          ) : (
            <div className="activity-list">
              {data.activities.map((activity) => (
                <article key={activity.id}><span className="activity-icon">{activity.icon}</span><div><strong>{activity.title}</strong><small>{activity.detail}</small></div><time>{new Date(activity.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time></article>
              ))}
            </div>
          )}
        </section>
        <footer><span>✦</span> AFK Academy · Learn a little. Adventure a lot. <span>✦</span></footer>
      </main>

      {(selectedCategory || lesson) && (
        <div className="modal-layer" role="dialog" aria-modal="true">
          <button className="modal-scrim" onClick={closeModal} aria-label="Close dialog" />
          <section className="quest-modal panel">
            <button className="modal-close icon-button" onClick={closeModal}><X /></button>
            {!lesson ? (
              <>
                <div className="modal-heading"><span>{categories.find((item) => item.id === selectedCategory)?.icon}</span><div><small>Quest board</small><h2>{categories.find((item) => item.id === selectedCategory)?.label}</h2><p>{categories.find((item) => item.id === selectedCategory)?.description}</p></div></div>
                <div className="lesson-list">
                  {filteredLessons.map((item) => (
                    <button data-testid={`lesson-${item.id}`} key={item.id} onClick={() => openLesson(item)}>
                      <span className="lesson-icon">{item.icon}</span>
                      <div><strong>{item.title}</strong><small>{item.difficulty} · {item.minutes} min</small></div>
                      {item.completed ? <span className="complete-badge"><Check /> Complete</span> : <span className="start-badge">Start <Play fill="currentColor" /></span>}
                    </button>
                  ))}
                </div>
              </>
            ) : lessonResult ? (
              <div className="result-screen">
                <div className="result-burst">{lessonResult.score >= 75 ? '🏆' : '🧠'}</div>
                <span className="overline">Quest complete</span>
                <h2>{lessonResult.score}% Score</h2>
                <p>You answered {lessonResult.correct} of {lessonResult.total} questions correctly.</p>
                <div className="result-actions"><button className="secondary-button" onClick={() => { setLessonResult(null); setAnswers(Array(lesson.questions.length).fill(-1)); }}>Try again</button><button className="primary-button" onClick={closeModal}>Back to dashboard</button></div>
              </div>
            ) : (
              <div className="lesson-content">
                <button className="back-link" onClick={() => setLesson(null)}>← Back to quests</button>
                <div className="modal-heading compact"><span>{lesson.icon}</span><div><small>{lesson.eyebrow} · {lesson.minutes} min</small><h2>{lesson.title}</h2></div></div>
                {lesson.audioText && <button className="listen-button" onClick={() => speakText(lesson.audioText!)}><Volume2 /> Play listening passage</button>}
                {lesson.speakPhrase && <button className="listen-button speaking" onClick={() => speakText(lesson.speakPhrase!)}><Mic2 /> Hear the speaking phrase</button>}
                <div className="passage"><span className="dropcap">{lesson.passage[0]}</span>{lesson.passage.slice(1)}</div>
                <div className="questions">
                  {lesson.questions.map((question, questionIndex) => (
                    <fieldset key={question.prompt}>
                      <legend><span>{questionIndex + 1}</span>{question.prompt}</legend>
                      {question.choices.map((choice, choiceIndex) => (
                        <label className={answers[questionIndex] === choiceIndex ? 'selected' : ''} key={choice}>
                          <input type="radio" name={`question-${questionIndex}`} checked={answers[questionIndex] === choiceIndex} onChange={() => setAnswers((current) => current.map((answer, index) => index === questionIndex ? choiceIndex : answer))} />
                          <i>{String.fromCharCode(65 + choiceIndex)}</i>{choice}
                        </label>
                      ))}
                    </fieldset>
                  ))}
                </div>
                <button className="primary-button submit-quest" onClick={submitLesson} disabled={busy}>{busy ? 'Saving quest...' : 'Complete quest'} <Zap fill="currentColor" /></button>
              </div>
            )}
          </section>
        </div>
      )}

      {quickQuiz && (
        <div className="modal-layer" role="dialog" aria-modal="true">
          <button className="modal-scrim" onClick={closeModal} aria-label="Close quiz" />
          <section className="quick-modal panel">
            <button className="modal-close icon-button" onClick={closeModal}><X /></button>
            <div className="quiz-orb">?</div>
            <span className="overline">Pop-up challenge · +20 XP</span>
            <h2>{quickQuiz.prompt}</h2>
            <div className="quick-choices">
              {quickQuiz.choices.map((choice, index) => {
                const state = quickResult ? index === quickResult.answer ? 'correct' : index === quickChoice ? 'wrong' : '' : quickChoice === index ? 'selected' : '';
                return <button data-testid={`quick-choice-${index}`} className={state} onClick={() => !quickResult && setQuickChoice(index)} key={choice}><i>{String.fromCharCode(65 + index)}</i><span>{choice}</span>{state === 'correct' && <Check />}{state === 'wrong' && <X />}</button>;
              })}
            </div>
            {quickResult ? (
              <div className={`quiz-feedback ${quickResult.correct ? 'success' : ''}`}><strong>{quickResult.correct ? 'Critical hit!' : 'Almost!'}</strong><p>{quickResult.explanation}</p><button className="primary-button" onClick={nextQuickQuiz}>Next challenge <Zap /></button></div>
            ) : <button className="primary-button quiz-submit" disabled={quickChoice === null || busy} onClick={submitQuickQuiz}>{busy ? 'Checking...' : 'Lock in answer'}</button>}
          </section>
        </div>
      )}

      {profileEdit && (
        <div className="modal-layer" role="dialog" aria-modal="true">
          <button className="modal-scrim" onClick={closeModal} aria-label="Close profile" />
          <section className="profile-modal panel">
            <button className="modal-close icon-button" onClick={closeModal}><X /></button>
            <span className="profile-avatar large">🧙</span><span className="overline">Adventurer profile</span><h2>What should we call you?</h2>
            <label>Display name<input value={name} maxLength={18} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && saveProfile()} autoFocus /></label>
            <button className="primary-button" onClick={saveProfile} disabled={busy}>{busy ? 'Saving...' : 'Save profile'}</button>
          </section>
        </div>
      )}

      {toast && <div className="toast"><Sparkles />{toast}</div>}
    </div>
  );
}

export default App;
