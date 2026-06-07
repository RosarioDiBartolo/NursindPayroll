import { describe, expect, it } from "vitest";

import { buildPayrollPeriods } from "./payroll";


describe("buildPayrollPeriods", () => {
  it("builds one-based monthly periods from January 2019", () => {
    const periods = buildPayrollPeriods(new Date(2020, 1, 15));
    expect(periods[0]).toEqual({ year: 2019, month: 1 });
    expect(periods.at(-1)).toEqual({ year: 2020, month: 2 });
    expect(periods).toHaveLength(14);
  });

  it("includes the current month", () => {
    const periods = buildPayrollPeriods(new Date(2019, 0, 1));
    expect(periods).toEqual([{ year: 2019, month: 1 }]);
  });
});
