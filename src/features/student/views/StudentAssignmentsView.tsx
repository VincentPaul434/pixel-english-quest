import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useSubmitWorkMutation, useUploadAssetMutation } from '../../../hooks/mutations/platformMutations';
import { usePlatformQuery } from '../../../hooks/queries/platformQueries';
import { PixelIcon } from '../../../shared-components/PixelIcon';
import type { Assignment, LessonSummary } from '../../academy/models/types';
import { MAX_UPLOAD_BYTES, UPLOAD_ACCEPT } from '../../platform/models/api';
import type { Submission } from '../../platform/models/types';
import { dueLabel } from '../student-formatters';

type StudentAssignmentsViewProps = {
  assignments: Assignment[];
  lessons: LessonSummary[];
  selectedAssignmentId: string | null;
  notify: (message: string) => void;
  onOpenAssignment: (assignmentId: string) => void;
  onOpenLesson: (lesson: LessonSummary) => void;
  onBack: () => void;
};

type UploadDetails = {
  name: string;
  size: number;
  previewUrl: string;
};

function assignmentState(assignment: Assignment, latest?: Submission) {
  if (latest?.status === 'graded') return 'Graded';
  if (latest) return 'Submitted';
  if (assignment.status === 'completed') return 'Completed';
  if (assignment.dueAt && new Date(assignment.dueAt) < new Date()) return 'Overdue';
  return 'Open';
}

function SubmissionHistory({ submissions }: { submissions: Submission[] }) {
  if (!submissions.length) {
    return (
      <div className="assignment-empty-state">
        <PixelIcon name="scroll" size={34} />
        <div>
          <strong>No attempts submitted yet</strong>
          <p>Your submitted work and teacher feedback will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="submission-history">
      {submissions.map((submission) => {
        const scorePercent = submission.score == null || !submission.maxScore
          ? null
          : Math.round((submission.score / submission.maxScore) * 100);
        return (
          <article className="submission-attempt" key={submission.id}>
            <header>
              <div>
                <span className="overline">Attempt {submission.attemptNumber}</span>
                <strong>{new Date(submission.submittedAt).toLocaleString()}</strong>
              </div>
              <span className={`status-pill ${submission.status}`}>{submission.status}</span>
            </header>

            {submission.textContent && (
              <section className="submitted-response">
                <small>Your response</small>
                <p>{submission.textContent}</p>
              </section>
            )}
            {submission.attachmentUrl && (
              <a className="attachment-link" href={submission.attachmentUrl} target="_blank" rel="noreferrer">
                <PixelIcon name="scroll" size={16} /> Open submitted attachment
              </a>
            )}

            {submission.status === 'graded' && (
              <section className="grading-result">
                <div className="grade-summary">
                  <span><PixelIcon name="trophy" /></span>
                  <div>
                    <small>Teacher score</small>
                    <strong>{submission.score}/{submission.maxScore}</strong>
                  </div>
                  {scorePercent != null && <b>{scorePercent}%</b>}
                </div>
                {submission.feedback && (
                  <div className="teacher-feedback">
                    <strong>Teacher feedback</strong>
                    <p>{submission.feedback}</p>
                  </div>
                )}
                {!!submission.rubric.length && (
                  <div className="rubric-results">
                    <strong>Rubric breakdown</strong>
                    {submission.rubric.map((criterion, index) => (
                      <article key={`${criterion.criterion}-${index}`}>
                        <div>
                          <span>{criterion.criterion}</span>
                          <b>{criterion.points} pt{criterion.points === 1 ? '' : 's'}</b>
                        </div>
                        {criterion.comment && <p>{criterion.comment}</p>}
                      </article>
                    ))}
                  </div>
                )}
                {!submission.feedback && !submission.rubric.length && (
                  <p className="feedback-empty">Your teacher recorded a score without additional comments.</p>
                )}
                {submission.gradedAt && <small className="graded-at">Graded {new Date(submission.gradedAt).toLocaleString()}</small>}
              </section>
            )}
          </article>
        );
      })}
    </div>
  );
}

function AssignmentDetail({
  assignment,
  lesson,
  submissions,
  notify,
  onOpenLesson,
  onBack
}: {
  assignment: Assignment;
  lesson: LessonSummary | undefined;
  submissions: Submission[];
  notify: (message: string) => void;
  onOpenLesson: (lesson: LessonSummary) => void;
  onBack: () => void;
}) {
  const submitWorkMutation = useSubmitWorkMutation();
  const uploadMutation = useUploadAssetMutation();
  const [textContent, setTextContent] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [uploadDetails, setUploadDetails] = useState<UploadDetails | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const uploadController = useRef<AbortController | null>(null);

  const latest = submissions[0];
  const isQuiz = assignment.submissionType === 'quiz';
  const acceptsText = assignment.submissionType === 'text' || assignment.submissionType === 'mixed';
  const acceptsFile = assignment.submissionType === 'file' || assignment.submissionType === 'mixed';
  const canResubmit = !latest || assignment.allowResubmission;
  const hasRequiredWork = assignment.submissionType === 'text'
    ? Boolean(textContent.trim())
    : assignment.submissionType === 'file'
      ? Boolean(attachmentUrl)
      : Boolean(textContent.trim() || attachmentUrl);

  useEffect(() => () => uploadController.current?.abort(), []);
  useEffect(() => () => {
    if (uploadDetails?.previewUrl) URL.revokeObjectURL(uploadDetails.previewUrl);
  }, [uploadDetails?.previewUrl]);

  const chooseAttachment = async (file: File) => {
    setUploadError('');
    setUploadProgress(0);
    setAttachmentUrl('');
    if (!file.size || file.size > MAX_UPLOAD_BYTES) {
      setUploadDetails(null);
      setUploadError('Choose a file between 1 byte and 10 MB.');
      return;
    }
    if (uploadDetails?.previewUrl) URL.revokeObjectURL(uploadDetails.previewUrl);
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
    setUploadDetails({ name: file.name, size: file.size, previewUrl });
    const controller = new AbortController();
    uploadController.current = controller;
    try {
      const uploadedUrl = await uploadMutation.mutateAsync({ file, signal: controller.signal, onProgress: setUploadProgress });
      setAttachmentUrl(uploadedUrl);
      notify('File uploaded and ready to submit.');
    } catch (reason) {
      const message = reason instanceof DOMException && reason.name === 'AbortError'
        ? 'Upload cancelled.'
        : reason instanceof Error ? reason.message : 'Could not upload the file.';
      setUploadError(message);
      setAttachmentUrl('');
    } finally {
      if (uploadController.current === controller) uploadController.current = null;
    }
  };

  const removeAttachment = () => {
    uploadController.current?.abort();
    uploadController.current = null;
    if (uploadDetails?.previewUrl) URL.revokeObjectURL(uploadDetails.previewUrl);
    setUploadDetails(null);
    setUploadProgress(0);
    setUploadError('');
    setAttachmentUrl('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await submitWorkMutation.mutateAsync({ assignmentId: assignment.id, textContent, attachmentUrl });
      setTextContent('');
      removeAttachment();
      notify(latest ? 'Your new attempt was submitted.' : 'Work submitted to your teacher.');
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : 'Could not submit your work.');
    }
  };

  return (
    <section className="assignment-detail-view">
      <button className="text-button assignment-back" onClick={onBack}>
        ← Back to assignments
      </button>
      <article className="assignment-brief panel">
        <header>
          <div>
            <span className="overline">{assignment.courseTitle}</span>
            <h1>{assignment.title}</h1>
            <p>{assignment.lessonTitle}</p>
          </div>
          <span className={`assignment-state ${assignmentState(assignment, latest).toLowerCase()}`}>
            {assignmentState(assignment, latest)}
          </span>
        </header>
        <div className="assignment-meta-grid">
          <span><small>Due date</small><strong>{assignment.dueAt ? new Date(assignment.dueAt).toLocaleString() : 'No deadline'}</strong></span>
          <span><small>Submission</small><strong>{assignment.submissionType === 'quiz' ? 'Lesson quiz' : assignment.submissionType === 'mixed' ? 'Text or file' : assignment.submissionType}</strong></span>
          <span><small>Maximum score</small><strong>{assignment.maxScore ?? 100} points</strong></span>
          <span><small>Resubmission</small><strong>{assignment.allowResubmission ? 'Allowed' : 'One attempt'}</strong></span>
        </div>
        <section className="assignment-instructions">
          <strong>Instructions</strong>
          <p>{assignment.instructions || 'Complete the linked lesson and submit the requested work.'}</p>
        </section>
        {lesson && (
          <button className="secondary-button linked-lesson-button" onClick={() => onOpenLesson(lesson)}>
            <PixelIcon name="book" /> {isQuiz ? 'Open assignment lesson' : 'Review linked lesson'}
          </button>
        )}
      </article>

      {!isQuiz && canResubmit && (
        <form className="assignment-submission-form panel" onSubmit={submit}>
          <div className="section-title">
            <PixelIcon name="scroll" className="parchment" />
            <div>
              <small>{latest ? `Attempt ${latest.attemptNumber + 1}` : 'Your first attempt'}</small>
              <h2>{latest ? 'Submit another attempt' : 'Submit your work'}</h2>
            </div>
          </div>
          {acceptsText && (
            <label>
              Written response
              <textarea rows={7} value={textContent} onChange={(event) => setTextContent(event.target.value)} maxLength={20000} placeholder="Write or paste your response here" required={assignment.submissionType === 'text'} />
              <small>{textContent.length.toLocaleString()}/20,000 characters</small>
            </label>
          )}
          {acceptsFile && (
            <label className="file-field">
              Attachment
              <small>Images, PDF, text, or Office documents up to 10 MB.</small>
              <input type="file" accept={UPLOAD_ACCEPT} disabled={uploadMutation.isPending} onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void chooseAttachment(file);
                event.target.value = '';
              }} />
            </label>
          )}
          {uploadDetails && (
            <div className={`upload-preview ${uploadDetails.previewUrl ? 'has-preview' : ''}`}>
              {uploadDetails.previewUrl && <img src={uploadDetails.previewUrl} alt={`Preview of ${uploadDetails.name}`} />}
              <span><strong>{uploadDetails.name}</strong><small>{(uploadDetails.size / 1024 / 1024).toFixed(2)} MB</small></span>
              <button type="button" className="text-button danger-text" onClick={removeAttachment}>{uploadMutation.isPending ? 'Cancel' : 'Remove'}</button>
              {uploadMutation.isPending && <progress max={100} value={uploadProgress} aria-label={`Uploading ${uploadDetails.name}`}>{uploadProgress}%</progress>}
            </div>
          )}
          {uploadError && <div className="form-error" role="alert">{uploadError}</div>}
          {attachmentUrl && <small className="success-text">File uploaded and ready to submit.</small>}
          <button className="primary-button" disabled={submitWorkMutation.isPending || uploadMutation.isPending || !hasRequiredWork}>
            {submitWorkMutation.isPending ? 'Submitting...' : latest ? 'Submit new attempt' : 'Submit to teacher'}
          </button>
        </form>
      )}

      {isQuiz && (
        <section className="quiz-assignment-callout panel">
          <PixelIcon name={assignment.status === 'completed' ? 'check' : 'quiz'} size={34} />
          <div>
            <strong>{assignment.status === 'completed' ? 'Lesson quiz completed' : 'Complete the lesson quiz'}</strong>
            <p>Your lesson result automatically updates this assignment. No separate file submission is needed.</p>
          </div>
          {lesson && <button className="primary-button" onClick={() => onOpenLesson(lesson)}>{assignment.status === 'completed' ? 'Practise again' : 'Start lesson'}</button>}
        </section>
      )}

      {!isQuiz && latest && !assignment.allowResubmission && (
        <div className="submission-lock-note">
          <PixelIcon name="lock" />
          <span><strong>Your attempt is locked.</strong><small>This assignment does not allow resubmission.</small></span>
        </div>
      )}

      <section className="assignment-history panel">
        <div className="section-title-row">
          <div className="section-title">
            <PixelIcon name="clock" />
            <div><small>Complete record</small><h2>Submission history</h2></div>
          </div>
          <span className="section-hint">{submissions.length} attempt{submissions.length === 1 ? '' : 's'}</span>
        </div>
        <SubmissionHistory submissions={submissions} />
      </section>
    </section>
  );
}

export function StudentAssignmentsView({
  assignments,
  lessons,
  selectedAssignmentId,
  notify,
  onOpenAssignment,
  onOpenLesson,
  onBack
}: StudentAssignmentsViewProps) {
  const platformQuery = usePlatformQuery();
  const submissionsByAssignment = useMemo(() => {
    const result = new Map<string, Submission[]>();
    for (const submission of platformQuery.data?.submissions || []) {
      const items = result.get(submission.assignmentId) || [];
      items.push(submission);
      result.set(submission.assignmentId, items);
    }
    return result;
  }, [platformQuery.data?.submissions]);
  const selectedAssignment = assignments.find((assignment) => assignment.id === selectedAssignmentId);

  if (selectedAssignmentId) {
    if (platformQuery.isError) {
      return <section className="panel assignment-load-state"><PixelIcon name="close" /><h2>Could not load assignment history</h2><p>{platformQuery.error instanceof Error ? platformQuery.error.message : 'Please try again.'}</p><button className="secondary-button" onClick={() => void platformQuery.refetch()}>Try again</button></section>;
    }
    if (!platformQuery.data) {
      return <section className="panel assignment-load-state"><PixelIcon className="loading-rune" name="sparkle" /><p>Loading assignment details...</p></section>;
    }
    if (!selectedAssignment) {
      return <section className="panel assignment-load-state"><PixelIcon name="scroll" /><h2>Assignment not found</h2><p>It may have been removed or is no longer assigned to you.</p><button className="secondary-button" onClick={onBack}>Back to assignments</button></section>;
    }
    return (
      <AssignmentDetail
        assignment={selectedAssignment}
        lesson={lessons.find((lesson) => lesson.id === selectedAssignment.lessonId)}
        submissions={submissionsByAssignment.get(selectedAssignment.id) || []}
        notify={notify}
        onOpenLesson={onOpenLesson}
        onBack={onBack}
      />
    );
  }

  const openCount = assignments.filter((item) => item.status === 'assigned').length;
  return (
    <section id="assignments" className="assignment-card panel section-anchor">
      <div className="section-title-row">
        <div className="section-title">
          <PixelIcon name="scroll" className="parchment" />
          <div><small>From your teacher</small><h2>Assignments</h2></div>
        </div>
        <span className="section-hint">{openCount} open</span>
      </div>
      {assignments.length ? (
        <div className="assignment-list">
          {assignments.map((assignment) => {
            const latest = submissionsByAssignment.get(assignment.id)?.[0];
            const state = assignmentState(assignment, latest);
            return (
              <article className={assignment.status} key={assignment.id}>
                <span><PixelIcon name={state === 'Graded' || state === 'Completed' ? 'check' : 'scroll'} /></span>
                <div>
                  <strong>{assignment.title}</strong>
                  <small>{assignment.courseTitle} · {assignment.lessonTitle}</small>
                  {latest?.score != null && <small className="success-text">Latest score: {latest.score}/{latest.maxScore}</small>}
                </div>
                <time>{state === 'Open' || state === 'Overdue' ? `Due ${dueLabel(assignment.dueAt)}` : state}</time>
                <button onClick={() => onOpenAssignment(assignment.id)}>View details</button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-inline">
          <PixelIcon name="check" />
          <span><strong>You are all caught up.</strong><small>New teacher assignments will appear here.</small></span>
        </div>
      )}
    </section>
  );
}
