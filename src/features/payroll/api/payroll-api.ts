import apiClient from "@/lib/utils";

import { normalizePayrollError } from "./payroll-errors";
import type {
  CreatePayrollJobInput,
  PayrollCredentials,
  PayrollJob,
  PayrollSession,
} from "./payroll-types";

export async function createPayrollSession(
  credentials: PayrollCredentials,
  signal?: AbortSignal
): Promise<PayrollSession> {
  try {
    const response = await apiClient.post<PayrollSession>(
      "/crawl-sessions",
      credentials,
      { signal }
    );
    return response.data;
  } catch (error) {
    throw normalizePayrollError(error);
  }
}

export async function deletePayrollSession(
  sessionId: string,
  signal?: AbortSignal
): Promise<void> {
  try {
    await apiClient.delete(`/crawl-sessions/${sessionId}`, { signal });
  } catch (error) {
    const normalizedError = normalizePayrollError(error);
    if (normalizedError.status === 404) {
      return;
    }
    throw normalizedError;
  }
}

export async function createPayrollJob(
  input: CreatePayrollJobInput,
  signal?: AbortSignal
): Promise<PayrollJob> {
  try {
    const response = await apiClient.post<PayrollJob>(
      "/crawl-jobs",
      {
        session_id: input.sessionId,
        year: input.year,
        month: input.month,
      },
      { signal }
    );
    return response.data;
  } catch (error) {
    throw normalizePayrollError(error);
  }
}

export async function getPayrollJob(
  jobId: string,
  signal?: AbortSignal
): Promise<PayrollJob> {
  try {
    const response = await apiClient.get<PayrollJob>(
      `/crawl-jobs/${jobId}`,
      { signal }
    );
    return response.data;
  } catch (error) {
    throw normalizePayrollError(error);
  }
}

export async function downloadPayrollPdf(
  jobId: string,
  signal?: AbortSignal
): Promise<Blob> {
  try {
    const response = await apiClient.get<Blob>(
      `/crawl-jobs/${jobId}/download`,
      {
        responseType: "blob",
        signal,
      }
    );
    return response.data;
  } catch (error) {
    throw normalizePayrollError(error);
  }
}
