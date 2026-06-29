import { CheckCheckIcon, Clock3Icon, XCircleIcon } from "lucide-react";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { PayrollJob } from "@/features/payroll/api/payroll-types";
import { monthNames } from "@/lib/payroll";

const labels: Record<PayrollJob["status"], string> = {
  pending: "In attesa",
  queued: "In coda",
  running: "Elaborazione",
  retry_wait: "Riprova tra poco",
  completed: "Completato",
  failed: "Errore",
  cancelled: "Annullato",
  expired: "Scaduto",
};

const FileCrawler = ({
  job,
  download,
}: {
  job: PayrollJob;
  download: () => void;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
    <span className="text-sm">
      {job.year} {monthNames[job.month - 1]}: {labels[job.status]}
    </span>
    <div className="flex items-center gap-2">
      {(job.status === "queued" || job.status === "running") && (
        <LoadingSpinner />
      )}
      {(job.status === "pending" || job.status === "retry_wait") && (
        <Clock3Icon className="h-4 w-4 text-amber-600" />
      )}
      {job.status === "completed" && (
        <>
          <CheckCheckIcon className="h-4 w-4 text-green-600" />
          <button className="text-sm text-blue-700 underline" onClick={download}>
            Scarica
          </button>
        </>
      )}
      {(job.status === "failed" ||
        job.status === "cancelled" ||
        job.status === "expired") && (
        <XCircleIcon className="h-4 w-4 text-red-600" />
      )}
    </div>
    {job.error ? (
      <p className="w-full text-xs text-red-700">{job.error}</p>
    ) : null}
    {job.status === "retry_wait" && job.next_retry_at ? (
      <p className="w-full text-xs text-amber-700">
        Tentativo {job.attempts}. Prossimo retry:{" "}
        {new Date(job.next_retry_at).toLocaleString("it-IT")}.
      </p>
    ) : null}
  </div>
);

export default FileCrawler;
