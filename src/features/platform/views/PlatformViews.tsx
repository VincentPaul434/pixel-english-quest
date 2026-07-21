import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PixelIcon } from '../../../shared-components/PixelIcon';
import {
  addClassroomStudent, confirmVerification, createBankQuestion, createClassroom, createEvent, disableMfa,
  downloadTeacherReport, enableMfa, enrollCourse, getAdminData, getPlatform, gradeWork, markAllRead,
  postDiscussion, requestVerification, setAdmin, setupMfa, submitWork, uploadAsset
} from '../models/api';
import type { AdminData, PlatformData, StudentLearningHubProps, TeacherOperationsProps } from '../models/types';

function Empty({ children }: { children: string }) {
  return <p className="hub-empty">{children}</p>;
}

function AccountSecurity({ data, notify }: { data: PlatformData; notify: (message: string) => void }) {
  const verifyEmail = async () => {
    try {
      const result = await requestVerification();
      if (result.alreadyVerified) return notify('Your email is already verified.');
      if (result.developmentToken) await confirmVerification(result.developmentToken);
      notify(result.developmentToken ? 'Email verified in development mode.' : 'Verification instructions were sent to your email.');
    } catch (error) { notify(error instanceof Error ? error.message : 'Could not start verification.'); }
  };
  const configureMfa = async () => {
    try {
      if (data.profile.mfaEnabled) {
        const password = window.prompt('Enter your password to disable authenticator MFA');
        if (!password) return;
        await disableMfa(password); notify('Authenticator MFA disabled.'); return;
      }
      const setup = await setupMfa();
      window.prompt('Add this secret to your authenticator app, then copy your six-digit code.\n\nSecret:', setup.secret);
      const code = window.prompt('Enter the current six-digit authenticator code');
      if (!code) return;
      await enableMfa(code); notify('Authenticator MFA enabled.');
    } catch (error) { notify(error instanceof Error ? error.message : 'Could not update MFA.'); }
  };
  return <div className="security-bar"><span><PixelIcon name="lock" /><strong>Account security</strong><small>{data.profile.emailVerified ? 'Email verified' : 'Email verification pending'} · {data.profile.mfaEnabled ? 'MFA enabled' : 'MFA optional'}</small></span>{!data.profile.emailVerified && <button onClick={() => void verifyEmail()}>Verify email</button>}<button onClick={() => void configureMfa()}>{data.profile.mfaEnabled ? 'Disable MFA' : 'Set up MFA'}</button></div>;
}

export function StudentLearningHub({ courses, assignments, notify }: StudentLearningHubProps) {
  const [data, setData] = useState<PlatformData | null>(null);
  const [discussionCourse, setDiscussionCourse] = useState(courses[0]?.id || '');
  const [message, setMessage] = useState('');
  const [submission, setSubmission] = useState({ assignmentId: assignments.find((item) => item.status === 'assigned')?.id || '', text: '', attachmentUrl: '' });
  useEffect(() => { void getPlatform().then(setData).catch((error) => notify(error instanceof Error ? error.message : 'Could not load the learning hub.')); }, [notify]);
  const availableCourses = useMemo(() => [...new Map(courses.map((course) => [course.id, course])).values()], [courses]);
  if (!data) return <section id="learning-hub" className="panel platform-hub section-anchor"><div className="modal-loading"><PixelIcon name="sparkle" /><p>Loading your learning hub...</p></div></section>;

  const post = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await postDiscussion(discussionCourse, message);
      setData(await getPlatform()); setMessage(''); notify('Discussion posted.');
    } catch (error) { notify(error instanceof Error ? error.message : 'Could not post.'); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try { setData(await submitWork(submission.assignmentId, submission.text, submission.attachmentUrl)); setSubmission({ ...submission, text: '', attachmentUrl: '' }); notify('Work submitted to your teacher.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Could not submit work.'); }
  };

  return (
    <section id="learning-hub" className="panel platform-hub section-anchor">
      <div className="section-title-row"><div className="section-title"><PixelIcon name="academy" /><div><small>Everything around your lessons</small><h2>Learning Hub</h2></div></div>{data.unreadNotifications > 0 && <button className="text-button" onClick={() => void markAllRead().then(setData)}>Mark {data.unreadNotifications} read</button>}</div>
      <div className="hub-grid">
        <article><h3><PixelIcon name="magic" /> Notifications</h3>{data.notifications.slice(0, 5).map((item) => <div className={`hub-row ${item.readAt ? '' : 'unread'}`} key={item.id}><strong>{item.title}</strong><small>{item.body}</small></div>)}{!data.notifications.length && <Empty>No new notifications.</Empty>}</article>
        <article><h3><PixelIcon name="clock" /> Calendar</h3>{data.events.slice(0, 5).map((item) => <div className="hub-row" key={item.id}><strong>{item.title}</strong><small>{new Date(item.startsAt).toLocaleString()} {item.courseTitle ? `· ${item.courseTitle}` : ''}</small></div>)}{!data.events.length && <Empty>No upcoming events.</Empty>}</article>
        <article><h3><PixelIcon name="academy" /> Classrooms</h3>{data.classrooms.map((item) => <div className="hub-row" key={item.id}><strong>{item.name}</strong><small>{item.courseTitle} · code {item.code}</small></div>)}{!data.classrooms.length && <Empty>Your teacher has not added a classroom.</Empty>}</article>
        <article><h3><PixelIcon name="trophy" /> Certificates</h3>{data.certificates?.map((item) => <a className="hub-row" href={`/api/certificates/${item.verificationCode}`} target="_blank" rel="noreferrer" key={item.id}><strong>{item.courseTitle}</strong><small>Issued {new Date(item.issuedAt).toLocaleDateString()} · {item.verificationCode}</small></a>)}{!data.certificates?.length && <Empty>Complete a course to earn a verified certificate.</Empty>}</article>
      </div>

      {!!data.catalog?.length && <div className="hub-block"><h3>Course catalog</h3><div className="catalog-strip">{data.catalog.map((course) => <article key={course.id}><span>{course.difficulty}</span><strong>{course.title}</strong><small>{course.teacherName} · {course.lessonCount} lessons</small><button disabled={course.enrolled || course.enrollmentMode !== 'self'} onClick={() => void enrollCourse(course.id).then(setData).catch((error) => notify(error.message))}>{course.enrolled ? 'Enrolled' : course.enrollmentMode === 'self' ? 'Enroll' : 'Invite only'}</button></article>)}</div></div>}

      <div className="hub-forms">
        <form onSubmit={post}><h3>Course discussion</h3><select value={discussionCourse} onChange={(event) => setDiscussionCourse(event.target.value)}>{availableCourses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select><textarea rows={3} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask a question or help a classmate" required /><button className="secondary-button" disabled={!discussionCourse}>Post message</button></form>
        <form onSubmit={submit}><h3>Submit assignment work</h3><select value={submission.assignmentId} onChange={(event) => setSubmission({ ...submission, assignmentId: event.target.value })}><option value="">Choose an assignment</option>{assignments.filter((item) => item.status === 'assigned').map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select><textarea rows={3} value={submission.text} onChange={(event) => setSubmission({ ...submission, text: event.target.value })} placeholder="Write or paste your work" /><label className="file-field">Optional file<input type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAsset(file).then((attachmentUrl) => { setSubmission((current) => ({ ...current, attachmentUrl })); notify('File uploaded.'); }).catch((error) => notify(error.message)); }} /></label>{submission.attachmentUrl && <small className="success-text">File ready to submit</small>}<button className="secondary-button" disabled={!submission.assignmentId || (!submission.text && !submission.attachmentUrl)}>Submit to teacher</button></form>
      </div>
      {data.discussions.length > 0 && <div className="discussion-stream"><h3>Recent discussion</h3>{data.discussions.slice(0, 8).map((item) => <article key={item.id}><strong>{item.authorName}</strong><span>{item.courseTitle}</span><p>{item.body}</p><small>{new Date(item.createdAt).toLocaleString()}</small></article>)}</div>}
      {data.submissions.length > 0 && <div className="submission-strip"><h3>Your submissions</h3>{data.submissions.slice(0, 6).map((item) => <article key={item.id}><strong>{item.assignmentTitle}</strong><span className={`status-pill ${item.status}`}>{item.status}</span><small>{item.score == null ? 'Awaiting feedback' : `${item.score}/${item.maxScore} · ${item.feedback}`}</small></article>)}</div>}
      <AccountSecurity data={data} notify={notify} />
    </section>
  );
}

export function TeacherOperations({ courses, students, user, notify }: TeacherOperationsProps) {
  const [data, setData] = useState<PlatformData | null>(null);
  const [classroom, setClassroom] = useState({ courseId: courses[0]?.id || '', name: '' });
  const [event, setEvent] = useState({ courseId: courses[0]?.id || '', title: '', startsAt: '' });
  const [bank, setBank] = useState({ prompt: '', answer: '', choices: '' });
  useEffect(() => { void getPlatform().then(setData).catch((error) => notify(error instanceof Error ? error.message : 'Could not load operations.')); }, [notify]);
  if (!data) return <div className="teacher-page"><section className="panel modal-loading"><PixelIcon name="sparkle" /><p>Loading classroom operations...</p></section></div>;
  const saveClassroom = async (e: FormEvent) => { e.preventDefault(); try { setData(await createClassroom(classroom)); setClassroom({ ...classroom, name: '' }); notify('Classroom created.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not create classroom.'); } };
  const saveEvent = async (e: FormEvent) => { e.preventDefault(); try { setData(await createEvent({ ...event, startsAt: new Date(event.startsAt).toISOString() })); setEvent({ ...event, title: '', startsAt: '' }); notify('Event scheduled and learners notified.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not schedule event.'); } };
  const saveBank = async (e: FormEvent) => { e.preventDefault(); try { setData(await createBankQuestion({ prompt: bank.prompt, type: bank.choices ? 'multiple_choice' : 'fill_blank', choices: bank.choices.split(',').map((item) => item.trim()).filter(Boolean), answer: bank.choices ? Number(bank.answer) : bank.answer })); setBank({ prompt: '', answer: '', choices: '' }); notify('Question saved to the bank.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not save question.'); } };
  const grade = async (submissionId: string, maxScore: number) => { const score = window.prompt(`Score out of ${maxScore}`); if (score == null) return; const feedback = window.prompt('Feedback for the learner') || ''; try { setData(await gradeWork(submissionId, Number(score), feedback)); notify('Submission graded.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not grade submission.'); } };
  const addStudent = async (classroomId: string) => { const studentId = window.prompt(`Student ID\n${students.map((student) => `${student.name}: ${student.id}`).join('\n')}`); if (!studentId) return; try { setData(await addClassroomStudent(classroomId, studentId)); notify('Student added to the classroom.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not add student.'); } };

  return (
    <div className="teacher-page operations-page">
      <div className="page-heading"><div><span className="overline">Live learning operations</span><h1>Classes, grading & community</h1><p>Manage rosters, learner work, calendar events, reusable questions, notifications, and reports.</p></div><button className="primary-button" onClick={() => void downloadTeacherReport().catch((error) => notify(error.message))}><PixelIcon name="scroll" /> Export CSV report</button></div>
      <div className="operations-forms">
        <form className="panel" onSubmit={saveClassroom}><h2>Create classroom</h2><select value={classroom.courseId} onChange={(e) => setClassroom({ ...classroom, courseId: e.target.value })}>{courses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select><input value={classroom.name} onChange={(e) => setClassroom({ ...classroom, name: e.target.value })} placeholder="Classroom name" required /><button className="secondary-button">Create</button></form>
        <form className="panel" onSubmit={saveEvent}><h2>Schedule event</h2><select value={event.courseId} onChange={(e) => setEvent({ ...event, courseId: e.target.value })}>{courses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select><input value={event.title} onChange={(e) => setEvent({ ...event, title: e.target.value })} placeholder="Event title" required /><input type="datetime-local" value={event.startsAt} onChange={(e) => setEvent({ ...event, startsAt: e.target.value })} required /><button className="secondary-button">Schedule</button></form>
        <form className="panel" onSubmit={saveBank}><h2>Question bank</h2><input value={bank.prompt} onChange={(e) => setBank({ ...bank, prompt: e.target.value })} placeholder="Question prompt" required /><input value={bank.choices} onChange={(e) => setBank({ ...bank, choices: e.target.value })} placeholder="Choices, comma separated (optional)" /><input value={bank.answer} onChange={(e) => setBank({ ...bank, answer: e.target.value })} placeholder={bank.choices ? 'Correct choice index (0 first)' : 'Correct answer'} required /><button className="secondary-button">Save question</button></form>
      </div>
      <section className="panel"><div className="section-title-row"><div className="section-title"><PixelIcon name="academy" /><div><small>Rosters & access codes</small><h2>Classrooms</h2></div></div></div><div className="classroom-grid">{data.classrooms.map((item) => <article key={item.id}><strong>{item.name}</strong><small>{item.courseTitle} · {item.studentCount} learners</small><code>{item.code}</code><button onClick={() => void addStudent(item.id)}>Add student</button></article>)}{!data.classrooms.length && <Empty>Create a classroom to organize a course roster.</Empty>}</div></section>
      <section className="panel"><div className="section-title-row"><div className="section-title"><PixelIcon name="scroll" /><div><small>Manual feedback & rubric-ready records</small><h2>Submission inbox</h2></div></div><span className="section-hint">{data.submissions.filter((item) => item.status !== 'graded').length} to grade</span></div><div className="grading-list">{data.submissions.map((item) => <article key={item.id}><div><strong>{item.studentName} · {item.assignmentTitle}</strong><small>{item.courseTitle} · attempt {item.attemptNumber} · {new Date(item.submittedAt).toLocaleString()}</small><p>{item.textContent || 'Attachment submission'}</p></div><span>{item.score == null ? 'Pending' : `${item.score}/${item.maxScore}`}</span><button onClick={() => void grade(item.id, item.maxScore)}>{item.status === 'graded' ? 'Regrade' : 'Grade'}</button></article>)}{!data.submissions.length && <Empty>Learner submissions will arrive here.</Empty>}</div></section>
      <div className="hub-grid teacher-hub-grid"><article><h3>Upcoming events</h3>{data.events.slice(0, 8).map((item) => <div className="hub-row" key={item.id}><strong>{item.title}</strong><small>{new Date(item.startsAt).toLocaleString()}</small></div>)}</article><article><h3>Recent discussion</h3>{data.discussions.slice(0, 8).map((item) => <div className="hub-row" key={item.id}><strong>{item.authorName}</strong><small>{item.body}</small></div>)}</article><article><h3>Reusable questions</h3>{data.questionBank?.slice(0, 8).map((item) => <div className="hub-row" key={item.id}><strong>{item.prompt}</strong><small>{item.type} · {item.tags.join(', ') || 'untagged'}</small></div>)}</article></div>
      {user.isAdmin && <AdminConsole notify={notify} />}
      <AccountSecurity data={data} notify={notify} />
    </div>
  );
}

function AdminConsole({ notify }: { notify: (message: string) => void }) {
  const [data, setData] = useState<AdminData | null>(null);
  useEffect(() => { void getAdminData().then(setData).catch((error) => notify(error instanceof Error ? error.message : 'Could not load admin data.')); }, [notify]);
  if (!data) return null;
  return <section className="panel admin-console"><div className="section-title-row"><div className="section-title"><PixelIcon name="lock" /><div><small>Administrator controls</small><h2>Platform governance</h2></div></div></div><div className="admin-stats">{Object.entries(data.summary).map(([label, value]) => <article key={label}><strong>{value}</strong><small>{label}</small></article>)}</div><div className="admin-columns"><div><h3>Users</h3>{data.users.map((item) => <div className="hub-row" key={item.id}><strong>{item.name} <small>({item.role})</small></strong><span>{item.email}</span><button disabled={item.isAdmin} onClick={() => void setAdmin(item.id, true).then(setData).catch((error) => notify(error.message))}>{item.isAdmin ? 'Admin' : 'Make admin'}</button></div>)}</div><div><h3>Audit trail</h3>{data.logs.slice(0, 20).map((item) => <div className="hub-row" key={item.id}><strong>{item.action} · {item.entityType}</strong><small>{item.actorName || 'System'} · {new Date(item.createdAt).toLocaleString()}</small></div>)}</div></div></section>;
}
