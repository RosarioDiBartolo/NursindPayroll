export interface PayrollCredentials {
  username: string;
  password: string;
}

export type PayrollSessionStatus = "active" | "delete_requested";

export interface PayrollSession {
  id: string;
  username: string;
  status: PayrollSessionStatus;
  created_at: string;
  updated_at: string;
}

export interface PayrollPeriod {
  year: number;
  month: number;
}

export type PayrollJobStatus =
  | "pending"
  | "queued"
  | "running"
  | "retry_wait"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

export type PayrollBatchStatus =
  | "queued"
  | "running"
  | "retry_wait"
  | "blocked"
  | "cancel_requested"
  | "cancelled"
  | "completed"
  | "delete_requested";

export interface PayrollJobLog {
  id: number;
  level: "info" | "warning" | "error";
  message: string;
  created_at: string;
}

export interface PayrollJob {
  id: string;
  session_id: string;
  batch_id: string;
  sequence: number;
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
  next_retry_at: string | null;
  download_url: string | null;
  logs: PayrollJobLog[];
}

export interface PayrollBatch {
  id: string;
  session_id: string;
  status: PayrollBatchStatus;
  start_year: number;
  start_month: number;
  end_year: number;
  end_month: number;
  error: string | null;
  revision: number;
  counts: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
  };
  jobs: PayrollJob[];
  created_at: string;
  updated_at: string;
}

export interface PayrollSessionSnapshot {
  session: PayrollSession;
  batches: PayrollBatch[];
}

export interface CreatePayrollBatchInput {
  start_year: number;
  start_month: number;
  end_year: number;
  end_month: number;
}
