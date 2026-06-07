export const payrollKeys = {
  all: ["payroll"] as const,
  session: (sessionId: string) =>
    [...payrollKeys.all, "session", sessionId] as const,
  jobs: (sessionId: string) =>
    [...payrollKeys.session(sessionId), "jobs"] as const,
  job: (sessionId: string, jobId: string) =>
    [...payrollKeys.jobs(sessionId), jobId] as const,
};
