export interface PayrollCredentials {
  username: string;
  password: string;
}

export interface PayrollSession {
  id: string;
}

export interface PayrollPeriod {
  year: number;
  month: number;
}

export type PayrollJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "expired";

export interface PayrollJob {
  id: string;
  status: PayrollJobStatus;
  error?: string;
}

export interface CreatePayrollJobInput extends PayrollPeriod {
  sessionId: string;
}

export const TERMINAL_PAYROLL_JOB_STATUSES: ReadonlySet<PayrollJobStatus> =
  new Set(["completed", "failed", "expired"]);

export function isTerminalPayrollJobStatus(
  status: PayrollJobStatus
): boolean {
  return TERMINAL_PAYROLL_JOB_STATUSES.has(status);
}
