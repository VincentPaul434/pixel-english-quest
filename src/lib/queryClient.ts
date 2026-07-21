import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../services/api';

const SECOND = 1_000;
const MINUTE = 60 * SECOND;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * SECOND,
      gcTime: 10 * MINUTE,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(SECOND * 2 ** attempt, 15 * SECOND),
      refetchOnWindowFocus: true
    },
    mutations: {
      retry: false
    }
  }
});
