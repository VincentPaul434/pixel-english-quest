import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLogoutMutation } from '../../../hooks/mutations/sessionMutations';
import { useSessionQuery } from '../../../hooks/queries/sessionQueries';
import { sessionKeys } from '../../../hooks/queryKeys';
import { clearSessionToken, hasSessionToken } from '../models/api';
import type { User } from '../../academy/models/types';
import type { AcademySessionViewModel } from '../models/types';

export function useAcademySessionViewModel(): AcademySessionViewModel {
  const queryClient = useQueryClient();
  const sessionQuery = useSessionQuery();
  const logoutMutation = useLogoutMutation();

  const clearSession = useCallback(() => {
    clearSessionToken();
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    window.addEventListener('academy:unauthorized', clearSession);
    return () => window.removeEventListener('academy:unauthorized', clearSession);
  }, [clearSession]);

  useEffect(() => {
    if (sessionQuery.isError) clearSession();
  }, [clearSession, sessionQuery.isError]);

  const setUser = useCallback((user: User | null) => {
    if (user) queryClient.setQueryData(sessionKeys.me(), user);
    else clearSession();
  }, [clearSession, queryClient]);

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      clearSession();
    }
  };

  return {
    user: sessionQuery.data ?? null,
    loading: hasSessionToken() && sessionQuery.isPending,
    setUser,
    logout
  };
}
