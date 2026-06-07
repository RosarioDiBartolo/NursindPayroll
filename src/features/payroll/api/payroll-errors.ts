import axios from "axios";

interface ApiErrorBody {
  detail?: unknown;
  error?: unknown;
  message?: unknown;
}

export interface PayrollApiErrorOptions {
  cause?: unknown;
  code?: string;
  details?: unknown;
  status?: number;
}

export class PayrollApiError extends Error {
  readonly cause?: unknown;
  readonly code?: string;
  readonly details?: unknown;
  readonly status?: number;

  constructor(message: string, options: PayrollApiErrorOptions = {}) {
    super(message);
    this.name = "PayrollApiError";
    this.cause = options.cause;
    this.code = options.code;
    this.details = options.details;
    this.status = options.status;
  }
}

function getApiErrorMessage(data: unknown): string | undefined {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (typeof data !== "object" || data === null) {
    return undefined;
  }

  const body = data as ApiErrorBody;
  for (const value of [body.message, body.error, body.detail]) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return undefined;
}

export function normalizePayrollError(error: unknown): PayrollApiError {
  if (error instanceof PayrollApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    return new PayrollApiError(
      getApiErrorMessage(data) || error.message || "Payroll request failed",
      {
        cause: error,
        code: error.code,
        details: data,
        status: error.response?.status,
      }
    );
  }

  if (error instanceof Error) {
    return new PayrollApiError(error.message, { cause: error });
  }

  return new PayrollApiError("Payroll request failed", {
    cause: error,
    details: error,
  });
}
