export const payrollKeys = {
  all: ["payroll"] as const,
  jobs: () => [...payrollKeys.all, "jobs"] as const,
  job: (jobId: string) => [...payrollKeys.jobs(), jobId] as const,
};
