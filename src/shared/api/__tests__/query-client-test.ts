import { ApiError } from "../errors";
import { shouldRetryQuery } from "../query-client";

describe("shouldRetryQuery", () => {
  it("does not retry client errors or cancellations", () => {
    expect(shouldRetryQuery(0, new ApiError({ kind: "http", status: 404, message: "" }))).toBe(
      false,
    );
    expect(shouldRetryQuery(0, new ApiError({ kind: "aborted", message: "" }))).toBe(false);
  });

  it("retries server and network errors up to two times", () => {
    const serverError = new ApiError({ kind: "http", status: 503, message: "" });
    const networkError = new ApiError({ kind: "network", message: "" });

    expect(shouldRetryQuery(0, serverError)).toBe(true);
    expect(shouldRetryQuery(1, networkError)).toBe(true);
    expect(shouldRetryQuery(2, networkError)).toBe(false);
  });
});
