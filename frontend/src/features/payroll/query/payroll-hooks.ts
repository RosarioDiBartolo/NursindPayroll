import { useMutation } from "@tanstack/react-query";

import {
  cancelPayrollBatch,
  createPayrollBatch,
  createPayrollSession,
  deletePayrollBatch,
  deletePayrollSession,
  retryPayrollBatch,
} from "../api/payroll-api";
import type {
  CreatePayrollBatchInput,
  PayrollCredentials,
} from "../api/payroll-types";

export function useCreatePayrollSession() {
  return useMutation({
    mutationFn: (credentials: PayrollCredentials) =>
      createPayrollSession(credentials),
    retry: false,
  });
}

export function useDeletePayrollSession() {
  return useMutation({
    mutationFn: (sessionId: string) => deletePayrollSession(sessionId),
    retry: false,
  });
}

export function useCreatePayrollBatch(sessionId: string) {
  return useMutation({
    mutationFn: (input: CreatePayrollBatchInput) =>
      createPayrollBatch(sessionId, input),
    retry: false,
  });
}

export function useRetryPayrollBatch() {
  return useMutation({
    mutationFn: (batchId: string) => retryPayrollBatch(batchId),
    retry: false,
  });
}

export function useCancelPayrollBatch() {
  return useMutation({
    mutationFn: (batchId: string) => cancelPayrollBatch(batchId),
    retry: false,
  });
}

export function useDeletePayrollBatch() {
  return useMutation({
    mutationFn: (batchId: string) => deletePayrollBatch(batchId),
    retry: false,
  });
}
