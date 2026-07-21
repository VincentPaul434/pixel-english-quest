import { useState, type FormEvent } from 'react';
import { useCreateAssignmentMutation, useCreateCourseMutation, usePublishAnnouncementMutation } from '../../../hooks/mutations/teacherMutations';
import type {
  AnnouncementFormProps,
  AnnouncementFormViewModel,
  AssignmentFormProps,
  AssignmentFormViewModel,
  CourseFormProps,
  CourseFormViewModel
} from '../models/types';

export function useCourseFormViewModel({ onClose, notify }: CourseFormProps): CourseFormViewModel {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [catalogVisibility, setCatalogVisibility] = useState<'private' | 'public'>('private');
  const [enrollmentMode, setEnrollmentMode] = useState<'invite' | 'self'>('invite');
  const [certificateEnabled, setCertificateEnabled] = useState(true);
  const createCourseMutation = useCreateCourseMutation();
  const busy = createCourseMutation.isPending;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await createCourseMutation.mutateAsync({ title, description, difficulty, catalogVisibility, enrollmentMode, certificateEnabled });
      notify('Course draft created. Add a module and your first lesson.');
      onClose();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create the course.');
    }
  };

  return { title, description, difficulty, catalogVisibility, enrollmentMode, certificateEnabled, busy, setTitle, setDescription, setDifficulty, setCatalogVisibility, setEnrollmentMode, setCertificateEnabled, submit };
}

export function useAssignmentFormViewModel({ course, lessonId, students, onClose, notify }: AssignmentFormProps): AssignmentFormViewModel {
  const lesson = course.lessons.find((item) => item.id === lessonId)!;
  const [title, setTitle] = useState(lesson.title);
  const [dueAt, setDueAt] = useState('');
  const [instructions, setInstructions] = useState('');
  const [submissionType, setSubmissionType] = useState('quiz');
  const [allowResubmission, setAllowResubmission] = useState(true);
  const [selected, setSelected] = useState<string[]>(students.map((student) => student.id));
  const createAssignmentMutation = useCreateAssignmentMutation();
  const busy = createAssignmentMutation.isPending;

  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await createAssignmentMutation.mutateAsync({ lessonId, payload: { title, dueAt: dueAt || null, studentIds: selected, instructions, submissionType, allowResubmission } });
      notify(`Assigned "${lesson.title}" to ${selected.length} learner${selected.length === 1 ? '' : 's'}.`);
      onClose();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create the assignment.');
    }
  };

  return { lesson, title, dueAt, instructions, submissionType, allowResubmission, selected, busy, setTitle, setDueAt, setInstructions, setSubmissionType, setAllowResubmission, setSelected, toggle, submit };
}

export function useAnnouncementFormViewModel({ courses, onClose, notify }: AnnouncementFormProps): AnnouncementFormViewModel {
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const publishAnnouncementMutation = usePublishAnnouncementMutation();
  const busy = publishAnnouncementMutation.isPending;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await publishAnnouncementMutation.mutateAsync({ courseId, title, body });
      notify('Announcement published.');
      onClose();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not publish the announcement.');
    }
  };

  return { courseId, title, body, busy, setCourseId, setTitle, setBody, submit };
}
