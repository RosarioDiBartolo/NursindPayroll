import {
  useMutation,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  createPayrollJob,
  createPayrollSession,
  deletePayrollSession,
  downloadPayrollPdf,
  getPayrollJob,
} from "../api/payroll-api";
import type { PayrollApiError } from "../api/payroll-errors";
import {
  isTerminalPayrollJobStatus,
  type CreatePayrollJobInput,
  type PayrollCredentials,
  type PayrollJob,
  type PayrollSession,
} from "../api/payroll-types";
import { payrollKeys } from "./payroll-keys";

export interface PayrollJobQueryOptions {
  enabled?: boolean;
  pollIntervalMs?: number;
}

export function useCreatePayrollSession() {
  return useMutation<PayrollSession, PayrollApiError, PayrollCredentials>({
    mutationFn: (credentials) => createPayrollSession(credentials),
    retry: false,
  });
}

export function useDeletePayrollSession() {
  return useMutation<void, PayrollApiError, string>({
    mutationFn: (sessionId) => deletePayrollSession(sessionId),
    retry: false,
  });
}

export function useCreatePayrollJob() {
  return useMutation<PayrollJob, PayrollApiError, CreatePayrollJobInput>({
    mutationFn: (input) => createPayrollJob(input),
    retry: false,
  });
}

export function usePayrollJob(
  jobId: string | undefined,
  options: PayrollJobQueryOptions = {}
): UseQueryResult<PayrollJob, PayrollApiError> {
  const { enabled = true, pollIntervalMs = 2_000 } = options;

  return useQuery<PayrollJob, PayrollApiError>({
    queryKey: payrollKeys.job(jobId ?? ""),
    queryFn: ({ signal }) => getPayrollJob(jobId!, signal),
    enabled: enabled && Boolean(jobId),
    refetchInterval: (query) => {
      const job = query.state.data;
      return job && isTerminalPayrollJobStatus(job.status)
        ? false
        : pollIntervalMs;
    },
  });
}

export function useDownloadPayrollPdf() {
  return useMutation<Blob, PayrollApiError, string>({
    mutationFn: (jobId) => downloadPayrollPdf(jobId),
    retry: false,
  });
}
