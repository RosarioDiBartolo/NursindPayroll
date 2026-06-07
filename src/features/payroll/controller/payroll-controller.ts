import type {
  PayrollJob,
  PayrollPeriod,
} from "../api/payroll-types";
import type { CrawlState } from "@/lib/payroll";

export type PayrollControllerPhase = "idle" | "creating" | "polling";

export interface PayrollControllerState {
  activeJobId?: string;
  currentIndex: number;
  phase: PayrollControllerPhase;
  states: CrawlState[];
  stopped: boolean;
}

export type PayrollControllerAction =
  | { type: "job-create-requested"; period: PayrollPeriod }
  | { type: "job-created"; job: PayrollJob }
  | { type: "job-updated"; job: PayrollJob }
  | { type: "job-request-failed"; message: string }
  | { type: "stop" }
  | { type: "resume" }
  | { type: "retry"; index: number };

export const initialPayrollControllerState: PayrollControllerState = {
  currentIndex: 0,
  phase: "idle",
  states: [],
  stopped: false,
};

function updateCurrentState(
  state: PayrollControllerState,
  update: Partial<CrawlState>
): CrawlState[] {
  const states = [...state.states];
  const current = states[state.currentIndex];
  if (!current) {
    throw new Error("Cannot update a payroll period before it is initialized");
  }
  states[state.currentIndex] = { ...current, ...update };
  return states;
}

function stateFromJob(job: PayrollJob): Partial<CrawlState> {
  return {
    error: job.error ?? undefined,
    jobId: job.id,
    status: job.status,
  };
}

export function payrollControllerReducer(
  state: PayrollControllerState,
  action: PayrollControllerAction
): PayrollControllerState {
  switch (action.type) {
    case "job-create-requested": {
      const states = [...state.states];
      states[state.currentIndex] = {
        period: action.period,
        status: "queued",
      };
      return { ...state, phase: "creating", states };
    }
    case "job-created":
      return {
        ...state,
        activeJobId: action.job.id,
        phase: "polling",
        states: updateCurrentState(state, stateFromJob(action.job)),
      };
    case "job-updated": {
      const states = updateCurrentState(state, stateFromJob(action.job));
      if (action.job.status === "completed") {
        return {
          ...state,
          activeJobId: undefined,
          currentIndex: state.currentIndex + 1,
          phase: "idle",
          states,
        };
      }
      if (action.job.status === "failed" || action.job.status === "expired") {
        return {
          ...state,
          activeJobId: undefined,
          phase: "idle",
          states,
          stopped: true,
        };
      }
      return { ...state, states };
    }
    case "job-request-failed":
      return {
        ...state,
        activeJobId: undefined,
        phase: "idle",
        states: updateCurrentState(state, {
          error: action.message,
          status: "failed",
        }),
        stopped: true,
      };
    case "stop":
      return { ...state, stopped: true };
    case "resume":
      return { ...state, stopped: false };
    case "retry": {
      const states = [...state.states];
      const previous = states[action.index];
      if (!previous) {
        return state;
      }
      states[action.index] = {
        period: previous.period,
        status: "queued",
      };
      return {
        ...state,
        activeJobId: undefined,
        currentIndex: action.index,
        phase: "idle",
        states,
        stopped: false,
      };
    }
  }
}
