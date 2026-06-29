import { useMemo, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FileCrawler from "./FileCrawler";
import {
  downloadPayrollPdf,
} from "@/features/payroll/api/payroll-api";
import type {
  PayrollBatch,
  PayrollSessionSnapshot,
} from "@/features/payroll/api/payroll-types";
import {
  useCancelPayrollBatch,
  useCreatePayrollBatch,
  useDeletePayrollBatch,
} from "@/features/payroll/query/payroll-hooks";

interface CrawlerProps {
  snapshot: PayrollSessionSnapshot;
  connectionState: "connecting" | "connected" | "disconnected";
  refresh: () => Promise<void>;
}

const currentMonth = new Date().toISOString().slice(0, 7);

function parseMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

function batchTitle(batch: PayrollBatch) {
  return `${batch.start_year}-${String(batch.start_month).padStart(2, "0")} - ${
    batch.end_year
  }-${String(batch.end_month).padStart(2, "0")}`;
}

const Crawler = ({ snapshot, connectionState, refresh }: CrawlerProps) => {
  const [startMonth, setStartMonth] = useState("2000-01");
  const [endMonth, setEndMonth] = useState(currentMonth);
  const createBatch = useCreatePayrollBatch(snapshot.session.id);
  const cancelBatch = useCancelPayrollBatch();
  const deleteBatch = useDeletePayrollBatch();

  const isBusy =
    createBatch.isPending ||
    cancelBatch.isPending ||
    deleteBatch.isPending;

  const batches = useMemo(
    () => [...snapshot.batches].reverse(),
    [snapshot.batches]
  );

  const create = async () => {
    const start = parseMonth(startMonth);
    const end = parseMonth(endMonth);
    await createBatch.mutateAsync({
      start_year: start.year,
      start_month: start.month,
      end_year: end.year,
      end_month: end.month,
    });
    await refresh();
  };

  const downloadJob = async (jobId: string, year: number, month: number) => {
    const blob = await downloadPayrollPdf(jobId);
    saveAs(blob, `busta-paga-${year}-${String(month).padStart(2, "0")}.pdf`);
  };

  const downloadZip = async (batch: PayrollBatch) => {
    const completed = batch.jobs.filter((job) => job.status === "completed");
    const files = await Promise.all(
      completed.map(async (job) => ({
        job,
        blob: await downloadPayrollPdf(job.id),
      }))
    );
    const zip = new JSZip();
    files.forEach(({ job, blob }) => {
      zip.file(
        `busta-paga-${job.year}-${String(job.month).padStart(2, "0")}.pdf`,
        blob
      );
    });
    saveAs(await zip.generateAsync({ type: "blob" }), `batch-${batch.id}.zip`);
  };

  const remove = async (batch: PayrollBatch) => {
    if (
      !window.confirm(
        "Eliminare definitivamente il batch, i suoi job e tutti i PDF?"
      )
    ) {
      return;
    }
    await deleteBatch.mutateAsync(batch.id);
    await refresh();
  };

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-md border border-slate-200 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block">Da</span>
            <Input
              type="month"
              value={startMonth}
              onChange={(event) => setStartMonth(event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block">A</span>
            <Input
              type="month"
              value={endMonth}
              onChange={(event) => setEndMonth(event.target.value)}
            />
          </label>
          <Button
            disabled={isBusy || !startMonth || !endMonth || startMonth > endMonth}
            onClick={() => void create()}
          >
            Crea batch
          </Button>
          <span className="text-xs text-slate-500">
            SSE: {connectionState}
          </span>
        </div>
        {createBatch.error ? (
          <p className="mt-2 text-sm text-red-700">
            {createBatch.error.message}
          </p>
        ) : null}
      </section>

      {batches.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nessun batch. Scegli un intervallo e creane uno.
        </p>
      ) : (
        batches.map((batch) => (
          <section
            key={batch.id}
            className="rounded-md border border-slate-200 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{batchTitle(batch)}</h3>
                <p className="text-sm text-slate-600">
                  Stato: {batch.status} · {batch.counts.completed}/
                  {batch.counts.total} completati
                </p>
                {batch.error ? (
                  <p className="mt-1 text-sm text-red-700">{batch.error}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {["queued", "running", "retry_wait", "cancel_requested"].includes(
                  batch.status
                ) ? (
                  <Button
                    variant="outline"
                    disabled={isBusy || batch.status === "cancel_requested"}
                    onClick={() =>
                      void cancelBatch
                        .mutateAsync(batch.id)
                        .then(() => refresh())
                    }
                  >
                    Annulla rimanenti
                  </Button>
                ) : null}
                {batch.counts.completed > 0 ? (
                  <Button
                    variant="outline"
                    onClick={() => void downloadZip(batch)}
                  >
                    Scarica ZIP
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  disabled={isBusy || batch.status === "delete_requested"}
                  onClick={() => void remove(batch)}
                >
                  Elimina batch
                </Button>
              </div>
            </div>
            <div className="mt-3 max-h-72 overflow-y-auto">
              {batch.jobs.map((job) => (
                <FileCrawler
                  key={job.id}
                  job={job}
                  download={() =>
                    void downloadJob(job.id, job.year, job.month)
                  }
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
};

export default Crawler;
