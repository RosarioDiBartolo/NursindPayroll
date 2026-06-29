import apiClient from "@/lib/utils";

import { normalizePayrollError } from "./payroll-errors";
import type {
  CreatePayrollBatchInput,
  PayrollBatch,
  PayrollCredentials,
  PayrollSessionSnapshot,
} from "./payroll-types";

async function normalized<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw normalizePayrollError(error);
  }
}

export function createPayrollSession(
  credentials: PayrollCredentials
): Promise<PayrollSessionSnapshot> {
  return normalized(async () => {
    const response = await apiClient.post<PayrollSessionSnapshot>(
      "/crawl-sessions",
      credentials
    );
    return response.data;
  });
}

export function getPayrollSession(
  sessionId: string
): Promise<PayrollSessionSnapshot> {
  return normalized(async () => {
    const response = await apiClient.get<PayrollSessionSnapshot>(
      `/crawl-sessions/${sessionId}`
    );
    return response.data;
  });
}

export function deletePayrollSession(
  sessionId: string
): Promise<PayrollSessionSnapshot | undefined> {
  return normalized(async () => {
    const response = await apiClient.delete<PayrollSessionSnapshot>(
      `/crawl-sessions/${sessionId}`
    );
    return response.status === 202 ? response.data : undefined;
  });
}

export function createPayrollBatch(
  sessionId: string,
  input: CreatePayrollBatchInput
): Promise<PayrollBatch> {
  return normalized(async () => {
    const response = await apiClient.post<PayrollBatch>(
      `/crawl-sessions/${sessionId}/batches`,
      input
    );
    return response.data;
  });
}

export function cancelPayrollBatch(batchId: string): Promise<PayrollBatch> {
  return normalized(async () => {
    const response = await apiClient.post<PayrollBatch>(
      `/crawl-batches/${batchId}/cancel`
    );
    return response.data;
  });
}

export function deletePayrollBatch(batchId: string): Promise<void> {
  return normalized(async () => {
    await apiClient.delete(`/crawl-batches/${batchId}`);
  });
}

export function downloadPayrollPdf(jobId: string): Promise<Blob> {
  return normalized(async () => {
    const response = await apiClient.get<Blob>(
      `/crawl-jobs/${jobId}/download`,
      { responseType: "blob" }
    );
    return response.data;
  });
}
