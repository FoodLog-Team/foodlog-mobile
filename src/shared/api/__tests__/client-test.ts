import { apiRequest, buildUrl, setAccessTokenProvider } from "../client";
import { ApiError } from "../errors";

const BASE_URL = "http://test.local/api";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

let fetchMock: jest.Mock;

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = `${BASE_URL}/`;
  fetchMock = jest.fn();
  globalThis.fetch = fetchMock;
  setAccessTokenProvider(null);
});

afterEach(() => {
  jest.useRealTimers();
});

function lastRequest(): { url: string; init: RequestInit & { headers: Record<string, string> } } {
  const [url, init] = fetchMock.mock.calls.at(-1) as [
    string,
    RequestInit & { headers: Record<string, string> },
  ];
  return { url, init };
}

describe("buildUrl", () => {
  it("joins the path and skips empty query values", () => {
    expect(
      buildUrl(BASE_URL, "meals", { date: "2026-01-01", page: 0, empty: undefined, none: null }),
    ).toBe(`${BASE_URL}/meals?date=2026-01-01&page=0`);
  });
});

describe("apiRequest", () => {
  it("sends JSON and parses a JSON response", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ accessToken: "abc" }));

    const result = await apiRequest<{ accessToken: string }>("/auth/login", {
      method: "POST",
      body: { email: "a@b.c" },
      authenticated: false,
    });

    expect(result).toEqual({ accessToken: "abc" });
    const { url, init } = lastRequest();
    expect(url).toBe(`${BASE_URL}/auth/login`);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ email: "a@b.c" }));
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("attaches the access token from the registered provider", async () => {
    setAccessTokenProvider(async () => "token-123");
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiRequest("/auth/logout-all", { method: "POST" })).resolves.toBeUndefined();
    expect(lastRequest().init.headers.Authorization).toBe("Bearer token-123");
  });

  it("omits the token when authenticated is false", async () => {
    setAccessTokenProvider(async () => "token-123");
    fetchMock.mockResolvedValue(jsonResponse({}));

    await apiRequest("/auth/register", { method: "POST", body: {}, authenticated: false });

    expect(lastRequest().init.headers.Authorization).toBeUndefined();
  });

  it("does not set Content-Type for FormData uploads", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    const form = new FormData();
    form.append("note", "lunch");

    await apiRequest("/upload", { method: "POST", body: form });

    expect(lastRequest().init.body).toBe(form);
    expect(lastRequest().init.headers["Content-Type"]).toBeUndefined();
  });

  it("throws an http ApiError with the backend message and field errors", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { status: 400, message: "Validation failed", errors: { email: ["is required"] } },
        400,
      ),
    );

    const error = await apiRequest("/auth/register", { method: "POST", body: {} }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      kind: "http",
      status: 400,
      message: "Validation failed",
      fieldErrors: { email: ["is required"] },
    });
  });

  it("handles error responses without a body", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

    const error = await apiRequest("/meals").catch((e) => e);

    expect(error).toMatchObject({
      kind: "http",
      status: 401,
      message: "Request failed with status 401",
    });
    expect((error as ApiError).isUnauthorized).toBe(true);
  });

  it("maps fetch failures to a network ApiError", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network request failed"));

    await expect(apiRequest("/meals")).rejects.toMatchObject({ kind: "network", status: null });
  });

  it("maps a timeout to a timeout ApiError", async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );

    const request = apiRequest("/meals", { timeoutMs: 1000 });
    jest.advanceTimersByTime(1000);

    await expect(request).rejects.toMatchObject({ kind: "timeout" });
  });

  it("maps caller cancellation to an aborted ApiError", async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );

    const request = apiRequest("/meals", { signal: controller.signal });
    controller.abort();

    await expect(request).rejects.toMatchObject({ kind: "aborted" });
  });

  it("reports a 2xx response with malformed JSON as invalid-response", async () => {
    fetchMock.mockResolvedValue(
      new Response("{not json", { status: 200, headers: { "Content-Type": "application/json" } }),
    );

    await expect(apiRequest("/meals")).rejects.toMatchObject({
      kind: "invalid-response",
      status: 200,
    });
  });

  it("fails clearly when the API URL is not configured", async () => {
    delete process.env.EXPO_PUBLIC_API_URL;

    await expect(apiRequest("/meals")).rejects.toThrow(/EXPO_PUBLIC_API_URL is not set/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
