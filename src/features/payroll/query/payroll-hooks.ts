import {
  useQueryClient,
  useMutation,
  useQuery,
  type QueryClient,
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
  type PayrollPeriod,
  type PayrollSession,
} from "../api/payroll-types";
import { payrollKeys } from "./payroll-keys";

export interface PayrollJobQueryOptions {
  enabled?: boolean;
}

export function useCreatePayrollSession() {
  return useMutation<PayrollSession, PayrollApiError, PayrollCredentials>({
    mutationFn: (credentials) => createPayrollSession(credentials),
    retry: false,
  });
}

export async function removePayrollSessionQueries(
  queryClient: QueryClient,
  sessionId: string
): Promise<void> {
  await queryClient.cancelQueries({
    queryKey: payrollKeys.session(sessionId),
  });
  queryClient.removeQueries({
    queryKey: payrollKeys.session(sessionId),
  });
}

export function useDeletePayrollSession() {
  const queryClient = useQueryClient();

  return useMutation<void, PayrollApiError, string>({
    mutationFn: (sessionId) => deletePayrollSession(sessionId),
    onMutate: (sessionId) => removePayrollSessionQueries(queryClient, sessionId),
    retry: false,
  });
}

export function useCreatePayrollJob() {
  const queryClient = useQueryClient();

  return useMutation<PayrollJob, PayrollApiError, CreatePayrollJobInput>({
    mutationFn: (input) => createPayrollJob(input),
    onSuccess: (job, input) => {
      queryClient.setQueryData(
        payrollKeys.job(input.sessionId, job.id),
        job
      );
    },
    retry: false,
  });
}

export function usePayrollJob(
  sessionId: string,
  jobId: string | undefined,
  options: PayrollJobQueryOptions = {}
): UseQueryResult<PayrollJob, PayrollApiError> {
  const { enabled = true } = options;

  return useQuery<PayrollJob, PayrollApiError>({
    queryKey: payrollKeys.job(sessionId, jobId ?? ""),
    queryFn: ({ signal }) => getPayrollJob(jobId!, signal),
    enabled: enabled && Boolean(jobId),
    refetchInterval: (query) => {
      const job = query.state.data;
      return job && isTerminalPayrollJobStatus(job.status)
        ? false
        : 2_000;
    },
  });
}

export interface PayrollPdfDownload {
  blob: Blob;
  jobId: string;
  period: PayrollPeriod;
}

export interface PayrollPdfDownloadRequest {
  jobId: string;
  period: PayrollPeriod;
}

export function useDownloadPayrollPdf() {
  return useMutation<
    PayrollPdfDownload[],
    PayrollApiError,
    PayrollPdfDownloadRequest[]
  >({
    mutationFn: (requests) =>
      Promise.all(
        requests.map(async ({ jobId, period }) => ({
          blob: await downloadPayrollPdf(jobId),
          jobId,
          period,
        }))
      ),
    retry: false,
  });
}
