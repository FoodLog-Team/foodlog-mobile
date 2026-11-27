import { ApiError, getErrorMessage, parseErrorBody } from "../errors";

describe("parseErrorBody", () => {
  it("reads the backend ErrorResponse format", () => {
    const body = {
      status: 409,
      message: "This email is already in use",
      timestamp: "2026-01-01T00:00:00Z",
    };

    expect(parseErrorBody(body)).toEqual({
      message: "This email is already in use",
      fieldErrors: {},
    });
  });

  it("reads field errors from the ValidationErrorResponse format", () => {
    const body = {
      status: 400,
      message: "Validation failed",
      errors: { email: ["must be a well-formed email address"], password: ["too short", 42] },
      timestamp: "2026-01-01T00:00:00Z",
    };

    expect(parseErrorBody(body)).toEqual({
      message: "Validation failed",
      fieldErrors: { email: ["must be a well-formed email address"], password: ["too short"] },
    });
  });

  it("falls back to ProblemDetail detail and title", () => {
    expect(
      parseErrorBody({ title: "Unauthorized", detail: "Refresh token is missing" }).message,
    ).toBe("Refresh token is missing");
    expect(parseErrorBody({ title: "Unauthorized" }).message).toBe("Unauthorized");
  });

  it("returns no message for empty or unknown bodies", () => {
    expect(parseErrorBody(undefined)).toEqual({ message: null, fieldErrors: {} });
    expect(parseErrorBody("<html>Bad gateway</html>")).toEqual({ message: null, fieldErrors: {} });
    expect(parseErrorBody({ message: "  " })).toEqual({ message: null, fieldErrors: {} });
  });
});

describe("getErrorMessage", () => {
  it("uses the backend message for client errors", () => {
    const error = new ApiError({ kind: "http", status: 401, message: "Wrong email or password" });

    expect(getErrorMessage(error)).toBe("Wrong email or password");
  });

  it("hides server error details", () => {
    const error = new ApiError({ kind: "http", status: 500, message: "Internal server error" });

    expect(getErrorMessage(error)).toBe("Something went wrong. Please try again.");
  });

  it("explains network failures", () => {
    const error = new ApiError({ kind: "network", message: "Network request failed: GET /x" });

    expect(getErrorMessage(error)).toMatch(/can't reach the server/i);
  });

  it("handles values that are not ApiErrors", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("Something went wrong. Please try again.");
    expect(getErrorMessage("boom")).toBe("Something went wrong. Please try again.");
  });
});
