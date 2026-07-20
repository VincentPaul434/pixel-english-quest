import { useEffect, useState, type FormEvent } from 'react';
import { PixelIcon, type PixelIconName } from '../components/PixelIcon';
import { LessonEditor } from '../features/lessons/LessonEditor';
import { request } from '../services/api';
import pixelWizard from '../assets/pixel-wizard.png';
import type { LessonAnalytics, TeacherCourse, TeacherDashboardData, User } from '../types/academy';

type TeacherTab = 'overview' | 'content' | 'students' | 'assignments';
type Notify = (message: string) => void;
type DashboardSaved = (data: TeacherDashboardData) => void;

function Modal({ children, onClose, label, wide = false }: { children: React.ReactNode; onClose: () => void; label: string; wide?: boolean }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label={label}>
      <button className="modal-scrim" onClick={onClose} aria-label={`Dismiss ${label}`} />
      <section className={`${wide ? 'teacher-modal wide-modal' : 'teacher-modal'} panel`}>
        <button className="modal-close icon-button" onClick={onClose} aria-label={`Close ${label}`}>
          <PixelIcon name="close" />
        </button>
        {children}
      </section>
    </div>
  );
}

function CourseForm({ onClose, onSaved, notify }: { onClose: () => void; onSaved: DashboardSaved; notify: Notify }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      onSaved(await request<TeacherDashboardData>('/api/teacher/courses', { method: 'POST', body: JSON.stringify({ title, description, difficulty }) }));
      notify('Course draft created. Add a module and your first lesson.');
      onClose();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create the course.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose} label="create course">
      <form className="settings-form" onSubmit={submit}>
        <span className="overline"><PixelIcon name="book" size={15} /> Curriculum builder</span>
        <h2>Create a course</h2>
        <p>Courses contain ordered modules, lessons, assignments, and enrolled learners.</p>
        <label>Course title<input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} placeholder="Everyday English A1" /></label>
        <label>Description<textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What will learners achieve?" /></label>
        <label>Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
        <button className="primary-button" disabled={busy}>{busy ? 'Creating...' : 'Create course'}</button>
      </form>
    </Modal>
  );
}

function AssignmentForm({ course, lessonId, students, onClose, onSaved, notify }: {
  course: TeacherCourse;
  lessonId: string;
  students: TeacherDashboardData['students'];
  onClose: () => void;
  onSaved: DashboardSaved;
  notify: Notify;
}) {
  const lesson = course.lessons.find((item) => item.id === lessonId)!;
  const [title, setTitle] = useState(lesson.title);
  const [dueAt, setDueAt] = useState('');
  const [selected, setSelected] = useState<string[]>(students.map((student) => student.id));
  const [busy, setBusy] = useState(false);

  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      onSaved(await request<TeacherDashboardData>(`/api/teacher/lessons/${lessonId}/assign`, { method: 'POST', body: JSON.stringify({ title, dueAt: dueAt || null, studentIds: selected }) }));
      notify(`Assigned "${lesson.title}" to ${selected.length} learner${selected.length === 1 ? '' : 's'}.`);
      onClose();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create the assignment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose} label="assign lesson">
      <form className="settings-form assign-form" onSubmit={submit}>
        <span className="overline"><PixelIcon name="scroll" size={15} /> Classroom assignment</span>
        <h2>Assign {lesson.title}</h2>
        <label>Assignment title<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
        <label>Due date<input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label>
        <fieldset>
          <legend>Students</legend>
          <div className="student-checklist">
            <label><input type="checkbox" checked={selected.length === students.length} onChange={(event) => setSelected(event.target.checked ? students.map((student) => student.id) : [])} /><strong>Select all enrolled learners</strong></label>
            {students.map((student) => <label key={student.id}><input type="checkbox" checked={selected.includes(student.id)} onChange={() => toggle(student.id)} /><span><strong>{student.name}</strong><small>{student.email}</small></span></label>)}
          </div>
        </fieldset>
        <button className="primary-button" disabled={busy || selected.length === 0}>{busy ? 'Assigning...' : `Assign to ${selected.length} learner${selected.length === 1 ? '' : 's'}`}</button>
      </form>
    </Modal>
  );
}

function AnnouncementForm({ courses, onClose, onSaved, notify }: { courses: TeacherCourse[]; onClose: () => void; onSaved: DashboardSaved; notify: Notify }) {
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      onSaved(await request<TeacherDashboardData>('/api/teacher/announcements', { method: 'POST', body: JSON.stringify({ courseId, title, body }) }));
      notify('Announcement published.');
      onClose();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not publish the announcement.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose} label="new announcement">
      <form className="settings-form" onSubmit={submit}>
        <span className="overline"><PixelIcon name="academy" size={15} /> Classroom noticeboard</span>
        <h2>Publish an announcement</h2>
        <label>Course<select value={courseId} onChange={(event) => setCourseId(event.target.value)}>{courses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select></label>
        <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
        <label>Message<textarea rows={6} value={body} onChange={(event) => setBody(event.target.value)} required /></label>
        <button className="primary-button" disabled={busy}>{busy ? 'Publishing...' : 'Publish announcement'}</button>
      </form>
    </Modal>
  );
}

function AnalyticsView({ analytics, onClose }: { analytics: LessonAnalytics; onClose: () => void }) {
  return (
    <Modal onClose={onClose} label="lesson analytics" wide>
      <div className="analytics-view">
        <span className="overline"><PixelIcon name="brain" size={15} /> Evidence of learning</span>
        <h2>{analytics.lesson.title}</h2>
        <div className="analytics-summary">
          <article><span>Attempts</span><strong>{analytics.summary.attempts}</strong></article>
          <article><span>Average score</span><strong>{analytics.summary.averageScore}%</strong></article>
          <article><span>Pass rate</span><strong>{analytics.summary.passRate}%</strong></article>
        </div>
        <h3>Question performance</h3>
        {analytics.questions.length ? <div className="question-analytics">{analytics.questions.map((question) => <article key={question.prompt}><div><strong>{question.prompt}</strong><span>{question.attempts} responses - {question.correctRate}% correct</span></div><div className="mini-progress"><i style={{ width: `${question.correctRate}%` }} /></div></article>)}</div> : <p className="empty-copy">No attempts have been submitted yet.</p>}
        <h3>Recent attempts</h3>
        {analytics.attempts.length ? <div className="data-table compact"><div className="table-row table-head"><span>Learner</span><span>Score</span><span>Result</span><span>Date</span></div>{analytics.attempts.map((attempt) => <div className="table-row" key={attempt.id}><span><strong>{attempt.studentName}</strong></span><span>{attempt.score}%</span><span className={attempt.passed ? 'success-text' : 'warning-text'}>{attempt.passed ? 'Passed' : 'Retry'}</span><span>{new Date(attempt.createdAt).toLocaleDateString()}</span></div>)}</div> : <p className="empty-copy">Learner attempts will appear here.</p>}
      </div>
    </Modal>
  );
}

function Overview({ data, setTab, openAnnouncement }: { data: TeacherDashboardData; setTab: (tab: TeacherTab) => void; openAnnouncement: () => void }) {
  const stats = [
    { label: 'Courses', value: data.stats.courses, note: 'active workspaces', icon: 'book' as PixelIconName },
    { label: 'Published lessons', value: data.stats.publishedLessons, note: 'ready to learn', icon: 'magic' as PixelIconName },
    { label: 'Students', value: data.stats.students, note: 'enrolled learners', icon: 'profile' as PixelIconName },
    { label: 'Attempts', value: data.stats.attempts, note: 'learning evidence', icon: 'brain' as PixelIconName }
  ];

  return (
    <div className="teacher-page">
      <section className="teacher-hero panel">
        <div>
          <span className="overline"><PixelIcon name="sparkle" size={15} /> Teacher command center</span>
          <h1>Good day, <em>{data.profile.name}!</em></h1>
          <p>Build meaningful learning paths, guide every student, and use real attempt evidence to plan what comes next.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => setTab('content')}><PixelIcon name="magic" /> Create a lesson</button>
            <button className="secondary-button" onClick={openAnnouncement}><PixelIcon name="academy" /> New announcement</button>
          </div>
        </div>
        <img src={pixelWizard} alt="Pixel teacher wizard" />
      </section>

      <section className="teacher-stats">{stats.map((stat) => <article className="panel" key={stat.label}><span><PixelIcon name={stat.icon} /></span><div><small>{stat.label}</small><strong>{stat.value}</strong><p>{stat.note}</p></div></article>)}</section>
      <div className="teacher-overview-grid">
        <AssignmentProgress data={data} setTab={setTab} />
        <LearnerProgress data={data} setTab={setTab} />
      </div>
    </div>
  );
}

function AssignmentProgress({ data, setTab }: { data: TeacherDashboardData; setTab: (tab: TeacherTab) => void }) {
  return (
    <section className="panel">
      <div className="section-title-row"><div className="section-title"><PixelIcon name="scroll" /><div><small>Current work</small><h2>Assignment progress</h2></div></div><button className="text-button" onClick={() => setTab('assignments')}>View all</button></div>
      {data.assignments.slice(0, 5).map((assignment) => {
        const percent = assignment.studentCount ? Math.round((assignment.completedCount / assignment.studentCount) * 100) : 0;
        return <article className="overview-assignment" key={assignment.id}><div><strong>{assignment.title}</strong><small>{assignment.courseTitle} - {assignment.completedCount}/{assignment.studentCount} completed</small></div><span>{percent}%</span><div className="mini-progress"><i style={{ width: `${percent}%` }} /></div></article>;
      })}
      {!data.assignments.length && <p className="empty-copy">Assignments you create will appear here.</p>}
    </section>
  );
}

function LearnerProgress({ data, setTab }: { data: TeacherDashboardData; setTab: (tab: TeacherTab) => void }) {
  return (
    <section className="panel">
      <div className="section-title-row"><div className="section-title"><PixelIcon name="trophy" /><div><small>Class snapshot</small><h2>Learner progress</h2></div></div><button className="text-button" onClick={() => setTab('students')}>View students</button></div>
      {data.students.slice(0, 5).map((student) => <article className="student-snapshot" key={student.id}><span>{student.name.slice(0, 1).toUpperCase()}</span><div><strong>{student.name}</strong><small>{student.completedLessons} lessons - {student.averageScore}% average</small></div><i>{Math.floor(student.xp / 250) + 1}</i></article>)}
      {!data.students.length && <p className="empty-copy">Publish a course to enroll learners.</p>}
    </section>
  );
}

function ContentView({ data, actions }: {
  data: TeacherDashboardData;
  actions: {
    addModule: (course: TeacherCourse) => void;
    updateCourse: (course: TeacherCourse, status: 'published' | 'draft' | 'archived') => void;
    openAnnouncement: () => void;
    openCourseForm: () => void;
    openEditor: (editor: { lessonId: string | null; courseId: string }) => void;
    openAssignment: (assignment: { course: TeacherCourse; lessonId: string }) => void;
    publishLesson: (lessonId: string) => void;
    archiveLesson: (lessonId: string) => void;
    openAnalytics: (lessonId: string) => void;
  };
}) {
  return (
    <div className="teacher-page">
      <div className="page-heading">
        <div><span className="overline">Curriculum studio</span><h1>Courses & Lessons</h1><p>Create structured modules, multimedia lessons, questions, and mastery rules.</p></div>
        <div><button className="secondary-button" onClick={actions.openAnnouncement}><PixelIcon name="academy" /> Announcement</button><button className="primary-button" onClick={actions.openCourseForm}><PixelIcon name="book" /> New course</button></div>
      </div>
      {data.courses.length ? <div className="course-stack">{data.courses.map((course) => <CourseManager course={course} actions={actions} key={course.id} />)}</div> : <section className="empty-teacher-state panel"><PixelIcon name="book" size={60} /><h2>Create your first course</h2><p>Start with a curriculum container, then add modules, lessons, and assignments.</p><button className="primary-button" onClick={actions.openCourseForm}>New course</button></section>}
    </div>
  );
}

function CourseManager({ course, actions }: { course: TeacherCourse; actions: Parameters<typeof ContentView>[0]['actions'] }) {
  return (
    <section className="course-manager panel">
      <header>
        <div><span className={`status-pill ${course.status}`}>{course.status}</span><h2>{course.title}</h2><p>{course.description || 'No course description yet.'}</p><small>{course.difficulty} - {course.moduleCount} modules - {course.lessonCount} lessons - {course.studentCount} learners</small></div>
        <div className="course-actions">
          <button onClick={() => actions.addModule(course)}><PixelIcon name="magic" /> Add module</button>
          <button onClick={() => actions.openEditor({ lessonId: null, courseId: course.id })}><PixelIcon name="quiz" /> New lesson</button>
          {course.status === 'draft' && <button className="publish" onClick={() => actions.updateCourse(course, 'published')}><PixelIcon name="sparkle" /> Publish course</button>}
        </div>
      </header>
      {course.modules.length > 0 && <div className="module-strip">{course.modules.map((module) => <span key={module.id}><PixelIcon name="book" size={14} /> {module.title}</span>)}</div>}
      <div className="teacher-lesson-list">
        {course.lessons.map((lesson) => <LessonRow course={course} lesson={lesson} actions={actions} key={lesson.id} />)}
        {!course.lessons.length && <div className="course-empty"><PixelIcon name="magic" /><div><strong>This course needs its first quest.</strong><small>Create a lesson, add questions, then publish it.</small></div><button className="primary-button" onClick={() => actions.openEditor({ lessonId: null, courseId: course.id })}>Create lesson</button></div>}
      </div>
    </section>
  );
}

function LessonRow({ course, lesson, actions }: { course: TeacherCourse; lesson: TeacherCourse['lessons'][number]; actions: Parameters<typeof ContentView>[0]['actions'] }) {
  return (
    <article>
      <span className={`lesson-type ${lesson.category}`}><PixelIcon name={lesson.category === 'grammar' ? 'grammar' : lesson.category === 'listening' ? 'headphones' : lesson.category === 'speaking' ? 'mic' : 'book'} /></span>
      <div><strong>{lesson.title}</strong><small>{lesson.category} - {lesson.difficulty} - {lesson.minutes} min - {lesson.questionCount} questions - {lesson.masteryScore}% mastery</small></div>
      <span className={`status-pill ${lesson.status}`}>{lesson.status}</span>
      <div className="row-actions">
        <button onClick={() => actions.openEditor({ lessonId: lesson.id, courseId: course.id })} title="Edit"><PixelIcon name="pencil" /></button>
        {lesson.status === 'draft' && <button onClick={() => actions.publishLesson(lesson.id)} title="Publish"><PixelIcon name="sparkle" /></button>}
        {lesson.status === 'published' && <button onClick={() => actions.openAssignment({ course, lessonId: lesson.id })} title="Assign"><PixelIcon name="scroll" /></button>}
        <button onClick={() => actions.openAnalytics(lesson.id)} title="Analytics"><PixelIcon name="brain" /></button>
        <button onClick={() => actions.archiveLesson(lesson.id)} className="danger" title="Archive"><PixelIcon name="close" /></button>
      </div>
    </article>
  );
}

function StudentsView({ data }: { data: TeacherDashboardData }) {
  return (
    <div className="teacher-page">
      <div className="page-heading"><div><span className="overline">Learner insights</span><h1>Students</h1><p>Monitor proficiency, XP, completion, and average assessment performance.</p></div></div>
      <section className="panel table-panel">
        {data.students.length ? <div className="data-table student-table"><div className="table-row table-head"><span>Learner</span><span>Level</span><span>Courses</span><span>Completed</span><span>Average score</span><span>XP</span></div>{data.students.map((student) => <div className="table-row" key={student.id}><span className="student-cell"><i>{student.name.slice(0, 1).toUpperCase()}</i><span><strong>{student.name}</strong><small>{student.email}</small></span></span><span>{student.proficiency}</span><span>{student.courseCount}</span><span>{student.completedLessons}</span><span><b className={student.averageScore >= 75 ? 'success-text' : 'warning-text'}>{student.averageScore}%</b></span><span>{student.xp}</span></div>)}</div> : <div className="empty-teacher-state"><PixelIcon name="profile" size={54} /><h2>No enrolled students yet</h2><p>Publishing a course enrolls available student accounts.</p></div>}
      </section>
    </div>
  );
}

function AssignmentsView({ data, setTab }: { data: TeacherDashboardData; setTab: (tab: TeacherTab) => void }) {
  return (
    <div className="teacher-page">
      <div className="page-heading"><div><span className="overline">Classroom workflow</span><h1>Assignments</h1><p>Track due dates and completion across every published lesson.</p></div></div>
      <div className="assignment-board">
        {data.assignments.map((item) => {
          const percent = item.studentCount ? Math.round((item.completedCount / item.studentCount) * 100) : 0;
          return <article className="panel" key={item.id}><span className="assignment-rune"><PixelIcon name="scroll" /></span><div><small>{item.courseTitle}</small><h2>{item.title}</h2><p>{item.lessonTitle}</p><span>Due {item.dueAt ? new Date(item.dueAt).toLocaleString() : 'any time'}</span></div><strong>{item.completedCount}/{item.studentCount}</strong><div className="mini-progress"><i style={{ width: `${percent}%` }} /></div><small>{percent}% completed</small></article>;
        })}
        {!data.assignments.length && <section className="empty-teacher-state panel"><PixelIcon name="scroll" size={60} /><h2>No assignments yet</h2><p>Open Content and assign any published lesson to enrolled learners.</p><button className="primary-button" onClick={() => setTab('content')}>Browse lessons</button></section>}
      </div>
    </div>
  );
}

export function TeacherWorkspace({ initialUser, onLogout }: { initialUser: User; onLogout: () => void }) {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [tab, setTab] = useState<TeacherTab>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [courseForm, setCourseForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState(false);
  const [editor, setEditor] = useState<{ lessonId: string | null; courseId: string } | null>(null);
  const [assignment, setAssignment] = useState<{ course: TeacherCourse; lessonId: string } | null>(null);
  const [analytics, setAnalytics] = useState<LessonAnalytics | null>(null);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const notify = (message: string) => setToast(message);

  useEffect(() => {
    request<TeacherDashboardData>('/api/teacher/dashboard').then(setData).catch((err) => setError(err instanceof Error ? err.message : 'Could not load the teacher workspace.'));
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
      setData(await request<TeacherDashboardData>(`/api/teacher/courses/${course.id}/modules`, { method: 'POST', body: JSON.stringify({ title }) }));
      notify('Module added.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not add the module.');
    }
  };
  const updateCourse = async (course: TeacherCourse, status: 'published' | 'draft' | 'archived') => {
    try {
      setData(await request<TeacherDashboardData>(`/api/teacher/courses/${course.id}`, { method: 'PUT', body: JSON.stringify({ ...course, status }) }));
      notify(status === 'published' ? 'Course published and learners enrolled.' : 'Course updated.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update the course.');
    }
  };
  const publishLesson = async (id: string) => {
    try {
      setData(await request<TeacherDashboardData>(`/api/teacher/lessons/${id}/publish`, { method: 'POST' }));
      notify('Lesson published.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not publish the lesson.');
    }
  };
  const archiveLesson = async (id: string) => {
    if (!window.confirm('Archive this lesson? Existing attempt records will remain available.')) return;
    try {
      setData(await request<TeacherDashboardData>(`/api/teacher/lessons/${id}`, { method: 'DELETE' }));
      notify('Lesson archived.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not archive the lesson.');
    }
  };
  const openAnalytics = async (id: string) => {
    try {
      setAnalytics(await request<LessonAnalytics>(`/api/teacher/lessons/${id}/analytics`));
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not load analytics.');
    }
  };

  const contentActions = {
    addModule: (course: TeacherCourse) => void addModule(course),
    updateCourse: (course: TeacherCourse, status: 'published' | 'draft' | 'archived') => void updateCourse(course, status),
    openAnnouncement: () => setAnnouncementForm(true),
    openCourseForm: () => setCourseForm(true),
    openEditor: setEditor,
    openAssignment: setAssignment,
    publishLesson: (id: string) => void publishLesson(id),
    archiveLesson: (id: string) => void archiveLesson(id),
    openAnalytics: (id: string) => void openAnalytics(id)
  };

  if (error) return <main className="loading-screen"><h1>Teacher workspace unavailable</h1><p>{error}</p><button className="primary-button" onClick={() => window.location.reload()}>Try again</button></main>;
  if (!data) return <main className="loading-screen"><PixelIcon name="sparkle" size={58} /><p>Preparing the teacher workshop...</p></main>;

  return (
    <div className="teacher-shell">
      <header className="topbar teacher-topbar">
        <button className="icon-button menu-button" onClick={() => setMenuOpen(true)} aria-label="Open teacher menu"><PixelIcon name="menu" /></button>
        <button className="brand" onClick={() => setTab('overview')}><span className="brand-mark"><PixelIcon name="academy" /></span><span>English Pixel</span><i>Teacher</i></button>
        <nav className="teacher-top-nav">
          {(['overview', 'content', 'students', 'assignments'] as TeacherTab[]).map((item) => <button className={tab === item ? 'active' : ''} onClick={() => setTab(item)} key={item}>{item[0].toUpperCase() + item.slice(1)}</button>)}
        </nav>
        <div className="topbar-spacer" />
        <button className="profile-trigger"><span className="mini-avatar"><img src={pixelWizard} alt="" /></span><span>{data.profile.name}</span><small>Teacher</small></button>
        <button className="icon-button desktop-logout" onClick={onLogout} aria-label="Sign out"><PixelIcon name="logout" /></button>
      </header>

      <aside className={`side-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="drawer-head"><span className="brand"><span className="brand-mark"><PixelIcon name="academy" /></span><span>Teacher</span><i>Workspace</i></span><button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Close teacher menu"><PixelIcon name="close" /></button></div>
        <nav>{(['overview', 'content', 'students', 'assignments'] as TeacherTab[]).map((item) => <button key={item} onClick={() => { setTab(item); setMenuOpen(false); }}><PixelIcon name={item === 'overview' ? 'home' : item === 'content' ? 'book' : item === 'students' ? 'profile' : 'scroll'} /> {item[0].toUpperCase() + item.slice(1)}</button>)}</nav>
        <button className="drawer-close" onClick={onLogout}><PixelIcon name="logout" /> Sign out</button>
      </aside>
      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Close teacher menu" />}

      <main className="teacher-main">
        {tab === 'overview' && <Overview data={data} setTab={setTab} openAnnouncement={() => setAnnouncementForm(true)} />}
        {tab === 'content' && <ContentView data={data} actions={contentActions} />}
        {tab === 'students' && <StudentsView data={data} />}
        {tab === 'assignments' && <AssignmentsView data={data} setTab={setTab} />}
      </main>

      {courseForm && <CourseForm onClose={() => setCourseForm(false)} onSaved={setData} notify={notify} />}
      {announcementForm && <AnnouncementForm courses={data.courses} onClose={() => setAnnouncementForm(false)} onSaved={setData} notify={notify} />}
      {editor && <LessonEditor courses={data.courses} lessonId={editor.lessonId} initialCourseId={editor.courseId} onClose={() => setEditor(null)} onSaved={setData} notify={notify} />}
      {assignment && <AssignmentForm course={assignment.course} lessonId={assignment.lessonId} students={data.students} onClose={() => setAssignment(null)} onSaved={setData} notify={notify} />}
      {analytics && <AnalyticsView analytics={analytics} onClose={() => setAnalytics(null)} />}
      {toast && <div className="toast" role="status"><PixelIcon name="sparkle" /> {toast}</div>}
    </div>
  );
}
