import { useMutation, useQueryClient, type MutationFunction } from '@tanstack/react-query';
import type { AdminData, PlatformData } from '../../features/platform/models/types';
import {
  addClassroomStudentByEmail, confirmVerification, createBankQuestion, createClassroom, createClassroomInvitation, createEvent, deleteBankQuestion, disableMfa,
  downloadTeacherReport, enableMfa, enrollCourse, gradeWork, joinClassroom, leaveClassroom, markAllRead, markAttendance, markNotificationRead, postDiscussion,
  regenerateMfaRecoveryCodes, removeClassroomStudent, removeClassroomStudents, requestVerification, resolveJoinRequest, revokeClassroomInvitation, setAccountStatus, setAdmin, setUserRole,
  setupMfa, submitWork, updateBankQuestion, updateNotificationPreferences, uploadAsset
} from '../../features/platform/models/api';
import { platformKeys, sessionKeys, studentKeys, teacherKeys } from '../queryKeys';

function usePlatformDataMutation<TVariables>(mutationKey: readonly unknown[], mutationFn: MutationFunction<PlatformData, TVariables>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey,
    mutationFn,
    onSuccess: (data) => queryClient.setQueryData(platformKeys.overview(), data)
  });
}

export function useMarkAllReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...platformKeys.all, 'notifications', 'read-all'],
    mutationFn: markAllRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: platformKeys.overview() });
      const previous = queryClient.getQueryData<PlatformData>(platformKeys.overview());
      const readAt = new Date().toISOString();
      queryClient.setQueryData<PlatformData>(platformKeys.overview(), (data) => data ? {
        ...data,
        unreadNotifications: 0,
        notifications: data.notifications.map((item) => ({ ...item, readAt: item.readAt || readAt }))
      } : data);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(platformKeys.overview(), context.previous);
    },
    onSuccess: (data) => queryClient.setQueryData(platformKeys.overview(), data),
    onSettled: () => queryClient.invalidateQueries({ queryKey: platformKeys.overview() })
  });
}

export function useEnrollCourseMutation() {
  return usePlatformDataMutation([...platformKeys.all, 'catalog', 'enroll'], enrollCourse);
}

export function usePostDiscussionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...platformKeys.all, 'discussions', 'post'],
    mutationFn: ({ courseId, body, parentId }: { courseId: string; body: string; parentId?: string }) => postDiscussion(courseId, body, parentId),
    onSuccess: (discussions) => queryClient.setQueryData<PlatformData>(platformKeys.overview(), (data) => data ? { ...data, discussions } : data)
  });
}

export function useSubmitWorkMutation() {
  return usePlatformDataMutation([...platformKeys.all, 'submissions', 'submit'], ({ assignmentId, textContent, attachmentUrl }: { assignmentId: string; textContent: string; attachmentUrl?: string }) => submitWork(assignmentId, textContent, attachmentUrl));
}

export function useCreateClassroomMutation() {
  return usePlatformDataMutation([...platformKeys.all, 'classrooms', 'create'], createClassroom);
}

export function useCreateInvitationMutation() {
  return usePlatformDataMutation([...platformKeys.all, 'invitations', 'create'], ({ classroomId, payload }: { classroomId: string; payload: Parameters<typeof createClassroomInvitation>[1] }) => createClassroomInvitation(classroomId, payload));
}

export function useRevokeInvitationMutation() {
  return usePlatformDataMutation([...platformKeys.all, 'invitations', 'revoke'], revokeClassroomInvitation);
}

export function useJoinClassroomMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...platformKeys.all, 'classrooms', 'join'],
    mutationFn: joinClassroom,
    onSuccess: async (data, code) => {
      queryClient.setQueryData(platformKeys.overview(), data);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformKeys.invitation(code) }),
        queryClient.invalidateQueries({ queryKey: studentKeys.dashboard() })
      ]);
    }
  });
}

export function useLeaveClassroomMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...platformKeys.all, 'classrooms', 'leave'],
    mutationFn: leaveClassroom,
    onSuccess: async (data) => {
      queryClient.setQueryData(platformKeys.overview(), data);
      await queryClient.invalidateQueries({ queryKey: studentKeys.dashboard() });
    }
  });
}

export function useResolveJoinRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...platformKeys.all, 'join-requests', 'resolve'],
    mutationFn: ({ requestId, status }: { requestId: string; status: 'accepted' | 'rejected' }) => resolveJoinRequest(requestId, status),
    onSuccess: async (data) => {
      queryClient.setQueryData(platformKeys.overview(), data);
      await queryClient.invalidateQueries({ queryKey: teacherKeys.dashboard() });
    }
  });
}

export function useRemoveClassroomStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...platformKeys.all, 'classrooms', 'remove-student'],
    mutationFn: ({ classroomId, studentId }: { classroomId: string; studentId: string }) => removeClassroomStudent(classroomId, studentId),
    onSuccess: async (data) => {
      queryClient.setQueryData(platformKeys.overview(), data);
      await queryClient.invalidateQueries({ queryKey: teacherKeys.dashboard() });
    }
  });
}

export function useGradeWorkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...platformKeys.all, 'submissions', 'grade'],
    mutationFn: ({ submissionId, score, feedback }: { submissionId: string; score: number; feedback: string }) => gradeWork(submissionId, score, feedback),
    onSuccess: async (data) => {
      queryClient.setQueryData(platformKeys.overview(), data);
      await queryClient.invalidateQueries({ queryKey: teacherKeys.dashboard() });
    }
  });
}

export function useCreateEventMutation() {
  return usePlatformDataMutation([...platformKeys.all, 'calendar', 'create'], createEvent);
}

export function useMarkAttendanceMutation() {
  return usePlatformDataMutation([...platformKeys.all, 'calendar', 'attendance'], ({ eventId, studentId, status, note }: { eventId: string; studentId: string; status: 'present' | 'absent' | 'late' | 'excused'; note?: string }) => markAttendance(eventId, { studentId, status, note }));
}

export function useCreateBankQuestionMutation() {
  return usePlatformDataMutation([...platformKeys.all, 'question-bank', 'create'], createBankQuestion);
}

export function useUpdateBankQuestionMutation() {
  return usePlatformDataMutation([...platformKeys.all, 'question-bank', 'update'], ({ questionId, payload }: { questionId: string; payload: Parameters<typeof updateBankQuestion>[1] }) => updateBankQuestion(questionId, payload));
}

export function useDeleteBankQuestionMutation() {
  return usePlatformDataMutation([...platformKeys.all, 'question-bank', 'delete'], deleteBankQuestion);
}

export function useSetAdminMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...platformKeys.admin(), 'set-role'],
    mutationFn: ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => setAdmin(userId, isAdmin),
    onSuccess: (data: AdminData) => queryClient.setQueryData(platformKeys.admin(), data)
  });
}

export function useUploadAssetMutation() {
  return useMutation({ mutationKey: [...platformKeys.all, 'assets', 'upload'], mutationFn: uploadAsset });
}

export function useSetUserRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({ mutationKey: [...platformKeys.admin(), 'set-role'], mutationFn: ({ userId, role }: { userId: string; role: 'student' | 'teacher' }) => setUserRole(userId, role), onSuccess: (data: AdminData) => queryClient.setQueryData(platformKeys.admin(), data) });
}

export function useSetAccountStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({ mutationKey: [...platformKeys.admin(), 'set-status'], mutationFn: ({ userId, status }: { userId: string; status: 'active' | 'suspended' | 'deactivated' }) => setAccountStatus(userId, status), onSuccess: (data: AdminData) => queryClient.setQueryData(platformKeys.admin(), data) });
}

export function useAddClassroomStudentByEmailMutation() {
  return usePlatformDataMutation([...platformKeys.all, 'classrooms', 'add-student-by-email'], ({ classroomId, email }: { classroomId: string; email: string }) => addClassroomStudentByEmail(classroomId, email));
}

export function useRemoveClassroomStudentsMutation() {
  return usePlatformDataMutation([...platformKeys.all, 'classrooms', 'remove-students'], ({ classroomId, studentIds }: { classroomId: string; studentIds: string[] }) => removeClassroomStudents(classroomId, studentIds));
}

export function useMarkNotificationReadMutation() {
  return usePlatformDataMutation([...platformKeys.all, 'notifications', 'read'], markNotificationRead);
}

export function useUpdateNotificationPreferencesMutation() {
  return usePlatformDataMutation([...platformKeys.all, 'notifications', 'preferences'], updateNotificationPreferences);
}

export function useDownloadTeacherReportMutation() {
  return useMutation({ mutationKey: [...platformKeys.all, 'reports', 'download'], mutationFn: downloadTeacherReport });
}

export function useRequestVerificationMutation() {
  return useMutation({ mutationKey: [...sessionKeys.all, 'verification', 'request'], mutationFn: requestVerification });
}

export function useConfirmVerificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...sessionKeys.all, 'verification', 'confirm'],
    mutationFn: confirmVerification,
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: sessionKeys.me() }),
      queryClient.invalidateQueries({ queryKey: platformKeys.overview() })
    ])
  });
}

export function useSetupMfaMutation() {
  return useMutation({ mutationKey: [...sessionKeys.all, 'mfa', 'setup'], mutationFn: setupMfa });
}

export function useEnableMfaMutation() {
  const queryClient = useQueryClient();
  return useMutation({ mutationKey: [...sessionKeys.all, 'mfa', 'enable'], mutationFn: enableMfa, onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.overview() }) });
}

export function useDisableMfaMutation() {
  const queryClient = useQueryClient();
  return useMutation({ mutationKey: [...sessionKeys.all, 'mfa', 'disable'], mutationFn: disableMfa, onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.overview() }) });
}

export function useRegenerateMfaRecoveryCodesMutation() {
  return useMutation({ mutationKey: [...sessionKeys.all, 'mfa', 'recovery-codes'], mutationFn: regenerateMfaRecoveryCodes });
}
