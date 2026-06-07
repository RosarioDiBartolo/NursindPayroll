import { describe, expect, it } from "vitest";

import type { PayrollJob } from "../api/payroll-types";
import {
  initialPayrollControllerState,
  payrollControllerReducer,
} from "./payroll-controller";

const period = { year: 2019, month: 1 };

const job = (status: PayrollJob["status"]): PayrollJob => ({
  id: "job-1",
  session_id: "session-1",
  username: "user",
  year: period.year,
  month: period.month,
  status,
  attempts: 1,
  error: status === "failed" ? "failed" : null,
  created_at: "2026-01-01T00:00:00",
  started_at: null,
  completed_at: null,
  expires_at: null,
  download_url: null,
});

describe("payrollControllerReducer", () => {
  it("advances only after a completed job", () => {
    const creating = payrollControllerReducer(initialPayrollControllerState, {
      type: "job-create-requested",
      period,
    });
    const polling = payrollControllerReducer(creating, {
      type: "job-created",
      job: job("queued"),
    });
    const completed = payrollControllerReducer(polling, {
      type: "job-updated",
      job: job("completed"),
    });

    expect(completed.currentIndex).toBe(1);
    expect(completed.phase).toBe("idle");
    expect(completed.states[0].status).toBe("completed");
  });

  it("stops on failure and retries the same period with a new job", () => {
    const creating = payrollControllerReducer(initialPayrollControllerState, {
      type: "job-create-requested",
      period,
    });
    const polling = payrollControllerReducer(creating, {
      type: "job-created",
      job: job("queued"),
    });
    const failed = payrollControllerReducer(polling, {
      type: "job-updated",
      job: job("failed"),
    });
    const retried = payrollControllerReducer(failed, {
      type: "retry",
      index: 0,
    });

    expect(failed.stopped).toBe(true);
    expect(retried.currentIndex).toBe(0);
    expect(retried.activeJobId).toBeUndefined();
    expect(retried.states[0]).toEqual({ period, status: "queued" });
  });

  it("keeps the active job while paused so resume continues polling it", () => {
    const creating = payrollControllerReducer(initialPayrollControllerState, {
      type: "job-create-requested",
      period,
    });
    const polling = payrollControllerReducer(creating, {
      type: "job-created",
      job: job("running"),
    });
    const stopped = payrollControllerReducer(polling, { type: "stop" });
    const resumed = payrollControllerReducer(stopped, { type: "resume" });

    expect(stopped.activeJobId).toBe("job-1");
    expect(resumed.activeJobId).toBe("job-1");
    expect(resumed.phase).toBe("polling");
  });
});
