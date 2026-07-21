import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PixelIcon } from '../../../shared-components/PixelIcon';
import {
  useConfirmVerificationMutation, useCreateBankQuestionMutation, useCreateClassroomMutation, useCreateEventMutation,
  useCreateInvitationMutation, useDisableMfaMutation, useDownloadTeacherReportMutation, useEnableMfaMutation,
  useEnrollCourseMutation, useGradeWorkMutation, useJoinClassroomMutation, useLeaveClassroomMutation,
  useMarkAllReadMutation, usePostDiscussionMutation, useRemoveClassroomStudentMutation,
  useRequestVerificationMutation, useResolveJoinRequestMutation, useRevokeInvitationMutation,
  useSetAdminMutation, useSetupMfaMutation, useSubmitWorkMutation, useUploadAssetMutation
} from '../../../hooks/mutations/platformMutations';
import { useAdminQuery, useInvitationQuery, usePlatformQuery } from '../../../hooks/queries/platformQueries';
import type { PlatformData, StudentLearningHubProps, TeacherOperationsProps } from '../models/types';

function Empty({ children }: { children: string }) {
  return <p className="hub-empty">{children}</p>;
}

function AccountSecurity({ data, notify }: { data: PlatformData; notify: (message: string) => void }) {
  const requestVerificationMutation = useRequestVerificationMutation();
  const confirmVerificationMutation = useConfirmVerificationMutation();
  const setupMfaMutation = useSetupMfaMutation();
  const enableMfaMutation = useEnableMfaMutation();
  const disableMfaMutation = useDisableMfaMutation();
  const verifyEmail = async () => {
    try {
      const result = await requestVerificationMutation.mutateAsync();
      if (result.alreadyVerified) return notify('Your email is already verified.');
      if (result.developmentToken) await confirmVerificationMutation.mutateAsync(result.developmentToken);
      notify(result.developmentToken ? 'Email verified in development mode.' : 'Verification instructions were sent to your email.');
    } catch (error) { notify(error instanceof Error ? error.message : 'Could not start verification.'); }
  };
  const configureMfa = async () => {
    try {
      if (data.profile.mfaEnabled) {
        const password = window.prompt('Enter your password to disable authenticator MFA');
        if (!password) return;
        await disableMfaMutation.mutateAsync(password); notify('Authenticator MFA disabled.'); return;
      }
      const setup = await setupMfaMutation.mutateAsync();
      window.prompt('Add this secret to your authenticator app, then copy your six-digit code.\n\nSecret:', setup.secret);
      const code = window.prompt('Enter the current six-digit authenticator code');
      if (!code) return;
      await enableMfaMutation.mutateAsync(code); notify('Authenticator MFA enabled.');
    } catch (error) { notify(error instanceof Error ? error.message : 'Could not update MFA.'); }
  };
  return <div className="security-bar"><span><PixelIcon name="lock" /><strong>Account security</strong><small>{data.profile.emailVerified ? 'Email verified' : 'Email verification pending'} · {data.profile.mfaEnabled ? 'MFA enabled' : 'MFA optional'}</small></span>{!data.profile.emailVerified && <button onClick={() => void verifyEmail()}>Verify email</button>}<button onClick={() => void configureMfa()}>{data.profile.mfaEnabled ? 'Disable MFA' : 'Set up MFA'}</button></div>;
}

export function StudentLearningHub({ courses, assignments, notify }: StudentLearningHubProps) {
  const platformQuery = usePlatformQuery();
  const markAllReadMutation = useMarkAllReadMutation();
  const enrollCourseMutation = useEnrollCourseMutation();
  const postDiscussionMutation = usePostDiscussionMutation();
  const submitWorkMutation = useSubmitWorkMutation();
  const joinClassroomMutation = useJoinClassroomMutation();
  const leaveClassroomMutation = useLeaveClassroomMutation();
  const uploadMutation = useUploadAssetMutation();
  const data = platformQuery.data;
  const [discussionCourse, setDiscussionCourse] = useState(courses[0]?.id || '');
  const [message, setMessage] = useState('');
  const [submission, setSubmission] = useState({ assignmentId: assignments.find((item) => item.status === 'assigned')?.id || '', text: '', attachmentUrl: '' });
  const [inviteCode, setInviteCode] = useState(() => new URLSearchParams(window.location.search).get('invite') || '');
  const [previewCode, setPreviewCode] = useState(inviteCode);
  const invitationQuery = useInvitationQuery(previewCode, Boolean(previewCode));
  const invite = invitationQuery.data ?? null;
  useEffect(() => {
    if (invitationQuery.error) notify(invitationQuery.error instanceof Error ? invitationQuery.error.message : 'Could not open invitation.');
  }, [invitationQuery.error, notify]);
  const availableCourses = useMemo(() => [...new Map(courses.map((course) => [course.id, course])).values()], [courses]);
  if (platformQuery.isError) return <section id="learning-hub" className="panel platform-hub section-anchor"><div className="modal-loading"><PixelIcon name="close" /><p>{platformQuery.error instanceof Error ? platformQuery.error.message : 'Could not load the learning hub.'}</p></div></section>;
  if (!data) return <section id="learning-hub" className="panel platform-hub section-anchor"><div className="modal-loading"><PixelIcon name="sparkle" /><p>Loading your learning hub...</p></div></section>;

  const post = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await postDiscussionMutation.mutateAsync({ courseId: discussionCourse, body: message });
      setMessage(''); notify('Discussion posted.');
    } catch (error) { notify(error instanceof Error ? error.message : 'Could not post.'); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try { await submitWorkMutation.mutateAsync({ assignmentId: submission.assignmentId, textContent: submission.text, attachmentUrl: submission.attachmentUrl }); setSubmission({ ...submission, text: '', attachmentUrl: '' }); notify('Work submitted to your teacher.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Could not submit work.'); }
  };
  const inspectInvite = async (event: FormEvent) => {
    event.preventDefault();
    const code = inviteCode.trim().toUpperCase();
    setPreviewCode(code);
    if (code === previewCode) void invitationQuery.refetch();
  };
  const acceptInvite = async () => {
    if (!invite) return;
    try {
      await joinClassroomMutation.mutateAsync(invite.code);
      notify(invite.approvalRequired ? 'Access request sent to your teacher.' : `You joined ${invite.classroomName}.`);
    } catch (error) { notify(error instanceof Error ? error.message : 'Could not use invitation.'); }
  };
  const leave = async (classroomId: string) => {
    if (!window.confirm('Leave this classroom and remove its private lesson and assignment access?')) return;
    try { await leaveClassroomMutation.mutateAsync(classroomId); notify('You left the classroom.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Could not leave classroom.'); }
  };

  return (
    <section id="learning-hub" className="panel platform-hub section-anchor">
      <div className="section-title-row"><div className="section-title"><PixelIcon name="academy" /><div><small>Everything around your lessons</small><h2>Learning Hub</h2></div></div>{data.unreadNotifications > 0 && <button className="text-button" onClick={() => void markAllReadMutation.mutateAsync()}>Mark {data.unreadNotifications} read</button>}</div>
      <div className="invite-workflow">
        <form onSubmit={inspectInvite}><h3>Join a classroom</h3><div><input value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="Enter invitation code" required /><button className="secondary-button">Preview</button></div></form>
        {invite && <article className={`invite-preview ${invite.state}`}><span className={`status-pill ${invite.state}`}>{invite.state}</span><h3>{invite.classroomName}</h3><strong>{invite.teacherName}</strong><small>{invite.courseTitle}{invite.assignmentTitle ? ` · Assignment: ${invite.assignmentTitle}` : ''}</small>{invite.expiresAt && <small>Expires {new Date(invite.expiresAt).toLocaleString()}</small>}<button className="secondary-button" disabled={invite.state !== 'available'} onClick={() => void acceptInvite()}>{invite.approvalRequired ? 'Request access' : 'Join classroom'}</button></article>}
      </div>
      {!!data.invitationStates?.length && <div className="invitation-history"><h3>Invitation activity</h3>{data.invitationStates.map((item) => { const state = item.revokedAt ? 'revoked' : item.expiresAt && new Date(item.expiresAt) <= new Date() ? 'expired' : item.status; return <div className="hub-row" key={item.id}><strong>{item.classroomName}</strong><span className={`status-pill ${state}`}>{state}</span><small>{item.teacherName} · {item.courseTitle}</small></div>; })}</div>}
      <div className="hub-grid">
        <article><h3><PixelIcon name="magic" /> Notifications</h3>{data.notifications.slice(0, 5).map((item) => <div className={`hub-row ${item.readAt ? '' : 'unread'}`} key={item.id}><strong>{item.title}</strong><small>{item.body}</small></div>)}{!data.notifications.length && <Empty>No new notifications.</Empty>}</article>
        <article><h3><PixelIcon name="clock" /> Calendar</h3>{data.events.slice(0, 5).map((item) => <div className="hub-row" key={item.id}><strong>{item.title}</strong><small>{new Date(item.startsAt).toLocaleString()} {item.courseTitle ? `· ${item.courseTitle}` : ''}</small></div>)}{!data.events.length && <Empty>No upcoming events.</Empty>}</article>
        <article><h3><PixelIcon name="academy" /> Classrooms</h3>{data.classrooms.map((item) => <div className="hub-row" key={item.id}><strong>{item.name}</strong><small>{item.teacherName} · {item.courseTitle}</small><button className="text-button danger-text" onClick={() => void leave(item.id)}>Leave</button></div>)}{!data.classrooms.length && <Empty>Enter an invitation code to join a classroom.</Empty>}</article>
        <article><h3><PixelIcon name="trophy" /> Certificates</h3>{data.certificates?.map((item) => <a className="hub-row" href={`/api/certificates/${item.verificationCode}`} target="_blank" rel="noreferrer" key={item.id}><strong>{item.courseTitle}</strong><small>Issued {new Date(item.issuedAt).toLocaleDateString()} · {item.verificationCode}</small></a>)}{!data.certificates?.length && <Empty>Complete a course to earn a verified certificate.</Empty>}</article>
      </div>

      {!!data.catalog?.length && <div className="hub-block"><h3>Course catalog</h3><div className="catalog-strip">{data.catalog.map((course) => <article key={course.id}><span>{course.difficulty}</span><strong>{course.title}</strong><small>{course.teacherName} · {course.lessonCount} lessons</small><button disabled={course.enrolled || course.enrollmentMode !== 'self'} onClick={() => void enrollCourseMutation.mutateAsync(course.id).catch((error) => notify(error.message))}>{course.enrolled ? 'Enrolled' : course.enrollmentMode === 'self' ? 'Enroll' : 'Invite only'}</button></article>)}</div></div>}

      <div className="hub-forms">
        <form onSubmit={post}><h3>Course discussion</h3><select value={discussionCourse} onChange={(event) => setDiscussionCourse(event.target.value)}>{availableCourses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select><textarea rows={3} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask a question or help a classmate" required /><button className="secondary-button" disabled={!discussionCourse}>Post message</button></form>
        <form onSubmit={submit}><h3>Submit assignment work</h3><select value={submission.assignmentId} onChange={(event) => setSubmission({ ...submission, assignmentId: event.target.value })}><option value="">Choose an assignment</option>{assignments.filter((item) => item.status === 'assigned').map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select><textarea rows={3} value={submission.text} onChange={(event) => setSubmission({ ...submission, text: event.target.value })} placeholder="Write or paste your work" /><label className="file-field">Optional file<input type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadMutation.mutateAsync(file).then((attachmentUrl) => { setSubmission((current) => ({ ...current, attachmentUrl })); notify('File uploaded.'); }).catch((error) => notify(error.message)); }} /></label>{submission.attachmentUrl && <small className="success-text">File ready to submit</small>}<button className="secondary-button" disabled={!submission.assignmentId || (!submission.text && !submission.attachmentUrl)}>Submit to teacher</button></form>
      </div>
      {data.discussions.length > 0 && <div className="discussion-stream"><h3>Recent discussion</h3>{data.discussions.slice(0, 8).map((item) => <article key={item.id}><strong>{item.authorName}</strong><span>{item.courseTitle}</span><p>{item.body}</p><small>{new Date(item.createdAt).toLocaleString()}</small></article>)}</div>}
      {data.submissions.length > 0 && <div className="submission-strip"><h3>Your submissions</h3>{data.submissions.slice(0, 6).map((item) => <article key={item.id}><strong>{item.assignmentTitle}</strong><span className={`status-pill ${item.status}`}>{item.status}</span><small>{item.score == null ? 'Awaiting feedback' : `${item.score}/${item.maxScore} · ${item.feedback}`}</small></article>)}</div>}
      <AccountSecurity data={data} notify={notify} />
    </section>
  );
}

export function TeacherOperations({ courses, assignments, user, notify }: TeacherOperationsProps) {
  const platformQuery = usePlatformQuery();
  const createClassroomMutation = useCreateClassroomMutation();
  const createInvitationMutation = useCreateInvitationMutation();
  const createEventMutation = useCreateEventMutation();
  const createBankQuestionMutation = useCreateBankQuestionMutation();
  const gradeWorkMutation = useGradeWorkMutation();
  const resolveJoinRequestMutation = useResolveJoinRequestMutation();
  const removeStudentMutation = useRemoveClassroomStudentMutation();
  const revokeInvitationMutation = useRevokeInvitationMutation();
  const downloadReportMutation = useDownloadTeacherReportMutation();
  const data = platformQuery.data;
  const [classroom, setClassroom] = useState({ courseId: courses[0]?.id || '', name: '' });
  const [invitation, setInvitation] = useState({ classroomId: '', assignmentId: '', approvalRequired: true, usageLimit: '', expiresAt: '' });
  const [event, setEvent] = useState({ courseId: courses[0]?.id || '', title: '', startsAt: '' });
  const [bank, setBank] = useState({ prompt: '', answer: '', choices: '' });
  if (platformQuery.isError) return <div className="teacher-page"><section className="panel modal-loading"><PixelIcon name="close" /><p>{platformQuery.error instanceof Error ? platformQuery.error.message : 'Could not load operations.'}</p></section></div>;
  if (!data) return <div className="teacher-page"><section className="panel modal-loading"><PixelIcon name="sparkle" /><p>Loading classroom operations...</p></section></div>;
  const saveClassroom = async (e: FormEvent) => { e.preventDefault(); try { await createClassroomMutation.mutateAsync(classroom); setClassroom({ ...classroom, name: '' }); notify('Classroom created.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not create classroom.'); } };
  const saveInvitation = async (e: FormEvent) => { e.preventDefault(); try { await createInvitationMutation.mutateAsync({ classroomId: invitation.classroomId, payload: { assignmentId: invitation.assignmentId || undefined, approvalRequired: invitation.approvalRequired, usageLimit: invitation.usageLimit ? Number(invitation.usageLimit) : null, expiresAt: invitation.expiresAt ? new Date(invitation.expiresAt).toISOString() : null } }); setInvitation({ ...invitation, assignmentId: '', usageLimit: '', expiresAt: '' }); notify('Invitation created.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not create invitation.'); } };
  const saveEvent = async (e: FormEvent) => { e.preventDefault(); try { await createEventMutation.mutateAsync({ ...event, startsAt: new Date(event.startsAt).toISOString() }); setEvent({ ...event, title: '', startsAt: '' }); notify('Event scheduled and learners notified.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not schedule event.'); } };
  const saveBank = async (e: FormEvent) => { e.preventDefault(); try { await createBankQuestionMutation.mutateAsync({ prompt: bank.prompt, type: bank.choices ? 'multiple_choice' : 'fill_blank', choices: bank.choices.split(',').map((item) => item.trim()).filter(Boolean), answer: bank.choices ? Number(bank.answer) : bank.answer }); setBank({ prompt: '', answer: '', choices: '' }); notify('Question saved to the bank.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not save question.'); } };
  const grade = async (submissionId: string, maxScore: number) => { const score = window.prompt(`Score out of ${maxScore}`); if (score == null) return; const feedback = window.prompt('Feedback for the learner') || ''; try { await gradeWorkMutation.mutateAsync({ submissionId, score: Number(score), feedback }); notify('Submission graded.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not grade submission.'); } };
  const decideRequest = async (requestId: string, status: 'accepted' | 'rejected') => { try { await resolveJoinRequestMutation.mutateAsync({ requestId, status }); notify(`Request ${status}.`); } catch (error) { notify(error instanceof Error ? error.message : 'Could not resolve request.'); } };
  const removeStudent = async (classroomId: string, studentId: string) => { if (!window.confirm('Remove this student and revoke classroom access?')) return; try { await removeStudentMutation.mutateAsync({ classroomId, studentId }); notify('Student removed.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not remove student.'); } };
  const revoke = async (invitationId: string) => { try { await revokeInvitationMutation.mutateAsync(invitationId); notify('Invitation revoked.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not revoke invitation.'); } };
  const copyInvite = async (code: string) => { const link = `${window.location.origin}/student/learning-hub?invite=${code}`; try { await navigator.clipboard.writeText(link); notify('Invitation link copied.'); } catch { window.prompt('Copy invitation link', link); } };

  return (
    <div className="teacher-page operations-page">
      <div className="page-heading"><div><span className="overline">Live learning operations</span><h1>Classes, grading & community</h1><p>Manage rosters, learner work, calendar events, reusable questions, notifications, and reports.</p></div><button className="primary-button" disabled={downloadReportMutation.isPending} onClick={() => void downloadReportMutation.mutateAsync().catch((error) => notify(error.message))}><PixelIcon name="scroll" /> {downloadReportMutation.isPending ? 'Preparing report...' : 'Export CSV report'}</button></div>
      <div className="operations-forms">
        <form className="panel" onSubmit={saveClassroom}><h2>Create classroom</h2><select value={classroom.courseId} onChange={(e) => setClassroom({ ...classroom, courseId: e.target.value })}>{courses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select><input value={classroom.name} onChange={(e) => setClassroom({ ...classroom, name: e.target.value })} placeholder="Classroom name" required /><button className="secondary-button">Create</button></form>
        <form className="panel" onSubmit={saveInvitation}><h2>Create invitation</h2><select value={invitation.classroomId} onChange={(e) => setInvitation({ ...invitation, classroomId: e.target.value, assignmentId: '' })} required><option value="">Choose classroom</option>{data.classrooms.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><select value={invitation.assignmentId} onChange={(e) => setInvitation({ ...invitation, assignmentId: e.target.value })}><option value="">Whole classroom</option>{assignments.filter((item) => item.courseId === data.classrooms.find((room) => room.id === invitation.classroomId)?.courseId).map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select><label className="check-row"><input type="checkbox" checked={invitation.approvalRequired} onChange={(e) => setInvitation({ ...invitation, approvalRequired: e.target.checked })} /> Require teacher approval</label><input type="number" min="1" value={invitation.usageLimit} onChange={(e) => setInvitation({ ...invitation, usageLimit: e.target.value })} placeholder="Usage limit (optional)" /><input type="datetime-local" value={invitation.expiresAt} onChange={(e) => setInvitation({ ...invitation, expiresAt: e.target.value })} /><button className="secondary-button">Generate invite</button></form>
        <form className="panel" onSubmit={saveEvent}><h2>Schedule event</h2><select value={event.courseId} onChange={(e) => setEvent({ ...event, courseId: e.target.value })}>{courses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select><input value={event.title} onChange={(e) => setEvent({ ...event, title: e.target.value })} placeholder="Event title" required /><input type="datetime-local" value={event.startsAt} onChange={(e) => setEvent({ ...event, startsAt: e.target.value })} required /><button className="secondary-button">Schedule</button></form>
        <form className="panel" onSubmit={saveBank}><h2>Question bank</h2><input value={bank.prompt} onChange={(e) => setBank({ ...bank, prompt: e.target.value })} placeholder="Question prompt" required /><input value={bank.choices} onChange={(e) => setBank({ ...bank, choices: e.target.value })} placeholder="Choices, comma separated (optional)" /><input value={bank.answer} onChange={(e) => setBank({ ...bank, answer: e.target.value })} placeholder={bank.choices ? 'Correct choice index (0 first)' : 'Correct answer'} required /><button className="secondary-button">Save question</button></form>
      </div>
      <section className="panel"><div className="section-title-row"><div className="section-title"><PixelIcon name="academy" /><div><small>Rosters & controlled access</small><h2>Classrooms</h2></div></div></div><div className="classroom-grid">{data.classrooms.map((item) => <article key={item.id}><strong>{item.name}</strong><small>{item.courseTitle} · {item.studentCount} learners</small>{data.rosters?.find((roster) => roster.classroomId === item.id)?.students.map((student) => <div className="roster-person" key={student.id}><span><strong>{student.name}</strong><small>{student.email}</small></span><button className="danger-button" onClick={() => void removeStudent(item.id, student.id)}>Remove</button></div>)}</article>)}{!data.classrooms.length && <Empty>Create a classroom to organize a course roster.</Empty>}</div></section>
      <section className="panel invitation-admin"><div className="section-title-row"><div className="section-title"><PixelIcon name="lock" /><div><small>Pending approvals</small><h2>Join requests</h2></div></div><span className="section-hint">{data.joinRequests?.filter((item) => item.status === 'pending').length || 0} pending</span></div>{data.joinRequests?.filter((item) => item.status === 'pending').map((item) => <article key={item.id}><span><strong>{item.studentName}</strong><small>{item.studentEmail} · {item.classroomName}{item.assignmentTitle ? ` · ${item.assignmentTitle}` : ''}</small></span><div><button onClick={() => void decideRequest(item.id, 'accepted')}>Approve</button><button className="danger-button" onClick={() => void decideRequest(item.id, 'rejected')}>Reject</button></div></article>)}{!data.joinRequests?.some((item) => item.status === 'pending') && <Empty>No pending join requests.</Empty>}</section>
      <section className="panel invitation-admin"><div className="section-title-row"><div className="section-title"><PixelIcon name="magic" /><div><small>Codes, links & limits</small><h2>Invitations</h2></div></div></div>{data.invitations?.map((item) => { const inactive = Boolean(item.revokedAt || (item.expiresAt && new Date(item.expiresAt) <= new Date()) || (item.usageLimit != null && item.usesCount >= item.usageLimit)); return <article key={item.id}><span><code>{item.code}</code><strong>{item.classroomName}</strong><small>{item.assignmentTitle || 'Whole classroom'} · {item.approvalRequired ? 'Approval required' : 'Instant join'} · {item.usesCount}/{item.usageLimit ?? '∞'} uses{item.expiresAt ? ` · expires ${new Date(item.expiresAt).toLocaleString()}` : ''}</small></span><div><button disabled={inactive} onClick={() => void copyInvite(item.code)}>Copy link</button><button className="danger-button" disabled={Boolean(item.revokedAt)} onClick={() => void revoke(item.id)}>{item.revokedAt ? 'Revoked' : 'Revoke'}</button></div></article>; })}{!data.invitations?.length && <Empty>No invitations yet.</Empty>}</section>
      <section className="panel"><div className="section-title-row"><div className="section-title"><PixelIcon name="scroll" /><div><small>Manual feedback & rubric-ready records</small><h2>Submission inbox</h2></div></div><span className="section-hint">{data.submissions.filter((item) => item.status !== 'graded').length} to grade</span></div><div className="grading-list">{data.submissions.map((item) => <article key={item.id}><div><strong>{item.studentName} · {item.assignmentTitle}</strong><small>{item.courseTitle} · attempt {item.attemptNumber} · {new Date(item.submittedAt).toLocaleString()}</small><p>{item.textContent || 'Attachment submission'}</p></div><span>{item.score == null ? 'Pending' : `${item.score}/${item.maxScore}`}</span><button onClick={() => void grade(item.id, item.maxScore)}>{item.status === 'graded' ? 'Regrade' : 'Grade'}</button></article>)}{!data.submissions.length && <Empty>Learner submissions will arrive here.</Empty>}</div></section>
      <div className="hub-grid teacher-hub-grid"><article><h3>Upcoming events</h3>{data.events.slice(0, 8).map((item) => <div className="hub-row" key={item.id}><strong>{item.title}</strong><small>{new Date(item.startsAt).toLocaleString()}</small></div>)}</article><article><h3>Recent discussion</h3>{data.discussions.slice(0, 8).map((item) => <div className="hub-row" key={item.id}><strong>{item.authorName}</strong><small>{item.body}</small></div>)}</article><article><h3>Reusable questions</h3>{data.questionBank?.slice(0, 8).map((item) => <div className="hub-row" key={item.id}><strong>{item.prompt}</strong><small>{item.type} · {item.tags.join(', ') || 'untagged'}</small></div>)}</article></div>
      {user.isAdmin && <AdminConsole notify={notify} />}
      <AccountSecurity data={data} notify={notify} />
    </div>
  );
}

function AdminConsole({ notify }: { notify: (message: string) => void }) {
  const adminQuery = useAdminQuery();
  const setAdminMutation = useSetAdminMutation();
  const data = adminQuery.data;
  useEffect(() => {
    if (adminQuery.error) notify(adminQuery.error instanceof Error ? adminQuery.error.message : 'Could not load admin data.');
  }, [adminQuery.error, notify]);
  if (!data) return null;
  return <section className="panel admin-console"><div className="section-title-row"><div className="section-title"><PixelIcon name="lock" /><div><small>Administrator controls</small><h2>Platform governance</h2></div></div></div><div className="admin-stats">{Object.entries(data.summary).map(([label, value]) => <article key={label}><strong>{value}</strong><small>{label}</small></article>)}</div><div className="admin-columns"><div><h3>Users</h3>{data.users.map((item) => <div className="hub-row" key={item.id}><strong>{item.name} <small>({item.role})</small></strong><span>{item.email}</span><button disabled={item.isAdmin || setAdminMutation.isPending} onClick={() => void setAdminMutation.mutateAsync({ userId: item.id, isAdmin: true }).catch((error) => notify(error.message))}>{item.isAdmin ? 'Admin' : 'Make admin'}</button></div>)}</div><div><h3>Audit trail</h3>{data.logs.slice(0, 20).map((item) => <div className="hub-row" key={item.id}><strong>{item.action} · {item.entityType}</strong><small>{item.actorName || 'System'} · {new Date(item.createdAt).toLocaleString()}</small></div>)}</div></div></section>;
}
