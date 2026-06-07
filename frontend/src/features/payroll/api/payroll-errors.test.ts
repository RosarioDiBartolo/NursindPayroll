import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import {
  normalizePayrollError,
  PayrollApiError,
} from "./payroll-errors";

function createAxiosError(data: unknown, status: number) {
  return new AxiosError(
    "Request failed",
    "ERR_BAD_RESPONSE",
    {} as InternalAxiosRequestConfig,
    undefined,
    {
      config: {} as InternalAxiosRequestConfig,
      data,
      headers: {},
      status,
      statusText: "Error",
    }
  );
}

describe("normalizePayrollError", () => {
  it("normalizes Axios response metadata and API messages", () => {
    const source = createAxiosError(
      { detail: "Invalid portal credentials" },
      401
    );

    const error = normalizePayrollError(source);

    expect(error).toBeInstanceOf(PayrollApiError);
    expect(error.message).toBe("Invalid portal credentials");
    expect(error.status).toBe(401);
    expect(error.code).toBe("ERR_BAD_RESPONSE");
    expect(error.details).toEqual({ detail: "Invalid portal credentials" });
    expect(error.cause).toBe(source);
  });

  it("preserves an already normalized error", () => {
    const source = new PayrollApiError("Already normalized", { status: 503 });
    expect(normalizePayrollError(source)).toBe(source);
  });

  it("provides a safe fallback for unknown values", () => {
    const error = normalizePayrollError({ unexpected: true });
    expect(error.message).toBe("Payroll request failed");
    expect(error.details).toEqual({ unexpected: true });
  });
});
