import { useEffect, useMemo, useRef } from "react";

import type {
  PayrollBatch,
  PayrollJob,
  PayrollSessionSnapshot,
} from "@/features/payroll/api/payroll-types";

function jobTimestamp(job: PayrollJob): number {
  const value = job.completed_at ?? job.started_at ?? job.created_at;
  return Date.parse(value);
}

function selectTroubleshootingJob(
  snapshot: PayrollSessionSnapshot
): { batch: PayrollBatch; job: PayrollJob } | undefined {
  const entries = snapshot.batches.flatMap((batch) =>
    batch.jobs.map((job) => ({ batch, job }))
  );
  return (
    entries.find(({ job }) => job.status === "running") ??
    [...entries]
      .filter(({ job }) => job.status === "retry_wait")
      .sort(
        (left, right) => jobTimestamp(right.job) - jobTimestamp(left.job)
      )[0] ??
    [...entries]
      .filter(({ job }) => job.status === "failed")
      .sort(
        (left, right) => jobTimestamp(right.job) - jobTimestamp(left.job)
      )[0] ??
    [...entries].sort(
      (left, right) => jobTimestamp(right.job) - jobTimestamp(left.job)
    )[0]
  );
}

function levelClass(level: string): string {
  if (level === "error") {
    return "text-red-400";
  }
  if (level === "warning") {
    return "text-amber-300";
  }
  return "text-emerald-300";
}

export default function JobTerminal({
  snapshot,
}: {
  snapshot?: PayrollSessionSnapshot;
}) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const selection = useMemo(
    () => (snapshot ? selectTroubleshootingJob(snapshot) : undefined),
    [snapshot]
  );
  const job = selection?.job;

  useEffect(() => {
    const terminal = terminalRef.current;
    if (terminal) {
      terminal.scrollTop = terminal.scrollHeight;
    }
  }, [job?.logs]);

  if (!job) {
    return (
      <div className="rounded-md bg-zinc-950 p-4 font-mono text-sm text-zinc-400">
        $ In attesa di un job...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Batch {selection.batch.start_year}-
          {String(selection.batch.start_month).padStart(2, "0")} to{" "}
          {selection.batch.end_year}-
          {String(selection.batch.end_month).padStart(2, "0")}
        </span>
        <span>
          Active job {job.year}-{String(job.month).padStart(2, "0")} ·{" "}
          {job.status}
        </span>
      </div>
      <div
        ref={terminalRef}
        className="h-64 overflow-y-auto rounded-md bg-zinc-950 p-4 font-mono text-xs leading-5 shadow-inner"
        aria-live="polite"
        aria-label="Log del crawler"
      >
        {job.logs.length === 0 ? (
          <p className="text-zinc-400">$ Job in attesa di log...</p>
        ) : (
          job.logs.map((entry) => (
            <div key={entry.id} className="grid grid-cols-[5.5rem_1fr] gap-3">
              <time className="text-zinc-500">
                {new Date(entry.created_at).toLocaleTimeString("it-IT")}
              </time>
              <span className={levelClass(entry.level)}>
                [{entry.level.toUpperCase()}] {entry.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
