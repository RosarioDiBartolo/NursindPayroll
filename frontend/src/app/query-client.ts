import { QueryClient } from "@tanstack/react-query";

const MAX_QUERY_RETRIES = 2;
const RETRYABLE_HTTP_STATUSES = new Set([408, 429]);

type ErrorWithStatus = {
  status?: unknown;
};

export function shouldRetryQuery(
  failureCount: number,
  error: unknown
): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) {
    return false;
  }

  const status =
    typeof error === "object" && error !== null
      ? (error as ErrorWithStatus).status
      : undefined;

  if (typeof status !== "number") {
    return true;
  }

  return RETRYABLE_HTTP_STATUSES.has(status) || status >= 500;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: shouldRetryQuery,
    },
    mutations: {
      retry: false,
    },
  },
});
