import { useEffect, useReducer } from "react";
import { useQueryClient } from "@tanstack/react-query";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { SaveAllIcon } from "lucide-react";
import { IoStopCircleOutline } from "react-icons/io5";
import { VscDebugStart } from "react-icons/vsc";

import FileCrawler from "./FileCrawler";
import {
  initialPayrollControllerState,
  payrollControllerReducer,
} from "@/features/payroll/controller/payroll-controller";
import {
  getPayrollPdfFilename,
  PAYROLL_ZIP_FILENAME,
} from "@/features/payroll/controller/payroll-download";
import { payrollKeys } from "@/features/payroll/query/payroll-keys";
import {
  useCreatePayrollJob,
  useDownloadPayrollPdf,
  usePayrollJob,
} from "@/features/payroll/query/payroll-hooks";
import { payrollPeriods } from "@/lib/payroll";

interface CrawlerProps {
  sessionId: string;
}

const Crawler = ({ sessionId }: CrawlerProps) => {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(
    payrollControllerReducer,
    initialPayrollControllerState
  );
  const createJob = useCreatePayrollJob();
  const downloadPdfs = useDownloadPayrollPdf();
  const activeJob = usePayrollJob(sessionId, state.activeJobId, {
    enabled: state.phase === "polling" && !state.stopped,
  });

  useEffect(() => {
    if (
      state.stopped ||
      state.phase !== "idle" ||
      state.currentIndex >= payrollPeriods.length ||
      createJob.isPending
    ) {
      return;
    }

    const period = payrollPeriods[state.currentIndex];
    dispatch({ type: "job-create-requested", period });
    createJob.mutate(
      { sessionId, ...period },
      {
        onSuccess: (job) => dispatch({ type: "job-created", job }),
        onError: (error) =>
          dispatch({
            type: "job-request-failed",
            message: error.message,
          }),
      }
    );
  }, [
    createJob,
    sessionId,
    state.currentIndex,
    state.phase,
    state.stopped,
  ]);

  useEffect(() => {
    if (activeJob.data) {
      dispatch({ type: "job-updated", job: activeJob.data });
    }
  }, [activeJob.data]);

  const stop = async () => {
    dispatch({ type: "stop" });
    if (state.activeJobId) {
      await queryClient.cancelQueries({
        queryKey: payrollKeys.job(sessionId, state.activeJobId),
      });
    }
  };

  const retry = (index: number) => {
    dispatch({ type: "retry", index });
  };

  const downloadAllFiles = () => {
    const completed = state.states.filter(
      (item) => item.status === "completed" && item.jobId
    );
    if (completed.length === 0) {
      return;
    }

    downloadPdfs.mutate(
      completed.map((item) => ({
        jobId: item.jobId!,
        period: item.period,
      })),
      {
        onSuccess: async (files) => {
          const zip = new JSZip();
          files.forEach(({ blob, period }) => {
            zip.file(getPayrollPdfFilename(period), blob);
          });
          const archive = await zip.generateAsync({ type: "blob" });
          saveAs(archive, PAYROLL_ZIP_FILENAME);
        },
      }
    );
  };

  const isComplete = state.currentIndex >= payrollPeriods.length;

  return (
    <div className="mt-6">
      <div className="max-h-72 overflow-y-auto rounded-md border border-slate-200 p-3">
        {state.states.length === 0 ? (
          <p className="text-sm text-slate-500">
            Preparazione del primo periodo...
          </p>
        ) : (
          state.states.map((item, index) => (
            <FileCrawler
              key={`${item.period.year}-${item.period.month}`}
              state={item}
              retry={() => retry(index)}
            />
          ))
        )}
      </div>

      <div className="mt-4 flex items-center gap-5">
        {state.stopped ? (
          <button
            type="button"
            title="Riprendi"
            onClick={() => dispatch({ type: "resume" })}
          >
            <VscDebugStart className="h-8 w-8" />
          </button>
        ) : (
          <button type="button" title="Ferma" onClick={() => void stop()}>
            <IoStopCircleOutline className="h-8 w-8" />
          </button>
        )}

        <button
          type="button"
          title="Scarica tutti i PDF completati"
          disabled={downloadPdfs.isPending}
          onClick={downloadAllFiles}
        >
          <SaveAllIcon className="h-7 w-7" />
        </button>

        {isComplete ? (
          <span className="text-sm text-green-700">
            Tutti i periodi sono stati completati.
          </span>
        ) : null}
      </div>

      {activeJob.error ? (
        <p className="mt-3 text-sm text-red-700">{activeJob.error.message}</p>
      ) : null}
      {downloadPdfs.error ? (
        <p className="mt-3 text-sm text-red-700">
          Download interrotto: nessun archivio parziale è stato creato.
        </p>
      ) : null}
    </div>
  );
};

export default Crawler;
