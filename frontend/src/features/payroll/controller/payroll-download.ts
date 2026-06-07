import type { PayrollPeriod } from "../api/payroll-types";

export function getPayrollPdfFilename(period: PayrollPeriod): string {
  return `${period.year}-${String(period.month).padStart(2, "0")}.pdf`;
}

export const PAYROLL_ZIP_FILENAME = "buste-paga.zip";
