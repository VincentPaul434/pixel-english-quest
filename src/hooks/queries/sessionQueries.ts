import { queryOptions, useQuery } from '@tanstack/react-query';
import { hasSessionToken, restoreSession } from '../../features/session/models/api';
import { sessionKeys } from '../queryKeys';

export const sessionQueryOptions = () => queryOptions({
  queryKey: sessionKeys.me(),
  queryFn: ({ signal }) => restoreSession(signal),
  staleTime: Number.POSITIVE_INFINITY,
  retry: false
});

export function useSessionQuery() {
  return useQuery({ ...sessionQueryOptions(), enabled: hasSessionToken() });
}
