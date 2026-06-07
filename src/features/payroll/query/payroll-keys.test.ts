import { describe, expect, it } from "vitest";

import {
  isTerminalPayrollJobStatus,
  type PayrollJobStatus,
} from "../api/payroll-types";
import { payrollKeys } from "./payroll-keys";

describe("payrollKeys", () => {
  it("builds stable hierarchical job keys", () => {
    expect(payrollKeys.all).toEqual(["payroll"]);
    expect(payrollKeys.jobs()).toEqual(["payroll", "jobs"]);
    expect(payrollKeys.job("job-123")).toEqual([
      "payroll",
      "jobs",
      "job-123",
    ]);
  });
});

describe("isTerminalPayrollJobStatus", () => {
  it.each<PayrollJobStatus>(["completed", "failed", "expired"])(
    "treats %s as terminal",
    (status) => {
      expect(isTerminalPayrollJobStatus(status)).toBe(true);
    }
  );

  it.each<PayrollJobStatus>(["queued", "running"])(
    "keeps polling while status is %s",
    (status) => {
      expect(isTerminalPayrollJobStatus(status)).toBe(false);
    }
  );
});
