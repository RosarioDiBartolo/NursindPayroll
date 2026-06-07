import { CheckCheckIcon } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { CrawlState, CrawlStatus, monthNames } from "@/lib/payroll";

const labels: Record<CrawlStatus, string> = {
  queued: "In coda",
  running: "Elaborazione",
  completed: "Completato",
  failed: "Errore",
  expired: "Scaduto",
};

const FileCrawler = ({
  state,
  retry,
}: {
  state: CrawlState;
  retry: () => void;
}) => {
  const { period, status } = state;
  return (
    <div className="flex gap-3 items-center overflow-y-hidden">
      <span>
        {period.year} {monthNames[period.month - 1]}: {labels[status]}
      </span>
      {(status === "queued" || status === "running") && <LoadingSpinner />}
      {status === "completed" && (
        <CheckCheckIcon className="text-green-600" />
      )}
      {(status === "failed" || status === "expired") && (
        <button onClick={retry} className="text-red-700" title={state.error}>
          Riprova
        </button>
      )}
    </div>
  );
};

export default FileCrawler;
