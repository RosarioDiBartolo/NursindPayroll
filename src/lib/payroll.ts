export interface PayrollPeriod {
  year: number;
  month: number;
}

export type CrawlStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "expired";

export interface CrawlState {
  period: PayrollPeriod;
  jobId?: string;
  status: CrawlStatus;
  error?: string;
}

export const monthNames = [
  "GENNAIO",
  "FEBBRAIO",
  "MARZO",
  "APRILE",
  "MAGGIO",
  "GIUGNO",
  "LUGLIO",
  "AGOSTO",
  "SETTEMBRE",
  "OTTOBRE",
  "NOVEMBRE",
  "DICEMBRE",
];

export const buildPayrollPeriods = (now = new Date()): PayrollPeriod[] => {
  const periods: PayrollPeriod[] = [];
  for (let year = 2019; year <= now.getFullYear(); year += 1) {
    const lastMonth = year === now.getFullYear() ? now.getMonth() + 1 : 12;
    for (let month = 1; month <= lastMonth; month += 1) {
      periods.push({ year, month });
    }
  }
  return periods;
};

export const payrollPeriods = buildPayrollPeriods();
