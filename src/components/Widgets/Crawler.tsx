import { useCallback, useContext, useEffect, useRef, useState } from "react";
import FileCrawler from "./FileCrawler";
import { BustePagaContext } from "@/Pages/Context";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { IoStopCircleOutline } from "react-icons/io5";
import { VscDebugStart } from "react-icons/vsc";
import { SaveAllIcon } from "lucide-react";
import apiClient from "@/lib/utils";
import {
  CrawlState,
  PayrollPeriod,
  payrollPeriods,
} from "@/lib/payroll";

interface JobResponse {
  id: string;
  status: CrawlState["status"];
  error?: string;
}

const POLL_INTERVAL_MS = 2000;

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const Crawler = () => {
  const [states, setStates] = useState<CrawlState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stopped, setStopped] = useState(false);
  const runningRef = useRef(false);
  const { sessionId } = useContext(BustePagaContext);

  const updateState = useCallback(
    (index: number, update: Partial<CrawlState>) => {
      setStates((previous) => {
        const next = [...previous];
        const current = next[index];
        next[index] = current
          ? { ...current, ...update }
          : {
              period: payrollPeriods[index],
              status: update.status ?? "queued",
              ...update,
            };
        return next;
      });
    },
    []
  );

  const pollJob = useCallback(
    async (jobId: string, index: number): Promise<JobResponse> => {
      for (;;) {
        const response = await apiClient.get<JobResponse>(
          `/crawl-jobs/${jobId}`
        );
        updateState(index, {
          jobId,
          status: response.data.status,
          error: response.data.error,
        });
        if (["completed", "failed", "expired"].includes(response.data.status)) {
          return response.data;
        }
        await wait(POLL_INTERVAL_MS);
      }
    },
    [updateState]
  );

  const crawl = useCallback(
    async (period: PayrollPeriod, index: number) => {
      if (!sessionId) {
        return false;
      }
      updateState(index, { status: "queued", error: undefined });
      try {
        const created = await apiClient.post<JobResponse>("/crawl-jobs", {
          session_id: sessionId,
          year: period.year,
          month: period.month,
        });
        const completed = await pollJob(created.data.id, index);
        return completed.status === "completed";
      } catch {
        updateState(index, {
          status: "failed",
          error: "Impossibile completare la richiesta.",
        });
        return false;
      }
    },
    [pollJob, sessionId, updateState]
  );

  useEffect(() => {
    if (
      stopped ||
      runningRef.current ||
      currentIndex >= payrollPeriods.length ||
      !sessionId
    ) {
      return;
    }

    runningRef.current = true;
    void crawl(payrollPeriods[currentIndex], currentIndex).then((success) => {
      runningRef.current = false;
      if (success) {
        setCurrentIndex((previous) => previous + 1);
      } else {
        setStopped(true);
      }
    });
  }, [crawl, currentIndex, sessionId, stopped]);

  const retry = async (index: number) => {
    if (runningRef.current) {
      return;
    }
    setCurrentIndex(index);
    setStopped(false);
  };

  const downloadAllFiles = async () => {
    const zip = new JSZip();
    const completed = states.filter(
      (state) => state?.status === "completed" && state.jobId
    );
    await Promise.all(
      completed.map(async (state) => {
        const response = await apiClient.get(
          `/crawl-jobs/${state.jobId}/download`,
          { responseType: "blob" }
        );
        zip.file(
          `${state.period.year}-${String(state.period.month).padStart(2, "0")}.pdf`,
          response.data
        );
      })
    );
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "buste-paga.zip");
  };

  return (
    <>
      <div className="overflow-y-scroll h-40 mb-6">
        {states.map((state, index) => (
          <FileCrawler
            key={`${state.period.year}-${state.period.month}`}
            state={state}
            retry={() => void retry(index)}
          />
        ))}
      </div>
      <span className="text-md flex items-center justify-start gap-6">
        {stopped ? (
          <VscDebugStart
            className="h-8 w-8 cursor-pointer"
            onClick={() => setStopped(false)}
          />
        ) : (
          <IoStopCircleOutline
            className="h-8 w-8 cursor-pointer"
            onClick={() => setStopped(true)}
          />
        )}
        <SaveAllIcon
          className="cursor-pointer"
          onClick={() => void downloadAllFiles()}
        />
      </span>
    </>
  );
};

export default Crawler;
