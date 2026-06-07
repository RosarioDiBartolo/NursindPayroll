import { describe, expect, it } from "vitest";

import { shouldRetryQuery } from "./query-client";

describe("shouldRetryQuery", () => {
  it("retries transient failures at most twice", () => {
    expect(shouldRetryQuery(0, new Error("Network error"))).toBe(true);
    expect(shouldRetryQuery(1, { status: 503 })).toBe(true);
    expect(shouldRetryQuery(2, { status: 503 })).toBe(false);
  });

  it("does not retry non-transient client errors", () => {
    expect(shouldRetryQuery(0, { status: 400 })).toBe(false);
    expect(shouldRetryQuery(0, { status: 404 })).toBe(false);
  });

  it("retries timeout and rate-limit responses", () => {
    expect(shouldRetryQuery(0, { status: 408 })).toBe(true);
    expect(shouldRetryQuery(0, { status: 429 })).toBe(true);
  });
});
