# TanStack Query architecture

## Responsibilities

- `src/services/api.ts` is the HTTP transport. It owns the API base URL, auth header, response parsing, `ApiError`, and unauthorized-session event.
- `src/features/*/models/api.ts` contains the only request function for each endpoint. These functions are framework-agnostic and fully typed.
- `src/hooks/queryKeys.ts` contains hierarchical query-key factories.
- `src/hooks/queries` combines a key and endpoint function with `queryOptions`, then exposes small `useQuery` hooks.
- `src/hooks/mutations` owns `useMutation`, cache writes, invalidation, and optimistic rollback.
- Feature view models keep form fields and interaction state local, but read server state through query and mutation hooks.
- `src/lib/queryClient.ts` contains the single application `QueryClient`.

This preserves the feature-based structure and avoids a second, duplicate API layer.

## Cache policy

The global defaults are a 30-second `staleTime`, a 10-minute `gcTime`, two retries for transient/server failures, and no retry for HTTP 4xx errors. Individual queries override this where their domain differs:

- Session identity is fresh indefinitely and is updated or removed explicitly during auth changes.
- Lesson content is fresh for five minutes.
- Quick quizzes are immediately stale so requesting another challenge can refetch.
- Analytics and invitation previews use shorter freshness windows.

Mutations that return a complete dashboard or platform overview write that authoritative payload directly to cache. Mutations that return only an acknowledgement invalidate the affected query. Vocabulary deletion and “mark all read” update the UI optimistically, preserve the old cache value, and roll it back if the request fails.

## Adding a GET endpoint

1. Add the response type alongside the owning feature.
2. Add one typed request function to that feature’s `models/api.ts`. Accept an optional `AbortSignal`.
3. Add a key factory entry to `src/hooks/queryKeys.ts`.
4. Add reusable `queryOptions` and a thin hook in `src/hooks/queries`.
5. Consume the hook from a view model or component.

```ts
// features/activity/models/api.ts
import { request } from '../../../services/api';
import type { Activity } from '../../academy/models/types';

export type ActivityPage = {
  items: Activity[];
  nextCursor: string | null;
};

export function getActivityPage(cursor: string | null, signal?: AbortSignal) {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return request<ActivityPage>(`/api/activity${query}`, { signal });
}

// hooks/queryKeys.ts
const activityKeys = {
  all: ['activity'] as const,
  feed: () => [...activityKeys.all, 'feed'] as const
};

// hooks/queries/activityQueries.ts
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';

export const activityFeedOptions = () => infiniteQueryOptions({
  queryKey: activityKeys.feed(),
  queryFn: ({ pageParam, signal }) => getActivityPage(pageParam, signal),
  initialPageParam: null as string | null,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined
});

export function useActivityFeedQuery() {
  return useInfiniteQuery(activityFeedOptions());
}
```

`useInfiniteQuery` is intentionally not used by the current application because its list endpoints return complete arrays and expose no cursor or page parameter. Once the API provides a paginated activity, discussion, or audit endpoint, the pattern above should be used rather than simulating pagination on the client.

## Adding a mutation endpoint

1. Add one typed endpoint function to the owning feature’s `models/api.ts`.
2. Add a named hook under `src/hooks/mutations`.
3. Use `setQueryData` when the response is the new authoritative resource; otherwise invalidate the narrowest key factory prefix.
4. Use an optimistic update only when the local state transition is deterministic and reversible.

```ts
export function useCreateActivityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...activityKeys.all, 'create'],
    mutationFn: createActivity,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: activityKeys.feed() })
  });
}
```

Components should never call `fetch` or a feature endpoint directly. They consume query/mutation hooks and keep only ephemeral UI state locally.

## Migrated server state

- Current-user session restoration and logout
- Student and teacher dashboards
- Lesson loading and teacher lesson editing
- Quick quizzes, lesson completion, speaking attempts, study notes, and checkpoints
- Profile, progress reset, and vocabulary changes
- Teacher course, lesson, assignment, announcement, analytics, publish/archive, duplicate, and reorder workflows
- Learning-hub overview, invitations, classrooms, submissions, discussions, enrollment, notifications, uploads, grading, calendar, question bank, reports, security, and admin data

The remaining `useEffect` calls manage browser events, timers, speech cleanup, cache-to-form initialization, and error notifications. They no longer perform API fetching.
