import { ModalFrame } from '../../../shared-components/ModalFrame';
import { PixelIcon, type PixelIconName } from '../../../shared-components/PixelIcon';
import pixelWizard from '../../../assets/pixel-wizard.png';
import { categoryDetails } from '../student-constants';
import { dueLabel, formatMinutes, iconForActivity } from '../student-formatters';
import type {
  Category,
  LessonSummary,
  StudentDashboardData,
  User,
  VocabularyItem
} from '../../academy/models/types';
import type { LessonDialogProps, OnboardingProps, ProfileEditorProps, QuickQuizDialogProps, StudentWorkspaceViewProps, VocabularyPanelProps } from '../models/types';
import { useLessonDialogViewModel, useOnboardingViewModel, useProfileEditorViewModel, useQuickQuizDialogViewModel, useVocabularyPanelViewModel } from '../viewModels/useStudentPanelsViewModel';
import { useStudentWorkspaceViewModel } from '../viewModels/useStudentWorkspaceViewModel';
import { StudentLearningHub } from '../../platform';

function ProfileEditor(props: ProfileEditorProps) {
  const { profile, onClose } = props;
  const { busy, dailyGoal, error, learningGoal, name, proficiency, save, setDailyGoal, setLearningGoal, setName, setProficiency } = useProfileEditorViewModel(props);

  return (
    <ModalFrame onClose={onClose} label="learning profile">
      <form className="settings-form" onSubmit={save}>
        <span className="profile-avatar large"><img src={pixelWizard} alt="" /></span>
        <span className="overline">Learner settings</span>
        <h2>Shape your adventure</h2>
        <div className="form-grid two-columns">
          <label>Display name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} required /></label>
          <label>Current level<select value={proficiency} onChange={(event) => setProficiency(event.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
          <label className="span-two">Learning goal<textarea value={learningGoal} onChange={(event) => setLearningGoal(event.target.value)} maxLength={300} rows={3} /></label>
          <label>Daily goal<select value={dailyGoal} onChange={(event) => setDailyGoal(Number(event.target.value))}><option value={5}>5 minutes</option><option value={10}>10 minutes</option><option value={15}>15 minutes</option><option value={20}>20 minutes</option><option value={30}>30 minutes</option><option value={45}>45 minutes</option></select></label>
        </div>
        {error && <div className="form-error">{error}</div>}
        <button className="primary-button" disabled={busy}>{busy ? 'Saving...' : 'Save learning profile'}</button>
      </form>
    </ModalFrame>
  );
}

function Onboarding(props: OnboardingProps) {
  const { profile } = props;
  const { busy, dailyGoal, learningGoal, proficiency, setDailyGoal, setLearningGoal, setProficiency, submit } = useOnboardingViewModel(props);
  return (
    <main className="onboarding-screen">
      <section className="onboarding-card panel">
        <span className="onboarding-rune"><PixelIcon name="magic" size={52} /></span>
        <span className="overline">Welcome, {profile.name}</span>
        <h1>Build your learning path</h1>
        <p>These choices help the academy recommend the right quest and pace.</p>
        <div className="onboarding-steps">
          <fieldset><legend>1. Where are you starting?</legend><div className="choice-cards">{['Beginner', 'Intermediate', 'Advanced'].map((value) => <button type="button" className={proficiency === value ? 'active' : ''} onClick={() => setProficiency(value)} key={value}>{value}</button>)}</div></fieldset>
          <fieldset><legend>2. What is your main goal?</legend><div className="choice-cards goals">{['Speak and understand everyday English', 'Improve reading and vocabulary', 'Strengthen grammar for school or work'].map((value) => <button type="button" className={learningGoal === value ? 'active' : ''} onClick={() => setLearningGoal(value)} key={value}>{value}</button>)}</div></fieldset>
          <fieldset><legend>3. Choose a daily target</legend><div className="choice-cards">{[5, 10, 15, 20, 30].map((value) => <button type="button" className={dailyGoal === value ? 'active' : ''} onClick={() => setDailyGoal(value)} key={value}>{value} min</button>)}</div></fieldset>
        </div>
        <button className="primary-button" onClick={submit} disabled={busy}>{busy ? 'Creating your path...' : 'Enter the academy'} <PixelIcon name="play" /></button>
      </section>
    </main>
  );
}

function LessonDialog(props: LessonDialogProps) {
  const { summary, onClose } = props;
  const { answers, bookmarked, busy, choose, lesson, notes, practiseSpeaking, result, restart, saveStudy, setBookmarked, setNotes, speak, speechBusy, speechResult, submit } = useLessonDialogViewModel(props);

  return (
    <ModalFrame onClose={onClose} label={summary.title} wide>
      {!lesson ? <div className="modal-loading"><PixelIcon name="sparkle" size={46} /><p>Opening quest...</p></div> : result ? (
        <div className="result-screen">
          <div className={`result-burst ${result.passed ? '' : 'needs-review'}`}><PixelIcon name={result.passed ? 'trophy' : 'brain'} size={82} /></div>
          <span className="overline">{result.passed ? 'Quest mastered' : 'Training attempt'}</span>
          <h2>{result.score}% Score</h2>
          <p>You answered {result.correct} of {result.total} questions correctly. {result.passed ? 'Your mastery record is saved.' : `Reach ${result.masteryScore}% to complete this quest.`}</p>
          <div className="answer-review">
            {result.review.map((item) => (
              <article className={item.correct ? 'correct' : 'incorrect'} key={item.prompt}>
                <span><PixelIcon name={item.correct ? 'check' : 'close'} size={16} /></span>
                <div><strong>{item.prompt}</strong><small>Your answer: {['fill_blank', 'essay', 'matching', 'ordering'].includes(item.type) ? String(item.selected) : lesson.questions.find((q) => q.prompt === item.prompt)?.choices[Number(item.selected)]}</small>{!item.correct && <small className="correct-answer">Correct answer: {['fill_blank', 'essay', 'matching', 'ordering'].includes(item.type) ? String(item.answer) : lesson.questions.find((q) => q.prompt === item.prompt)?.choices[Number(item.answer)]}</small>}<small>{item.explanation}</small></div>
              </article>
            ))}
          </div>
          <div className="result-actions"><button className="secondary-button" onClick={restart}>Practise again</button><button className="primary-button" onClick={onClose}>Back to dashboard</button></div>
        </div>
      ) : (
        <div className="lesson-content expanded-lesson">
          <div className="modal-heading compact"><span><PixelIcon name={categoryDetails[lesson.category].icon} /></span><div><small>{lesson.courseTitle} · {lesson.moduleTitle || lesson.eyebrow} · {lesson.minutes} min</small><h2>{lesson.title}</h2><p>{lesson.difficulty} · Mastery at {lesson.masteryScore}% · {lesson.xpReward} XP</p></div></div>
          {lesson.objectives.length > 0 && <div className="objective-list"><strong>By the end of this quest</strong>{lesson.objectives.map((objective) => <span key={objective}><PixelIcon name="check" size={14} /> {objective}</span>)}</div>}
          <div className="lesson-tools">
            {(lesson.audioUrl || lesson.audioText) && <button onClick={() => lesson.audioText && speak(lesson.audioText)}><PixelIcon name="headphones" /> {lesson.audioUrl ? 'Audio below' : 'Play listening script'}</button>}
            {lesson.speakPhrase && <button onClick={() => speak(lesson.speakPhrase!)}><PixelIcon name="mic" /> Hear speaking phrase</button>}
            {lesson.resourceUrl && <a href={lesson.resourceUrl} target="_blank" rel="noreferrer"><PixelIcon name="scroll" /> Open resource</a>}
            <button className={bookmarked ? 'active' : ''} onClick={() => setBookmarked((value) => !value)}><PixelIcon name={bookmarked ? 'star' : 'book'} /> {bookmarked ? 'Bookmarked' : 'Bookmark'}</button>
          </div>
          {lesson.audioUrl && <audio className="lesson-audio" controls src={lesson.audioUrl}>Your browser cannot play this audio.</audio>}
          {lesson.videoUrl && <div className="lesson-video"><a href={lesson.videoUrl} target="_blank" rel="noreferrer"><PixelIcon name="play" size={28} /> Open lesson video</a></div>}
          <div className="passage"><span className="dropcap">{lesson.passage[0]}</span>{lesson.passage.slice(1)}</div>
          {lesson.speakPhrase && (
            <section className="speaking-lab">
              <span><PixelIcon name="mic" size={30} /></span><div><strong>Pronunciation lab</strong><p>Say: “{lesson.speakPhrase}”</p>{speechResult && <div className="speech-score"><b>{speechResult.accuracy}% match</b><small>Heard: {speechResult.transcript}</small><small>{speechResult.feedback}</small></div>}</div>
              <button className="secondary-button" onClick={practiseSpeaking} disabled={speechBusy}>{speechBusy ? 'Listening...' : 'Start microphone'}</button>
            </section>
          )}
          <div className="questions">
            {lesson.questions.map((question, questionIndex) => (
              <fieldset data-question-index={questionIndex} key={question.id || question.prompt}>
                <legend><span>{questionIndex + 1}</span>{question.prompt}</legend>
                {['fill_blank', 'essay'].includes(question.type) ? (question.type === 'essay' ? <textarea className="fill-answer" rows={5} value={String(answers[questionIndex] ?? '')} onChange={(event) => choose(questionIndex, event.target.value)} placeholder="Write your response" /> : <input className="fill-answer" value={String(answers[questionIndex] ?? '')} onChange={(event) => choose(questionIndex, event.target.value)} placeholder="Type your answer" />) : ['matching', 'ordering'].includes(question.type) ? <div className="sequence-answer"><div>{question.choices.map((choice, choiceIndex) => <span key={choice}>{choiceIndex + 1}. {choice}</span>)}</div><label>Answer sequence<input value={Array.isArray(answers[questionIndex]) ? (answers[questionIndex] as number[]).map((value) => value + 1).join(',') : ''} onChange={(event) => choose(questionIndex, event.target.value.split(',').map((value) => Number(value.trim()) - 1).filter((value) => value >= 0))} placeholder="Example: 2,1,3" /></label></div> : question.choices.map((choice, choiceIndex) => (
                  <label className={answers[questionIndex] === choiceIndex ? 'selected' : ''} key={choice}><input type="radio" name={`question-${questionIndex}`} checked={answers[questionIndex] === choiceIndex} onChange={() => choose(questionIndex, choiceIndex)} /><i>{String.fromCharCode(65 + choiceIndex)}</i>{choice}</label>
                ))}
              </fieldset>
            ))}
          </div>
          <section className="lesson-notes"><div><strong><PixelIcon name="pencil" size={16} /> Private study notes</strong><small>Only you can see these notes.</small></div><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="New vocabulary, questions, or reminders..." /><button className="secondary-button" onClick={saveStudy}>Save notes & bookmark</button></section>
          <button className="primary-button submit-quest" onClick={submit} disabled={busy}>{busy ? 'Scoring quest...' : 'Complete quest'} <PixelIcon name="zap" /></button>
        </div>
      )}
    </ModalFrame>
  );
}

function QuickQuizDialog(props: QuickQuizDialogProps) {
  const { onClose } = props;
  const { busy, choice, load, question, result, setChoice, submit } = useQuickQuizDialogViewModel(props);
  return (
    <ModalFrame onClose={onClose} label="quick quiz">
      <div className="quick-modal-content"><div className="quiz-orb"><PixelIcon name="quiz" size={44} /></div><span className="overline">Daily pop-up challenge</span><h2>{question?.prompt || 'Summoning a question...'}</h2>
        {question && <div className="quick-choices">{question.choices.map((answer, index) => { const state = result ? index === result.answer ? 'correct' : index === choice ? 'wrong' : '' : index === choice ? 'selected' : ''; return <button className={state} onClick={() => !result && setChoice(index)} key={answer}><i>{String.fromCharCode(65 + index)}</i><span>{answer}</span>{state === 'correct' && <PixelIcon name="check" />}{state === 'wrong' && <PixelIcon name="close" />}</button>; })}</div>}
        {result ? <div className={`quiz-feedback ${result.correct ? 'success' : ''}`}><strong>{result.correct ? 'Critical hit!' : 'Almost!'}</strong><p>{result.explanation}</p><button className="primary-button" onClick={load}>Next challenge <PixelIcon name="zap" /></button></div> : <button className="primary-button quiz-submit" onClick={submit} disabled={choice === null || busy}>{busy ? 'Checking...' : 'Lock in answer'}</button>}
      </div>
    </ModalFrame>
  );
}

function VocabularyPanel(props: VocabularyPanelProps) {
  const { items } = props;
  const { add, definition, remove, setDefinition, setTerm, term } = useVocabularyPanelViewModel(props);
  return (
    <section className="study-card panel section-anchor" id="study">
      <div className="section-title-row"><div className="section-title"><PixelIcon className="yellow" name="brain" /><div><small>Personal study deck</small><h2>Vocabulary & Flashcards</h2></div></div><span className="section-hint">{items.length} saved words</span></div>
      <form className="vocabulary-form" onSubmit={add}><input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="New word" required /><input value={definition} onChange={(event) => setDefinition(event.target.value)} placeholder="Meaning or example" /><button className="primary-button">Add word</button></form>
      {items.length ? <div className="flashcard-grid">{items.map((item) => <article key={item.id}><button onClick={() => void remove(item.id)} aria-label={`Remove ${item.term}`}><PixelIcon name="close" size={14} /></button><strong>{item.term}</strong><p>{item.definition || 'Add your own example sentence while reviewing.'}</p></article>)}</div> : <div className="empty-inline"><PixelIcon name="brain" /><span><strong>Your study deck is empty.</strong><small>Add interesting words as you complete lessons.</small></span></div>}
    </section>
  );
}

export function StudentWorkspaceView({ initialUser, onLogout, page, onNavigate }: StudentWorkspaceViewProps) {
  const vm = useStudentWorkspaceViewModel();
  const {
    data,
    error,
    lessons,
    menuOpen,
    notify,
    profileOpen,
    quizOpen,
    reset,
    selectedCategory,
    selectedLesson,
    setMenuOpen,
    setProfileOpen,
    setQuizOpen,
    setSelectedCategory,
    setSelectedLesson,
    setShowAllLessons,
    showAllLessons,
    toast,
    visibleLessons
  } = vm;

  if (error) return <main className="loading-screen"><h1>The gates are sealed</h1><p>{error}</p><button className="primary-button" onClick={() => window.location.reload()}>Try again</button></main>;
  if (!data) return <main className="loading-screen"><PixelIcon className="loading-rune" name="sparkle" size={58} /><p>Preparing your learning path...</p></main>;
  if (!data.profile.onboardingComplete) return <Onboarding profile={initialUser} />;

  const navigate = (destination: string) => {
    setMenuOpen(false);
    onNavigate(`/student/${destination}`);
  };

  return (
    <div className="app-shell student-shell">
      <header className="topbar">
        <button className="icon-button menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><PixelIcon name="menu" /></button>
        <button className="brand" onClick={() => navigate('dashboard')}><span className="brand-mark"><PixelIcon name="academy" size={23} /></span><span>English Pixel</span><i>Academy</i></button>
        <div className="topbar-spacer" /><div className="streak-chip"><PixelIcon name="flame" size={15} /> {data.stats.streak} day streak</div><div className="level-chip"><PixelIcon name="sparkle" size={14} /> LVL {data.profile.level}</div>
        <button className="profile-trigger" onClick={() => setProfileOpen(true)}><span className="mini-avatar"><img src={pixelWizard} alt="" /></span><span>{data.profile.name}</span><PixelIcon name="chevronDown" size={17} /></button>
      </header>
      <aside className={`side-drawer ${menuOpen ? 'open' : ''}`}><div className="drawer-head"><span className="brand"><span className="brand-mark"><PixelIcon name="academy" /></span><span>English Pixel</span><i>Academy</i></span><button className="icon-button" onClick={() => setMenuOpen(false)}><PixelIcon name="close" /></button></div><nav><button className={page === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}><PixelIcon name="home" /> Dashboard</button><button className={page === 'courses' ? 'active' : ''} onClick={() => navigate('courses')}><PixelIcon name="book" /> Courses & lessons</button><button className={page === 'assignments' ? 'active' : ''} onClick={() => navigate('assignments')}><PixelIcon name="scroll" /> Assignments</button><button className={page === 'learning-hub' ? 'active' : ''} onClick={() => navigate('learning-hub')}><PixelIcon name="academy" /> Learning hub</button><button className={page === 'study' ? 'active' : ''} onClick={() => navigate('study')}><PixelIcon name="brain" /> Study deck</button><button className={page === 'achievements' ? 'active' : ''} onClick={() => navigate('achievements')}><PixelIcon name="trophy" /> Achievements</button><button className={page === 'activity' ? 'active' : ''} onClick={() => navigate('activity')}><PixelIcon name="magic" /> Activity</button></nav><div className="drawer-tip"><PixelIcon name="flame" size={34} /><strong>{data.profile.dailyGoal} minute daily goal</strong><small>{data.profile.learningGoal}</small></div><button className="drawer-close" onClick={onLogout}><PixelIcon name="logout" /> Sign out</button></aside>
      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Close menu" />}

      <main className={`dashboard student-page student-page-${page}`} aria-label={`${page.replace('-', ' ')} page`}>
        <section className="welcome-card panel learner-hero"><div><span className="overline"><PixelIcon name="sparkle" size={15} /> Recommended next quest</span><h1>Welcome back, <em>{data.profile.name}!</em></h1><p>{data.recommendation ? `${data.recommendation.title} is ready in ${data.recommendation.courseTitle}.` : 'Every enrolled quest is complete. Practise again to strengthen mastery!'}</p><div className="hero-actions">{data.recommendation && <button className="primary-button" onClick={() => setSelectedLesson(data.recommendation!)}><PixelIcon name="play" /> {data.recommendation.progress?.status === 'in_progress' ? 'Resume lesson' : 'Start next lesson'}</button>}<button className="secondary-button" onClick={() => setQuizOpen(true)}><PixelIcon name="quiz" /> Quick quiz</button></div></div><div className="hero-character"><img className="wizard-art" src={pixelWizard} alt="Pixel wizard reading" /><div className="character-shadow" /></div></section>

        <section className="progress-card panel"><div className="section-title-row"><div className="section-title"><span className="title-icon sword"><PixelIcon name="sword" /></span><div><small>Curriculum mastery</small><h2>Your Progress</h2></div></div><strong className="progress-percent">{data.stats.progress}%</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${data.stats.progress}%` }}><i /></div></div><div className="progress-caption"><span>{data.stats.completed} of {data.stats.total} lessons mastered</span><span>{data.stats.total - data.stats.completed} remaining</span></div></section>
        <section className="stats-grid four-stats"><article className="stat-card panel"><div className="stat-icon blue"><PixelIcon name="book" /></div><div><span>Lessons</span><strong>{data.stats.completed}</strong><small>mastered</small></div></article><article className="stat-card panel"><div className="stat-icon gold"><PixelIcon name="clock" /></div><div><span>Focus time</span><strong>{formatMinutes(data.stats.learningMinutes)}</strong><small>from actual attempts</small></div></article><article className="stat-card panel"><div className="stat-icon amber"><PixelIcon name="trophy" /></div><div><span>Achievements</span><strong>{data.stats.achievements}</strong><small>of {data.achievements.length}</small></div></article><article className="stat-card panel"><div className="stat-icon red"><PixelIcon name="flame" /></div><div><span>Learning streak</span><strong>{data.stats.streak}</strong><small>consecutive days</small></div></article></section>

        <section className="mastery-card panel"><div className="section-title-row"><div className="section-title"><PixelIcon name="brain" className="yellow" /><div><small>Best scores by competency</small><h2>Skill Mastery</h2></div></div><span className="section-hint">Your personalized map</span></div><div className="mastery-grid">{data.skillMastery.map((skill) => <article key={skill.category}><div><PixelIcon name={categoryDetails[skill.category].icon} /><strong>{categoryDetails[skill.category].label}</strong><span>{skill.score}%</span></div><div className="mini-progress"><i style={{ width: `${skill.score}%` }} /></div></article>)}</div></section>

        <section id="assignments" className="assignment-card panel section-anchor"><div className="section-title-row"><div className="section-title"><PixelIcon name="scroll" className="parchment" /><div><small>From your teacher</small><h2>Assignments</h2></div></div><span className="section-hint">{data.assignments.filter((item) => item.status === 'assigned').length} open</span></div>{data.assignments.length ? <div className="assignment-list">{data.assignments.map((item) => <article className={item.status} key={item.id}><span><PixelIcon name={item.status === 'completed' ? 'check' : 'scroll'} /></span><div><strong>{item.title}</strong><small>{item.courseTitle} · {item.lessonTitle}</small></div><time>{item.status === 'completed' ? 'Completed' : `Due ${dueLabel(item.dueAt)}`}</time>{item.status === 'assigned' && <button onClick={() => setSelectedLesson(data.lessons.find((lesson) => lesson.id === item.lessonId) || null)}>Open</button>}</article>)}</div> : <div className="empty-inline"><PixelIcon name="check" /><span><strong>You are all caught up.</strong><small>New teacher assignments will appear here.</small></span></div>}</section>

        {data.announcements.length > 0 && <section className="announcement-card panel"><div className="section-title-row"><div className="section-title"><PixelIcon name="academy" /><div><small>Classroom noticeboard</small><h2>Announcements</h2></div></div></div><div className="announcement-list">{data.announcements.map((item) => <article key={item.id}><span className="overline">{item.courseTitle}</span><strong>{item.title}</strong><p>{item.body}</p><small>{item.teacherName} · {new Date(item.publishedAt).toLocaleDateString()}</small></article>)}</div></section>}

        {page === 'learning-hub' && <StudentLearningHub
          courses={[...new Map(data.lessons.map((lesson) => [lesson.courseId, { id: lesson.courseId, title: lesson.courseTitle || 'Course' }])).values()]}
          assignments={data.assignments}
          notify={notify}
        />}

        <section id="lessons" className="categories-card panel section-anchor"><div className="section-title-row"><div className="section-title"><PixelIcon className="yellow" name="star" /><div><small>Structured curriculum</small><h2>Courses & Lessons</h2></div></div><span className="section-hint">Draft answers save automatically</span></div><div className="category-tabs"><button className={selectedCategory === 'all' ? 'active' : ''} onClick={() => setSelectedCategory('all')}>All</button>{(Object.keys(categoryDetails) as Category[]).map((category) => <button className={selectedCategory === category ? 'active' : ''} onClick={() => setSelectedCategory(category)} key={category}><PixelIcon name={categoryDetails[category].icon} size={16} /> {categoryDetails[category].label}</button>)}</div><div className="curriculum-grid">{visibleLessons.map((lesson) => <button className={`curriculum-lesson ${lesson.completed ? 'completed' : lesson.progress?.status === 'in_progress' ? 'in-progress' : ''}`} onClick={() => setSelectedLesson(lesson)} key={lesson.id}><span className="lesson-icon"><PixelIcon name={categoryDetails[lesson.category].icon} /></span><div><small>{lesson.courseTitle} · {lesson.moduleTitle}</small><strong>{lesson.title}</strong><p>{lesson.difficulty} · {lesson.minutes} min · {lesson.masteryScore}% mastery</p>{lesson.progress && <div className="lesson-score">Best score: {lesson.progress.bestScore}% · {lesson.progress.attempts} attempt{lesson.progress.attempts === 1 ? '' : 's'}</div>}</div><i>{lesson.completed ? <><PixelIcon name="check" /> Mastered</> : lesson.progress?.status === 'in_progress' ? <>Resume <PixelIcon name="play" /></> : <>Start <PixelIcon name="play" /></>}</i></button>)}</div>{lessons.length > 6 && <button className="show-more" onClick={() => setShowAllLessons((value) => !value)}>{showAllLessons ? 'Show fewer lessons' : `Show all ${lessons.length} lessons`}</button>}</section>

        <VocabularyPanel items={data.vocabulary} notify={notify} />

        <section id="achievements" className="achievements-card panel section-anchor"><div className="section-title-row"><div className="section-title"><PixelIcon className="yellow" name="award" /><div><small>Treasure shelf</small><h2>Achievements</h2></div></div><span className="section-hint">{data.stats.achievements}/{data.achievements.length} unlocked</span></div><div className="achievement-grid">{data.achievements.map((achievement) => <article className={achievement.unlocked ? 'achievement unlocked' : 'achievement locked'} key={achievement.id}><span><PixelIcon name={achievement.unlocked ? (achievement.icon as PixelIconName) : 'lock'} /></span><div><strong>{achievement.title}</strong><small>{achievement.description}</small></div>{achievement.unlocked && <PixelIcon name="check" size={16} />}</article>)}</div></section>

        <section id="activity" className="activity-card panel section-anchor"><div className="section-title-row"><div className="section-title"><PixelIcon className="parchment" name="magic" /><div><small>Complete learning record</small><h2>Recent Activity</h2></div></div></div>{data.activities.length ? <div className="activity-list">{data.activities.map((activity) => <article key={activity.id}><span className="activity-icon"><PixelIcon name={iconForActivity(activity.type)} /></span><div><strong>{activity.title}</strong><small>{activity.detail}</small></div><time>{new Date(activity.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time></article>)}</div> : <div className="empty-inline"><PixelIcon name="sparkle" /><span><strong>No activity yet.</strong><small>Your attempts and study milestones will appear here.</small></span></div>}</section>
        <footer><PixelIcon name="sparkle" size={14} /> English Pixel Academy · Learn a little. Adventure a lot. <PixelIcon name="sparkle" size={14} /></footer>
      </main>

      {selectedLesson && <LessonDialog summary={selectedLesson} onClose={() => setSelectedLesson(null)} notify={notify} />}
      {quizOpen && <QuickQuizDialog onClose={() => setQuizOpen(false)} notify={notify} />}
      {profileOpen && <ProfileEditor profile={data.profile} onClose={() => setProfileOpen(false)} />}
      {profileOpen && <div className="profile-floating-actions"><button onClick={reset}><PixelIcon name="reset" /> Reset my learning data</button><button onClick={onLogout}><PixelIcon name="logout" /> Sign out</button></div>}
      {toast && <div className="toast" role="status"><PixelIcon name="sparkle" /> {toast}</div>}
    </div>
  );
}
