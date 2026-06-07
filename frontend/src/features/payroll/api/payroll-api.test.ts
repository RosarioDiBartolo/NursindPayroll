import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "@/lib/utils";

import { createPayrollBatch, deletePayrollSession } from "./payroll-api";

vi.mock("@/lib/utils", () => ({
  default: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const postMock = vi.mocked(apiClient.post);
const deleteMock = vi.mocked(apiClient.delete);

describe("payroll API", () => {
  beforeEach(() => {
    postMock.mockReset();
    deleteMock.mockReset();
  });

  it("creates an explicit batch range under a session", async () => {
    postMock.mockResolvedValue({ data: { id: "batch-1" } });

    await createPayrollBatch("session-1", {
      start_year: 2025,
      start_month: 1,
      end_year: 2025,
      end_month: 3,
    });

    expect(postMock).toHaveBeenCalledWith(
      "/crawl-sessions/session-1/batches",
      {
        start_year: 2025,
        start_month: 1,
        end_year: 2025,
        end_month: 3,
      }
    );
  });

  it("deletes sessions only through an explicit API call", async () => {
    deleteMock.mockResolvedValue({ data: undefined, status: 204 });
    await deletePayrollSession("session-1");
    expect(deleteMock).toHaveBeenCalledWith("/crawl-sessions/session-1");
  });
});
