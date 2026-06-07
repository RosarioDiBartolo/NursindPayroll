import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "@/lib/utils";

import { deletePayrollSession } from "./payroll-api";

vi.mock("@/lib/utils", () => ({
  default: {
    delete: vi.fn(),
  },
}));

const deleteMock = vi.mocked(apiClient.delete);

describe("deletePayrollSession", () => {
  beforeEach(() => {
    deleteMock.mockReset();
  });

  it("treats a missing session as an idempotent success", async () => {
    deleteMock.mockRejectedValue(
      new AxiosError(
        "Not found",
        "ERR_BAD_REQUEST",
        {} as InternalAxiosRequestConfig,
        undefined,
        {
          config: {} as InternalAxiosRequestConfig,
          data: { detail: "Not found" },
          headers: {},
          status: 404,
          statusText: "Not Found",
        }
      )
    );

    await expect(deletePayrollSession("missing")).resolves.toBeUndefined();
  });
});
