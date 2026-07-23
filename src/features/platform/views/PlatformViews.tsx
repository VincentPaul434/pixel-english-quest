import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PixelIcon } from '../../../shared-components/PixelIcon';
import { ModalFrame } from '../../../shared-components/ModalFrame';
import {
  useAddClassroomStudentByEmailMutation, useConfirmVerificationMutation, useCreateBankQuestionMutation, useCreateClassroomMutation, useCreateEventMutation, useDeleteBankQuestionMutation,
  useCreateInvitationMutation, useDisableMfaMutation, useDownloadTeacherReportMutation, useEnableMfaMutation,
  useEnrollCourseMutation, useGradeWorkMutation, useJoinClassroomMutation, useLeaveClassroomMutation,
  useMarkAllReadMutation, useMarkAttendanceMutation, useMarkNotificationReadMutation, usePostDiscussionMutation, useRemoveClassroomStudentMutation, useRemoveClassroomStudentsMutation,
  useRegenerateMfaRecoveryCodesMutation, useRequestVerificationMutation, useResolveJoinRequestMutation, useRevokeInvitationMutation,
  useSetAccountStatusMutation, useSetAdminMutation, useSetUserRoleMutation, useSetupMfaMutation, useSubmitWorkMutation, useUpdateBankQuestionMutation, useUpdateNotificationPreferencesMutation, useUploadAssetMutation
} from '../../../hooks/mutations/platformMutations';
import { useAdminQuery, useInvitationQuery, usePlatformQuery } from '../../../hooks/queries/platformQueries';
import { MAX_UPLOAD_BYTES, UPLOAD_ACCEPT } from '../models/api';
import type { CalendarEvent, PlatformData, StudentLearningHubProps, TeacherOperationsProps } from '../models/types';

function Empty({ children }: { children: string }) {
  return <p className="hub-empty">{children}</p>;
}

const notificationPreferenceLabels: Record<string, string> = {
  announcement: 'Announcements', assignment: 'Assignments', calendar: 'Calendar events', certificate: 'Certificates',
  classroom: 'Classroom membership', discussion: 'Discussions', enrollment: 'Enrollment', grade: 'Grades and feedback',
  join_request: 'Join requests', submission: 'Submissions'
};

function notificationHref(link: string | null, type: string, role: 'student' | 'teacher') {
  if (link?.startsWith('/certificates/')) return link;
  if (role === 'teacher') {
    if (['assignment', 'grade', 'submission'].includes(type)) return '/teacher/assignments';
    if (['course', 'enrollment'].includes(type)) return '/teacher/courses';
    return '/teacher/operations';
  }
  if (['assignment', 'grade', 'submission'].includes(type)) return '/student/assignments';
  if (['course', 'enrollment'].includes(type)) return '/student/courses';
  return '/student/learning-hub';
}

function NotificationsPanel({ data, notify }: { data: PlatformData; notify: (message: string) => void }) {
  const markOneMutation = useMarkNotificationReadMutation();
  const updatePreferencesMutation = useUpdateNotificationPreferencesMutation();
  const updatePreference = async (key: string, enabled: boolean) => {
    try {
      await updatePreferencesMutation.mutateAsync({ ...data.notificationPreferences, [key]: enabled });
      notify('Notification preferences updated.');
    } catch (reason) { notify(reason instanceof Error ? reason.message : 'Could not update notification preferences.'); }
  };
  return <article className="notification-panel"><h3><PixelIcon name="magic" /> Notifications</h3>{data.notifications.slice(0, 5).map((item) => <div className={`hub-row notification-row ${item.readAt ? '' : 'unread'}`} key={item.id}><a href={notificationHref(item.link, item.type, data.profile.role)} onClick={() => { if (!item.readAt) void markOneMutation.mutateAsync(item.id); }}><strong>{item.title}</strong><small>{item.body}</small></a>{!item.readAt && <button className="text-button" onClick={() => void markOneMutation.mutateAsync(item.id).catch((error) => notify(error.message))}>Mark read</button>}</div>)}{!data.notifications.length && <Empty>No new notifications.</Empty>}<details className="notification-preferences"><summary>Notification preferences</summary>{Object.entries(notificationPreferenceLabels).map(([key, label]) => <label className="check-row" key={key}><input type="checkbox" checked={data.notificationPreferences[key] !== false} disabled={updatePreferencesMutation.isPending} onChange={(event) => void updatePreference(key, event.target.checked)} /> {label}</label>)}</details></article>;
}

function CalendarEventDialog({ event, students = [], marking = false, onClose, onMark }: { event: CalendarEvent; students?: Array<{ id: string; name: string; email: string }>; marking?: boolean; onClose: () => void; onMark?: (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => void }) {
  const attendance = new Map(event.attendance?.map((item) => [item.studentId, item]) || []);
  return <ModalFrame label={`${event.title} event details`} onClose={onClose} wide><div className="modal-heading compact"><span><PixelIcon name="clock" /></span><div><small>{event.eventType} · {event.classroomName || event.courseTitle || 'Academy event'}</small><h2>{event.title}</h2><p>{new Date(event.startsAt).toLocaleString()}{event.endsAt ? ` – ${new Date(event.endsAt).toLocaleString()}` : ''}</p></div></div>{event.description && <p className="event-description">{event.description}</p>}{onMark && <section className="attendance-manager"><h3>Attendance</h3>{students.map((student) => <label className="attendance-row" key={student.id}><span><strong>{student.name}</strong><small>{student.email}</small></span><select value={attendance.get(student.id)?.status || ''} disabled={marking} onChange={(change) => { if (change.target.value) onMark(student.id, change.target.value as 'present' | 'absent' | 'late' | 'excused'); }}><option value="">Not marked</option><option value="present">Present</option><option value="late">Late</option><option value="absent">Absent</option><option value="excused">Excused</option></select></label>)}{!students.length && <Empty>No learners are enrolled in this event scope.</Empty>}</section>}</ModalFrame>;
}

function DiscussionThreads({ data, courses, notify, composer = false }: { data: PlatformData; courses: Array<{ id: string; title: string }>; notify: (message: string) => void; composer?: boolean }) {
  const postMutation = usePostDiscussionMutation();
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const submitMessage = async (event: FormEvent) => { event.preventDefault(); try { await postMutation.mutateAsync({ courseId, body: message }); setMessage(''); notify('Discussion posted.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not post discussion.'); } };
  const submitReply = async (event: FormEvent, parentId: string, parentCourseId: string) => { event.preventDefault(); try { await postMutation.mutateAsync({ courseId: parentCourseId, body: replyBody, parentId }); setReplyTo(''); setReplyBody(''); notify('Reply posted.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not post reply.'); } };
  const roots = data.discussions.filter((item) => !item.parentId);
  return <section className="discussion-thread-panel"><div className="section-title-row"><div className="section-title"><PixelIcon name="scroll" /><div><small>Course community</small><h3>Discussion threads</h3></div></div></div>{composer && <form className="discussion-composer" onSubmit={submitMessage}><select value={courseId} onChange={(event) => setCourseId(event.target.value)}>{courses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select><textarea rows={2} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Start a discussion" required /><button className="secondary-button" disabled={!courseId || postMutation.isPending}>Post</button></form>}<div className="discussion-stream">{roots.slice(0, 12).map((item) => <article key={item.id}><strong>{item.authorName}</strong><span>{item.courseTitle}</span><p>{item.body}</p><small>{new Date(item.createdAt).toLocaleString()}</small><button className="text-button" onClick={() => { setReplyTo(replyTo === item.id ? '' : item.id); setReplyBody(''); }}>Reply</button>{data.discussions.filter((reply) => reply.parentId === item.id).map((reply) => <div className="discussion-reply" key={reply.id}><strong>{reply.authorName}</strong><p>{reply.body}</p><small>{new Date(reply.createdAt).toLocaleString()}</small></div>)}{replyTo === item.id && <form className="discussion-reply-form" onSubmit={(event) => void submitReply(event, item.id, item.courseId)}><textarea data-autofocus rows={2} value={replyBody} onChange={(event) => setReplyBody(event.target.value)} placeholder={`Reply to ${item.authorName}`} required /><button className="secondary-button" disabled={postMutation.isPending}>Post reply</button></form>}</article>)}{!roots.length && <Empty>No discussions yet.</Empty>}</div></section>;
}

function AccountSecurity({ data, notify }: { data: PlatformData; notify: (message: string) => void }) {
  const requestVerificationMutation = useRequestVerificationMutation();
  const confirmVerificationMutation = useConfirmVerificationMutation();
  const setupMfaMutation = useSetupMfaMutation();
  const enableMfaMutation = useEnableMfaMutation();
  const disableMfaMutation = useDisableMfaMutation();
  const regenerateCodesMutation = useRegenerateMfaRecoveryCodesMutation();
  const [dialog, setDialog] = useState<'setup' | 'manage' | null>(null);
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const verifyEmail = async () => {
    try {
      const result = await requestVerificationMutation.mutateAsync();
      if (result.alreadyVerified) return notify('Your email is already verified.');
      if (result.developmentToken) await confirmVerificationMutation.mutateAsync(result.developmentToken);
      notify(result.developmentToken ? 'Email verified in development mode.' : 'Verification instructions were sent to your email.');
    } catch (error) { notify(error instanceof Error ? error.message : 'Could not start verification.'); }
  };
  const openMfa = async () => {
    setError('');
    setPassword('');
    setRecoveryCodes([]);
    if (data.profile.mfaEnabled) {
      setDialog('manage');
      return;
    }
    setDialog('setup');
    setSetup(null);
    try {
      setSetup(await setupMfaMutation.mutateAsync());
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not start MFA setup.'); }
  };
  const enableMfa = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const result = await enableMfaMutation.mutateAsync(code);
      setRecoveryCodes(result.recoveryCodes);
      notify('Authenticator MFA enabled. Save your recovery codes now.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not enable MFA.'); }
  };
  const regenerateCodes = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const result = await regenerateCodesMutation.mutateAsync(password);
      setRecoveryCodes(result.recoveryCodes);
      setPassword('');
      notify('New recovery codes generated. Previous codes no longer work.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not replace recovery codes.'); }
  };
  const disableMfa = async () => {
    setError('');
    try {
      await disableMfaMutation.mutateAsync(password);
      setDialog(null);
      setPassword('');
      notify('Authenticator MFA disabled.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not disable MFA.'); }
  };
  const copyRecoveryCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      notify('Recovery codes copied.');
    } catch { setError('Copy failed. Select and save the codes manually.'); }
  };
  return (
    <>
      <div className="security-bar"><span><PixelIcon name="lock" /><strong>Account security</strong><small>{data.profile.emailVerified ? 'Email verified' : 'Email verification pending'} · {data.profile.mfaEnabled ? 'MFA enabled' : 'MFA optional'}</small></span>{!data.profile.emailVerified && <button disabled={requestVerificationMutation.isPending} onClick={() => void verifyEmail()}>{requestVerificationMutation.isPending ? 'Sending...' : 'Verify email'}</button>}<button onClick={() => void openMfa()}>{data.profile.mfaEnabled ? 'Manage MFA' : 'Set up MFA'}</button></div>
      {dialog && <ModalFrame label={dialog === 'setup' ? 'Set up authenticator MFA' : 'Manage authenticator MFA'} onClose={() => setDialog(null)}>
        <div className="modal-heading compact"><span><PixelIcon name="lock" /></span><div><small>Account security</small><h2>{dialog === 'setup' ? 'Set up authenticator MFA' : 'Manage authenticator MFA'}</h2><p>{dialog === 'setup' ? 'Scan the QR code, then confirm a current code.' : 'Replace recovery codes or disable MFA securely.'}</p></div></div>
        {error && <div className="form-error" role="alert">{error}</div>}
        {recoveryCodes.length > 0 ? <div className="recovery-code-panel"><h3>Save these one-time recovery codes</h3><p>Each code works once. Store them somewhere safe; they will not be shown again.</p><div className="recovery-code-grid">{recoveryCodes.map((item) => <code key={item}>{item}</code>)}</div><div className="modal-actions"><button className="secondary-button" onClick={() => void copyRecoveryCodes()}>Copy all codes</button><button className="primary-button" onClick={() => setDialog(null)}>I saved them</button></div></div> : dialog === 'setup' ? (
          setup ? <form className="mfa-form" onSubmit={enableMfa}>
            <div className="mfa-qr"><QRCodeSVG value={setup.otpauthUrl} size={184} level="M" title="Authenticator setup QR code" /></div>
            <p>Scan with Google Authenticator, Microsoft Authenticator, 1Password, or another TOTP app.</p>
            <details><summary>Cannot scan the code?</summary><code className="mfa-secret">{setup.secret}</code></details>
            <label>Six-digit authenticator code<input data-autofocus value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required placeholder="123456" /></label>
            <button className="primary-button" disabled={enableMfaMutation.isPending || code.length !== 6}>{enableMfaMutation.isPending ? 'Checking...' : 'Enable MFA'}</button>
          </form> : <div className="modal-loading" role="status"><PixelIcon className="loading-rune" name="sparkle" /><p>Preparing your secure QR code...</p></div>
        ) : (
          <form className="mfa-form" onSubmit={regenerateCodes}>
            <label>Confirm your password<input data-autofocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
            <p>Generating new recovery codes immediately invalidates every previous recovery code.</p>
            <div className="modal-actions"><button className="secondary-button" disabled={!password || regenerateCodesMutation.isPending}>{regenerateCodesMutation.isPending ? 'Generating...' : 'Replace recovery codes'}</button><button type="button" className="danger-button" disabled={!password || disableMfaMutation.isPending} onClick={() => void disableMfa()}>{disableMfaMutation.isPending ? 'Disabling...' : 'Disable MFA'}</button></div>
          </form>
        )}
      </ModalFrame>}
    </>
  );
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
  const [uploadDetails, setUploadDetails] = useState<{ name: string; size: number; type: string; previewUrl: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadController, setUploadController] = useState<AbortController | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [inviteCode, setInviteCode] = useState(() => new URLSearchParams(window.location.search).get('invite') || '');
  const [previewCode, setPreviewCode] = useState(inviteCode);
  const invitationQuery = useInvitationQuery(previewCode, Boolean(previewCode));
  const invite = invitationQuery.data ?? null;
  useEffect(() => {
    if (invitationQuery.error) notify(invitationQuery.error instanceof Error ? invitationQuery.error.message : 'Could not open invitation.');
  }, [invitationQuery.error, notify]);
  useEffect(() => () => {
    if (uploadDetails?.previewUrl) URL.revokeObjectURL(uploadDetails.previewUrl);
  }, [uploadDetails?.previewUrl]);
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
    try { await submitWorkMutation.mutateAsync({ assignmentId: submission.assignmentId, textContent: submission.text, attachmentUrl: submission.attachmentUrl }); setSubmission({ ...submission, text: '', attachmentUrl: '' }); setUploadDetails(null); setUploadProgress(0); notify('Work submitted to your teacher.'); }
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
  const chooseAttachment = async (file: File) => {
    setUploadError('');
    setUploadProgress(0);
    setSubmission((current) => ({ ...current, attachmentUrl: '' }));
    if (!file.size || file.size > MAX_UPLOAD_BYTES) {
      setUploadDetails(null);
      setUploadError('Choose a file between 1 byte and 10 MB.');
      return;
    }
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
    setUploadDetails({ name: file.name, size: file.size, type: file.type, previewUrl });
    const controller = new AbortController();
    setUploadController(controller);
    try {
      const attachmentUrl = await uploadMutation.mutateAsync({ file, signal: controller.signal, onProgress: setUploadProgress });
      setSubmission((current) => ({ ...current, attachmentUrl }));
      notify('File uploaded and ready to submit.');
    } catch (reason) {
      const message = reason instanceof DOMException && reason.name === 'AbortError' ? 'Upload cancelled.' : reason instanceof Error ? reason.message : 'Could not upload the file.';
      setUploadError(message);
      setSubmission((current) => ({ ...current, attachmentUrl: '' }));
    } finally { setUploadController(null); }
  };
  const removeAttachment = () => {
    uploadController?.abort();
    setUploadDetails(null);
    setUploadProgress(0);
    setUploadError('');
    setSubmission((current) => ({ ...current, attachmentUrl: '' }));
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
        <NotificationsPanel data={data} notify={notify} />
        <article><h3><PixelIcon name="clock" /> Calendar</h3>{data.events.slice(0, 5).map((item) => <button type="button" className="hub-row calendar-event-button" key={item.id} onClick={() => setSelectedEvent(item)}><strong>{item.title}</strong><small>{new Date(item.startsAt).toLocaleString()} {item.classroomName || item.courseTitle ? `· ${item.classroomName || item.courseTitle}` : ''}</small></button>)}{!data.events.length && <Empty>No upcoming events.</Empty>}</article>
        <article><h3><PixelIcon name="academy" /> Classrooms</h3>{data.classrooms.map((item) => <div className="hub-row" key={item.id}><strong>{item.name}</strong><small>{item.teacherName} · {item.courseTitle}</small><button className="text-button danger-text" onClick={() => void leave(item.id)}>Leave</button></div>)}{!data.classrooms.length && <Empty>Enter an invitation code to join a classroom.</Empty>}</article>
        <article><h3><PixelIcon name="trophy" /> Certificates</h3>{data.certificates?.map((item) => <a className="hub-row" href={`/certificates/${encodeURIComponent(item.verificationCode)}`} target="_blank" rel="noreferrer" key={item.id}><strong>{item.courseTitle}</strong><small>Issued {new Date(item.issuedAt).toLocaleDateString()} · {item.verificationCode}</small></a>)}{!data.certificates?.length && <Empty>Complete a course to earn a verified certificate.</Empty>}</article>
      </div>

      {!!data.catalog?.length && <div className="hub-block"><h3>Course catalog</h3><div className="catalog-strip">{data.catalog.map((course) => <article key={course.id}><span>{course.difficulty}</span><strong>{course.title}</strong><small>{course.teacherName} · {course.lessonCount} lessons</small><button disabled={course.enrolled || course.enrollmentMode !== 'self'} onClick={() => void enrollCourseMutation.mutateAsync(course.id).catch((error) => notify(error.message))}>{course.enrolled ? 'Enrolled' : course.enrollmentMode === 'self' ? 'Enroll' : 'Invite only'}</button></article>)}</div></div>}

      <div className="hub-forms">
        <form onSubmit={post}><h3>Course discussion</h3><select value={discussionCourse} onChange={(event) => setDiscussionCourse(event.target.value)}>{availableCourses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select><textarea rows={3} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask a question or help a classmate" required /><button className="secondary-button" disabled={!discussionCourse}>Post message</button></form>
        <form onSubmit={submit}><h3>Submit assignment work</h3><select value={submission.assignmentId} onChange={(event) => setSubmission({ ...submission, assignmentId: event.target.value })}><option value="">Choose an assignment</option>{assignments.filter((item) => item.status === 'assigned').map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select><textarea rows={3} value={submission.text} onChange={(event) => setSubmission({ ...submission, text: event.target.value })} placeholder="Write or paste your work" /><label className="file-field">Optional file <small>Images, PDF, text, or Office documents up to 10 MB.</small><input type="file" accept={UPLOAD_ACCEPT} disabled={uploadMutation.isPending} onChange={(event) => { const file = event.target.files?.[0]; if (file) void chooseAttachment(file); event.target.value = ''; }} /></label>{uploadDetails && <div className="upload-preview">{uploadDetails.previewUrl && <img src={uploadDetails.previewUrl} alt={`Preview of ${uploadDetails.name}`} />}<span><strong>{uploadDetails.name}</strong><small>{(uploadDetails.size / 1024 / 1024).toFixed(2)} MB</small></span><button type="button" className="text-button danger-text" onClick={removeAttachment}>{uploadMutation.isPending ? 'Cancel' : 'Remove'}</button>{uploadMutation.isPending && <progress max={100} value={uploadProgress} aria-label={`Uploading ${uploadDetails.name}`}>{uploadProgress}%</progress>}</div>}{uploadError && <small className="form-error" role="alert">{uploadError}</small>}{submission.attachmentUrl && <small className="success-text">File uploaded and ready to submit.</small>}<button className="secondary-button" disabled={uploadMutation.isPending || !submission.assignmentId || (!submission.text && !submission.attachmentUrl)}>Submit to teacher</button></form>
      </div>
      <DiscussionThreads data={data} courses={availableCourses} notify={notify} />
      {data.submissions.length > 0 && <div className="submission-strip"><h3>Your submissions</h3>{data.submissions.slice(0, 6).map((item) => <article key={item.id}><strong>{item.assignmentTitle}</strong><span className={`status-pill ${item.status}`}>{item.status}</span><small>{item.score == null ? 'Awaiting feedback' : `${item.score}/${item.maxScore} · ${item.feedback}`}</small></article>)}</div>}
      <AccountSecurity data={data} notify={notify} />
      {selectedEvent && <CalendarEventDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </section>
  );
}

export function TeacherOperations({ courses, students, assignments, user, notify }: TeacherOperationsProps) {
  const platformQuery = usePlatformQuery();
  const createClassroomMutation = useCreateClassroomMutation();
  const createInvitationMutation = useCreateInvitationMutation();
  const createEventMutation = useCreateEventMutation();
  const markAttendanceMutation = useMarkAttendanceMutation();
  const createBankQuestionMutation = useCreateBankQuestionMutation();
  const updateBankQuestionMutation = useUpdateBankQuestionMutation();
  const deleteBankQuestionMutation = useDeleteBankQuestionMutation();
  const gradeWorkMutation = useGradeWorkMutation();
  const resolveJoinRequestMutation = useResolveJoinRequestMutation();
  const removeStudentMutation = useRemoveClassroomStudentMutation();
  const addStudentMutation = useAddClassroomStudentByEmailMutation();
  const removeStudentsMutation = useRemoveClassroomStudentsMutation();
  const revokeInvitationMutation = useRevokeInvitationMutation();
  const downloadReportMutation = useDownloadTeacherReportMutation();
  const data = platformQuery.data;
  const [classroom, setClassroom] = useState({ courseId: courses[0]?.id || '', name: '' });
  const [invitation, setInvitation] = useState({ classroomId: '', assignmentId: '', approvalRequired: true, usageLimit: '', expiresAt: '' });
  const [event, setEvent] = useState({ courseId: courses[0]?.id || '', classroomId: '', title: '', description: '', startsAt: '', endsAt: '' });
  const [bank, setBank] = useState({ prompt: '', answer: '', choices: '', explanation: '', tags: '' });
  const [editingBankId, setEditingBankId] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [bankType, setBankType] = useState('all');
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterEmails, setRosterEmails] = useState<Record<string, string>>({});
  const [selectedStudents, setSelectedStudents] = useState<Record<string, string[]>>({});
  const [selectedEventId, setSelectedEventId] = useState('');
  const [reportFilters, setReportFilters] = useState({ courseId: '', from: '', to: '' });
  if (platformQuery.isError) return <div className="teacher-page"><section className="panel modal-loading"><PixelIcon name="close" /><p>{platformQuery.error instanceof Error ? platformQuery.error.message : 'Could not load operations.'}</p></section></div>;
  if (!data) return <div className="teacher-page"><section className="panel modal-loading"><PixelIcon name="sparkle" /><p>Loading classroom operations...</p></section></div>;
  const saveClassroom = async (e: FormEvent) => { e.preventDefault(); try { await createClassroomMutation.mutateAsync(classroom); setClassroom({ ...classroom, name: '' }); notify('Classroom created.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not create classroom.'); } };
  const saveInvitation = async (e: FormEvent) => { e.preventDefault(); try { await createInvitationMutation.mutateAsync({ classroomId: invitation.classroomId, payload: { assignmentId: invitation.assignmentId || undefined, approvalRequired: invitation.approvalRequired, usageLimit: invitation.usageLimit ? Number(invitation.usageLimit) : null, expiresAt: invitation.expiresAt ? new Date(invitation.expiresAt).toISOString() : null } }); setInvitation({ ...invitation, assignmentId: '', usageLimit: '', expiresAt: '' }); notify('Invitation created.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not create invitation.'); } };
  const saveEvent = async (e: FormEvent) => { e.preventDefault(); try { await createEventMutation.mutateAsync({ ...event, classroomId: event.classroomId || undefined, startsAt: new Date(event.startsAt).toISOString(), endsAt: event.endsAt ? new Date(event.endsAt).toISOString() : undefined }); setEvent({ ...event, title: '', description: '', startsAt: '', endsAt: '' }); notify('Event scheduled and learners notified.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not schedule event.'); } };
  const saveBank = async (e: FormEvent) => { e.preventDefault(); const payload = { prompt: bank.prompt, type: bank.choices ? 'multiple_choice' : 'fill_blank', choices: bank.choices.split(',').map((item) => item.trim()).filter(Boolean), answer: bank.choices ? Number(bank.answer) : bank.answer, explanation: bank.explanation, tags: bank.tags.split(',').map((item) => item.trim()).filter(Boolean) }; try { if (editingBankId) await updateBankQuestionMutation.mutateAsync({ questionId: editingBankId, payload }); else await createBankQuestionMutation.mutateAsync(payload); setBank({ prompt: '', answer: '', choices: '', explanation: '', tags: '' }); setEditingBankId(''); notify(editingBankId ? 'Question updated.' : 'Question saved to the bank.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not save question.'); } };
  const grade = async (submissionId: string, maxScore: number) => { const score = window.prompt(`Score out of ${maxScore}`); if (score == null) return; const feedback = window.prompt('Feedback for the learner') || ''; try { await gradeWorkMutation.mutateAsync({ submissionId, score: Number(score), feedback }); notify('Submission graded.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not grade submission.'); } };
  const decideRequest = async (requestId: string, status: 'accepted' | 'rejected') => { try { await resolveJoinRequestMutation.mutateAsync({ requestId, status }); notify(`Request ${status}.`); } catch (error) { notify(error instanceof Error ? error.message : 'Could not resolve request.'); } };
  const removeStudent = async (classroomId: string, studentId: string) => { if (!window.confirm('Remove this student and revoke classroom access?')) return; try { await removeStudentMutation.mutateAsync({ classroomId, studentId }); notify('Student removed.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not remove student.'); } };
  const addStudent = async (event: FormEvent, classroomId: string) => { event.preventDefault(); const email = rosterEmails[classroomId]?.trim() || ''; try { await addStudentMutation.mutateAsync({ classroomId, email }); setRosterEmails((current) => ({ ...current, [classroomId]: '' })); notify('Student added to the classroom.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not add student.'); } };
  const bulkRemoveStudents = async (classroomId: string) => { const studentIds = selectedStudents[classroomId] || []; if (!studentIds.length || !window.confirm(`Remove ${studentIds.length} selected student${studentIds.length === 1 ? '' : 's'} and revoke classroom access?`)) return; try { await removeStudentsMutation.mutateAsync({ classroomId, studentIds }); setSelectedStudents((current) => ({ ...current, [classroomId]: [] })); notify('Selected students removed.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not remove selected students.'); } };
  const toggleStudent = (classroomId: string, studentId: string, selected: boolean) => setSelectedStudents((current) => ({ ...current, [classroomId]: selected ? [...new Set([...(current[classroomId] || []), studentId])] : (current[classroomId] || []).filter((id) => id !== studentId) }));
  const selectedEvent = data.events.find((item) => item.id === selectedEventId) || null;
  const eventStudents = selectedEvent?.classroomId ? data.rosters?.find((roster) => roster.classroomId === selectedEvent.classroomId)?.students || [] : students;
  const markEventAttendance = async (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => { if (!selectedEvent) return; try { await markAttendanceMutation.mutateAsync({ eventId: selectedEvent.id, studentId, status }); notify('Attendance updated.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not update attendance.'); } };
  const editBankQuestion = (item: NonNullable<PlatformData['questionBank']>[number]) => { setEditingBankId(item.id); setBank({ prompt: item.prompt, choices: item.choices.map(String).join(', '), answer: String(item.answer ?? ''), explanation: item.explanation, tags: item.tags.join(', ') }); };
  const deleteBankQuestionItem = async (questionId: string) => { if (!window.confirm('Delete this reusable question?')) return; try { await deleteBankQuestionMutation.mutateAsync(questionId); if (editingBankId === questionId) { setEditingBankId(''); setBank({ prompt: '', answer: '', choices: '', explanation: '', tags: '' }); } notify('Question deleted.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not delete question.'); } };
  const visibleBankQuestions = (data.questionBank || []).filter((item) => (bankType === 'all' || item.type === bankType) && (!bankSearch.trim() || `${item.prompt} ${item.tags.join(' ')}`.toLocaleLowerCase().includes(bankSearch.trim().toLocaleLowerCase())));
  const downloadReport = () => downloadReportMutation.mutateAsync({ courseId: reportFilters.courseId || undefined, from: reportFilters.from ? `${reportFilters.from}T00:00:00` : undefined, to: reportFilters.to ? `${reportFilters.to}T23:59:59` : undefined }).catch((error) => notify(error.message));
  const maxCourseStudents = Math.max(1, ...courses.map((course) => course.studentCount));
  const revoke = async (invitationId: string) => { try { await revokeInvitationMutation.mutateAsync(invitationId); notify('Invitation revoked.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not revoke invitation.'); } };
  const copyInvite = async (code: string) => { const link = `${window.location.origin}/student/learning-hub?invite=${code}`; try { await navigator.clipboard.writeText(link); notify('Invitation link copied.'); } catch { window.prompt('Copy invitation link', link); } };

  return (
    <div className="teacher-page operations-page">
      <div className="page-heading"><div><span className="overline">Live learning operations</span><h1>Classes, grading & community</h1><p>Manage rosters, learner work, calendar events, reusable questions, notifications, and reports.</p></div><button className="primary-button" disabled={downloadReportMutation.isPending} onClick={() => void downloadReport()}><PixelIcon name="scroll" /> {downloadReportMutation.isPending ? 'Preparing report...' : 'Export CSV report'}</button></div>
      <div className="operations-forms">
        <form className="panel" onSubmit={saveClassroom}><h2>Create classroom</h2><select value={classroom.courseId} onChange={(e) => setClassroom({ ...classroom, courseId: e.target.value })}>{courses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select><input value={classroom.name} onChange={(e) => setClassroom({ ...classroom, name: e.target.value })} placeholder="Classroom name" required /><button className="secondary-button">Create</button></form>
        <form className="panel" onSubmit={saveInvitation}><h2>Create invitation</h2><select value={invitation.classroomId} onChange={(e) => setInvitation({ ...invitation, classroomId: e.target.value, assignmentId: '' })} required><option value="">Choose classroom</option>{data.classrooms.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><select value={invitation.assignmentId} onChange={(e) => setInvitation({ ...invitation, assignmentId: e.target.value })}><option value="">Whole classroom</option>{assignments.filter((item) => item.courseId === data.classrooms.find((room) => room.id === invitation.classroomId)?.courseId).map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select><label className="check-row"><input type="checkbox" checked={invitation.approvalRequired} onChange={(e) => setInvitation({ ...invitation, approvalRequired: e.target.checked })} /> Require teacher approval</label><input type="number" min="1" value={invitation.usageLimit} onChange={(e) => setInvitation({ ...invitation, usageLimit: e.target.value })} placeholder="Usage limit (optional)" /><input type="datetime-local" value={invitation.expiresAt} onChange={(e) => setInvitation({ ...invitation, expiresAt: e.target.value })} /><button className="secondary-button">Generate invite</button></form>
        <form className="panel" onSubmit={saveEvent}><h2>Schedule event</h2><select value={event.courseId} onChange={(e) => setEvent({ ...event, courseId: e.target.value, classroomId: '' })}>{courses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select><select value={event.classroomId} onChange={(e) => setEvent({ ...event, classroomId: e.target.value })}><option value="">Entire course</option>{data.classrooms.filter((room) => room.courseId === event.courseId).map((room) => <option value={room.id} key={room.id}>{room.name}</option>)}</select><input value={event.title} onChange={(e) => setEvent({ ...event, title: e.target.value })} placeholder="Event title" required /><textarea rows={2} value={event.description} onChange={(e) => setEvent({ ...event, description: e.target.value })} placeholder="Description (optional)" /><label>Starts<input type="datetime-local" value={event.startsAt} onChange={(e) => setEvent({ ...event, startsAt: e.target.value })} required /></label><label>Ends<input type="datetime-local" min={event.startsAt} value={event.endsAt} onChange={(e) => setEvent({ ...event, endsAt: e.target.value })} /></label><button className="secondary-button">Schedule</button></form>
        <form className="panel" onSubmit={saveBank}><h2>{editingBankId ? 'Edit bank question' : 'Question bank'}</h2><input value={bank.prompt} onChange={(e) => setBank({ ...bank, prompt: e.target.value })} placeholder="Question prompt" required /><input value={bank.choices} onChange={(e) => setBank({ ...bank, choices: e.target.value })} placeholder="Choices, comma separated (optional)" /><input value={bank.answer} onChange={(e) => setBank({ ...bank, answer: e.target.value })} placeholder={bank.choices ? 'Correct choice index (0 first)' : 'Correct answer'} required /><textarea rows={2} value={bank.explanation} onChange={(e) => setBank({ ...bank, explanation: e.target.value })} placeholder="Answer explanation (optional)" /><input value={bank.tags} onChange={(e) => setBank({ ...bank, tags: e.target.value })} placeholder="Tags, comma separated" /><div className="form-actions"><button className="secondary-button">{editingBankId ? 'Update question' : 'Save question'}</button>{editingBankId && <button type="button" className="text-button" onClick={() => { setEditingBankId(''); setBank({ prompt: '', answer: '', choices: '', explanation: '', tags: '' }); }}>Cancel</button>}</div></form>
      </div>
      <section className="panel report-dashboard"><div className="section-title-row"><div className="section-title"><PixelIcon name="trophy" /><div><small>Learning report</small><h2>Course reach overview</h2></div></div><div className="report-filters"><select value={reportFilters.courseId} onChange={(event) => setReportFilters({ ...reportFilters, courseId: event.target.value })}><option value="">All courses</option>{courses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select><label>From<input type="date" value={reportFilters.from} onChange={(event) => setReportFilters({ ...reportFilters, from: event.target.value })} /></label><label>To<input type="date" min={reportFilters.from} value={reportFilters.to} onChange={(event) => setReportFilters({ ...reportFilters, to: event.target.value })} /></label><button className="secondary-button" disabled={downloadReportMutation.isPending} onClick={() => void downloadReport()}>Export filtered CSV</button></div></div><div className="report-bars" aria-label="Students per course">{courses.map((course) => <div key={course.id}><span><strong>{course.title}</strong><small>{course.studentCount} students · {course.lessonCount} lessons</small></span><i><b style={{ width: `${Math.max(3, (course.studentCount / maxCourseStudents) * 100)}%` }} /></i></div>)}</div></section>
      <section className="panel roster-manager"><div className="section-title-row"><div className="section-title"><PixelIcon name="academy" /><div><small>Rosters & controlled access</small><h2>Classrooms</h2></div></div><label className="compact-search">Search rosters<input value={rosterSearch} onChange={(event) => setRosterSearch(event.target.value)} type="search" placeholder="Name or email" /></label></div><div className="classroom-grid">{data.classrooms.map((item) => { const students = data.rosters?.find((roster) => roster.classroomId === item.id)?.students || []; const query = rosterSearch.trim().toLocaleLowerCase(); const visible = query ? students.filter((student) => `${student.name} ${student.email}`.toLocaleLowerCase().includes(query)) : students; const selected = selectedStudents[item.id] || []; return <article className="roster-card" key={item.id}><strong>{item.name}</strong><small>{item.courseTitle} · {students.length} learners</small><form className="roster-add" onSubmit={(event) => void addStudent(event, item.id)}><input type="email" value={rosterEmails[item.id] || ''} onChange={(event) => setRosterEmails((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Student email address" required /><button className="secondary-button" disabled={addStudentMutation.isPending}>Add</button></form>{visible.map((student) => <div className="roster-person" key={student.id}><input type="checkbox" checked={selected.includes(student.id)} onChange={(event) => toggleStudent(item.id, student.id, event.target.checked)} aria-label={`Select ${student.name}`} /><span><strong>{student.name}</strong><small>{student.email}</small></span><button className="danger-button" onClick={() => void removeStudent(item.id, student.id)}>Remove</button></div>)}{!visible.length && <Empty>{students.length ? 'No learners match this search.' : 'No learners are enrolled yet.'}</Empty>}<button className="danger-button roster-bulk" disabled={!selected.length || removeStudentsMutation.isPending} onClick={() => void bulkRemoveStudents(item.id)}>Remove selected ({selected.length})</button></article>; })}{!data.classrooms.length && <Empty>Create a classroom to organize a course roster.</Empty>}</div></section>
      <section className="panel invitation-admin"><div className="section-title-row"><div className="section-title"><PixelIcon name="lock" /><div><small>Pending approvals</small><h2>Join requests</h2></div></div><span className="section-hint">{data.joinRequests?.filter((item) => item.status === 'pending').length || 0} pending</span></div>{data.joinRequests?.filter((item) => item.status === 'pending').map((item) => <article key={item.id}><span><strong>{item.studentName}</strong><small>{item.studentEmail} · {item.classroomName}{item.assignmentTitle ? ` · ${item.assignmentTitle}` : ''}</small></span><div><button onClick={() => void decideRequest(item.id, 'accepted')}>Approve</button><button className="danger-button" onClick={() => void decideRequest(item.id, 'rejected')}>Reject</button></div></article>)}{!data.joinRequests?.some((item) => item.status === 'pending') && <Empty>No pending join requests.</Empty>}</section>
      <section className="panel invitation-admin"><div className="section-title-row"><div className="section-title"><PixelIcon name="magic" /><div><small>Codes, links & limits</small><h2>Invitations</h2></div></div></div>{data.invitations?.map((item) => { const inactive = Boolean(item.revokedAt || (item.expiresAt && new Date(item.expiresAt) <= new Date()) || (item.usageLimit != null && item.usesCount >= item.usageLimit)); return <article key={item.id}><span><code>{item.code}</code><strong>{item.classroomName}</strong><small>{item.assignmentTitle || 'Whole classroom'} · {item.approvalRequired ? 'Approval required' : 'Instant join'} · {item.usesCount}/{item.usageLimit ?? '∞'} uses{item.expiresAt ? ` · expires ${new Date(item.expiresAt).toLocaleString()}` : ''}</small></span><div><button disabled={inactive} onClick={() => void copyInvite(item.code)}>Copy link</button><button className="danger-button" disabled={Boolean(item.revokedAt)} onClick={() => void revoke(item.id)}>{item.revokedAt ? 'Revoked' : 'Revoke'}</button></div></article>; })}{!data.invitations?.length && <Empty>No invitations yet.</Empty>}</section>
      <section className="panel"><div className="section-title-row"><div className="section-title"><PixelIcon name="scroll" /><div><small>Manual feedback & rubric-ready records</small><h2>Submission inbox</h2></div></div><span className="section-hint">{data.submissions.filter((item) => item.status !== 'graded').length} to grade</span></div><div className="grading-list">{data.submissions.map((item) => <article key={item.id}><div><strong>{item.studentName} · {item.assignmentTitle}</strong><small>{item.courseTitle} · attempt {item.attemptNumber} · {new Date(item.submittedAt).toLocaleString()}</small><p>{item.textContent || 'Attachment submission'}</p></div><span>{item.score == null ? 'Pending' : `${item.score}/${item.maxScore}`}</span><button onClick={() => void grade(item.id, item.maxScore)}>{item.status === 'graded' ? 'Regrade' : 'Grade'}</button></article>)}{!data.submissions.length && <Empty>Learner submissions will arrive here.</Empty>}</div></section>
      <div className="hub-grid teacher-hub-grid"><NotificationsPanel data={data} notify={notify} /><article><h3>Upcoming events</h3>{data.events.slice(0, 8).map((item) => <button type="button" className="hub-row calendar-event-button" key={item.id} onClick={() => setSelectedEventId(item.id)}><strong>{item.title}</strong><small>{new Date(item.startsAt).toLocaleString()} · {item.classroomName || item.courseTitle || 'Academy'}</small></button>)}</article><article><h3>Recent discussion</h3>{data.discussions.slice(0, 8).map((item) => <div className="hub-row" key={item.id}><strong>{item.authorName}</strong><small>{item.body}</small></div>)}</article><article><h3>Reusable questions</h3>{data.questionBank?.slice(0, 8).map((item) => <div className="hub-row" key={item.id}><strong>{item.prompt}</strong><small>{item.type} · {item.tags.join(', ') || 'untagged'}</small></div>)}</article></div>
      <DiscussionThreads data={data} courses={courses} notify={notify} composer />
      <section className="panel question-bank-manager"><div className="section-title-row"><div className="section-title"><PixelIcon name="brain" /><div><small>Reusable assessment library</small><h2>Question bank</h2></div></div><div className="bank-filters"><input type="search" value={bankSearch} onChange={(event) => setBankSearch(event.target.value)} placeholder="Search questions or tags" aria-label="Search question bank" /><select value={bankType} onChange={(event) => setBankType(event.target.value)} aria-label="Filter question bank by type"><option value="all">All types</option><option value="multiple_choice">Multiple choice</option><option value="fill_blank">Fill blank</option><option value="true_false">True or false</option><option value="essay">Essay</option></select></div></div><div className="bank-question-list">{visibleBankQuestions.map((item) => <article key={item.id}><span><strong>{item.prompt}</strong><small>{item.type} · {item.tags.join(', ') || 'untagged'}</small>{item.explanation && <p>{item.explanation}</p>}</span><div><button onClick={() => editBankQuestion(item)}>Edit</button><button className="danger-button" disabled={deleteBankQuestionMutation.isPending} onClick={() => void deleteBankQuestionItem(item.id)}>Delete</button></div></article>)}{!visibleBankQuestions.length && <Empty>No questions match these filters.</Empty>}</div></section>
      {user.isAdmin && <AdminConsole notify={notify} />}
      <AccountSecurity data={data} notify={notify} />
      {selectedEvent && <CalendarEventDialog event={selectedEvent} students={eventStudents} marking={markAttendanceMutation.isPending} onMark={(studentId, status) => void markEventAttendance(studentId, status)} onClose={() => setSelectedEventId('')} />}
    </div>
  );
}

function AdminConsole({ notify }: { notify: (message: string) => void }) {
  const adminQuery = useAdminQuery();
  const setAdminMutation = useSetAdminMutation();
  const setRoleMutation = useSetUserRoleMutation();
  const setStatusMutation = useSetAccountStatusMutation();
  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditDate, setAuditDate] = useState('');
  const data = adminQuery.data;
  useEffect(() => {
    if (adminQuery.error) notify(adminQuery.error instanceof Error ? adminQuery.error.message : 'Could not load admin data.');
  }, [adminQuery.error, notify]);
  if (!data) return null;
  const normalizedUserSearch = userSearch.trim().toLocaleLowerCase();
  const visibleUsers = normalizedUserSearch ? data.users.filter((item) => `${item.name} ${item.email} ${item.role} ${item.accountStatus}`.toLocaleLowerCase().includes(normalizedUserSearch)) : data.users;
  const normalizedAuditSearch = auditSearch.trim().toLocaleLowerCase();
  const visibleLogs = data.logs.filter((item) => (!normalizedAuditSearch || `${item.action} ${item.entityType} ${item.actorName || ''}`.toLocaleLowerCase().includes(normalizedAuditSearch)) && (!auditDate || item.createdAt.startsWith(auditDate))).slice(0, 50);
  return <section className="panel admin-console"><div className="section-title-row"><div className="section-title"><PixelIcon name="lock" /><div><small>Administrator controls</small><h2>Platform governance</h2></div></div></div><div className="admin-stats">{Object.entries(data.summary).map(([label, value]) => <article key={label}><strong>{value}</strong><small>{label}</small></article>)}</div><div className="admin-columns"><div><div className="admin-list-heading"><h3>Users</h3><input type="search" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search users" aria-label="Search users" /></div>{visibleUsers.map((item) => <div className="hub-row admin-user-row" key={item.id}><strong>{item.name}</strong><span>{item.email}</span><label>Role<select value={item.role} disabled={setRoleMutation.isPending} onChange={(event) => void setRoleMutation.mutateAsync({ userId: item.id, role: event.target.value as 'student' | 'teacher' }).catch((error) => notify(error.message))}><option value="student">Student</option><option value="teacher">Teacher</option></select></label><label>Status<select value={item.accountStatus || 'active'} disabled={setStatusMutation.isPending} onChange={(event) => void setStatusMutation.mutateAsync({ userId: item.id, status: event.target.value as 'active' | 'suspended' | 'deactivated' }).catch((error) => notify(error.message))}><option value="active">Active</option><option value="suspended">Suspended</option><option value="deactivated">Deactivated</option></select></label><button disabled={setAdminMutation.isPending} onClick={() => void setAdminMutation.mutateAsync({ userId: item.id, isAdmin: !item.isAdmin }).then(() => notify(item.isAdmin ? 'Administrator access removed.' : 'Administrator access granted.')).catch((error) => notify(error.message))}>{item.isAdmin ? 'Remove admin' : 'Make admin'}</button></div>)}{!visibleUsers.length && <Empty>No users match this search.</Empty>}</div><div><div className="admin-list-heading"><h3>Audit trail</h3><input type="search" value={auditSearch} onChange={(event) => setAuditSearch(event.target.value)} placeholder="Search activity" aria-label="Search audit activity" /><input type="date" value={auditDate} onChange={(event) => setAuditDate(event.target.value)} aria-label="Filter audit activity by date" /></div>{visibleLogs.map((item) => <div className="hub-row" key={item.id}><strong>{item.action} · {item.entityType}</strong><small>{item.actorName || 'System'} · {new Date(item.createdAt).toLocaleString()}</small></div>)}{!visibleLogs.length && <Empty>No audit activity matches these filters.</Empty>}</div></div></section>;
}
