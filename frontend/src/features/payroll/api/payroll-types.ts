export interface PayrollCredentials {
  username: string;
  password: string;
}

export interface PayrollSession {
  id: string;
  expires_in: number;
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
  session_id: string;
  username: string;
  year: number;
  month: number;
  status: PayrollJobStatus;
  attempts: number;
  error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  download_url: string | null;
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
