import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authenticate, confirmPasswordReset, requestPasswordReset } from '../../features/auth/models/api';
import { clearSessionToken, logoutSession } from '../../features/session/models/api';
import { sessionKeys } from '../queryKeys';

export function useAuthenticateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...sessionKeys.all, 'authenticate'],
    mutationFn: ({ payload, endpoint }: { payload: Record<string, string>; endpoint: string }) => authenticate(payload, endpoint),
    onSuccess: (user) => queryClient.setQueryData(sessionKeys.me(), user)
  });
}

export function useRequestPasswordResetMutation() {
  return useMutation({
    mutationKey: [...sessionKeys.all, 'request-password-reset'],
    mutationFn: requestPasswordReset
  });
}

export function useConfirmPasswordResetMutation() {
  return useMutation({
    mutationKey: [...sessionKeys.all, 'confirm-password-reset'],
    mutationFn: ({ token, password }: { token: string; password: string }) => confirmPasswordReset(token, password)
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...sessionKeys.all, 'logout'],
    mutationFn: logoutSession,
    onSettled: () => {
      clearSessionToken();
      queryClient.clear();
    }
  });
}
