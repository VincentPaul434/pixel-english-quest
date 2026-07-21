import { useState, type FormEvent } from 'react';
import { createAssignment, createCourse, publishAnnouncement } from '../models/api';
import type {
  AnnouncementFormProps,
  AnnouncementFormViewModel,
  AssignmentFormProps,
  AssignmentFormViewModel,
  CourseFormProps,
  CourseFormViewModel
} from '../models/types';

export function useCourseFormViewModel({ onClose, onSaved, notify }: CourseFormProps): CourseFormViewModel {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [catalogVisibility, setCatalogVisibility] = useState<'private' | 'public'>('private');
  const [enrollmentMode, setEnrollmentMode] = useState<'invite' | 'self'>('invite');
  const [certificateEnabled, setCertificateEnabled] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      onSaved(await createCourse({ title, description, difficulty, catalogVisibility, enrollmentMode, certificateEnabled }));
      notify('Course draft created. Add a module and your first lesson.');
      onClose();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create the course.');
    } finally {
      setBusy(false);
    }
  };

  return { title, description, difficulty, catalogVisibility, enrollmentMode, certificateEnabled, busy, setTitle, setDescription, setDifficulty, setCatalogVisibility, setEnrollmentMode, setCertificateEnabled, submit };
}

export function useAssignmentFormViewModel({ course, lessonId, students, onClose, onSaved, notify }: AssignmentFormProps): AssignmentFormViewModel {
  const lesson = course.lessons.find((item) => item.id === lessonId)!;
  const [title, setTitle] = useState(lesson.title);
  const [dueAt, setDueAt] = useState('');
  const [instructions, setInstructions] = useState('');
  const [submissionType, setSubmissionType] = useState('quiz');
  const [allowResubmission, setAllowResubmission] = useState(true);
  const [selected, setSelected] = useState<string[]>(students.map((student) => student.id));
  const [busy, setBusy] = useState(false);

  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      onSaved(await createAssignment(lessonId, { title, dueAt: dueAt || null, studentIds: selected, instructions, submissionType, allowResubmission }));
      notify(`Assigned "${lesson.title}" to ${selected.length} learner${selected.length === 1 ? '' : 's'}.`);
      onClose();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create the assignment.');
    } finally {
      setBusy(false);
    }
  };

  return { lesson, title, dueAt, instructions, submissionType, allowResubmission, selected, busy, setTitle, setDueAt, setInstructions, setSubmissionType, setAllowResubmission, setSelected, toggle, submit };
}

export function useAnnouncementFormViewModel({ courses, onClose, onSaved, notify }: AnnouncementFormProps): AnnouncementFormViewModel {
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      onSaved(await publishAnnouncement({ courseId, title, body }));
      notify('Announcement published.');
      onClose();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not publish the announcement.');
    } finally {
      setBusy(false);
    }
  };

  return { courseId, title, body, busy, setCourseId, setTitle, setBody, submit };
}
