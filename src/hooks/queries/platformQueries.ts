import { queryOptions, useQuery } from '@tanstack/react-query';
import { getAdminData, getPlatform, previewInvitation } from '../../features/platform/models/api';
import { platformKeys } from '../queryKeys';

export const platformQueryOptions = () => queryOptions({
  queryKey: platformKeys.overview(),
  queryFn: ({ signal }) => getPlatform(signal),
  staleTime: 30_000
});

export const invitationQueryOptions = (code: string) => queryOptions({
  queryKey: platformKeys.invitation(code),
  queryFn: ({ signal }) => previewInvitation(code, signal),
  staleTime: 15_000
});

export const adminQueryOptions = () => queryOptions({
  queryKey: platformKeys.admin(),
  queryFn: ({ signal }) => getAdminData(signal),
  staleTime: 30_000
});

export function usePlatformQuery() {
  return useQuery(platformQueryOptions());
}

export function useInvitationQuery(code: string, enabled = true) {
  return useQuery({ ...invitationQueryOptions(code), enabled: enabled && Boolean(code) });
}

export function useAdminQuery(enabled = true) {
  return useQuery({ ...adminQueryOptions(), enabled });
}
