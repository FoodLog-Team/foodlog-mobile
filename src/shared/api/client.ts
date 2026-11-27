import { getApiBaseUrl } from "@/shared/config/env";

import { ApiError, parseErrorBody } from "./errors";

/**
 * Minimal HTTP client for the FoodLog REST API, built on the platform `fetch`.
 *
 * Responsibilities: base URL, JSON and multipart bodies, the Bearer token,
 * timeouts and cancellation, and turning every failure into an `ApiError`.
 * It knows nothing about specific endpoints; feature modules call it from
 * their own `api/` files.
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  method?: HttpMethod;
  /** Sent as JSON, unless it is a `FormData` (multipart upload, e.g. meal photos). */
  body?: unknown;
  query?: QueryParams;
  headers?: Record<string, string>;
  /** Cancels the request, e.g. the `signal` TanStack Query passes to query functions. */
  signal?: AbortSignal;
  /** Defaults to 30 seconds. Raise it for slow endpoints such as AI analysis. */
  timeoutMs?: number;
  /** Attach the access token. Defaults to `true`; set `false` for login/registration. */
  authenticated?: boolean;
}

export type AccessTokenProvider = () => Promise<string | null>;

const DEFAULT_TIMEOUT_MS = 30_000;

let accessTokenProvider: AccessTokenProvider | null = null;

/**
 * Registers where the client gets the access token from. The auth feature calls
 * this once it owns the session; until then requests are sent without a token.
 */
export function setAccessTokenProvider(provider: AccessTokenProvider | null): void {
  accessTokenProvider = provider;
}

export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const {
    method = "GET",
    body,
    query,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    authenticated = true,
  } = options;

  const url = buildUrl(getApiBaseUrl(), path, query);
  const headers: Record<string, string> = { Accept: "application/json", ...options.headers };

  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    // Let fetch set the multipart Content-Type with its boundary.
    requestBody = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  if (authenticated && accessTokenProvider) {
    const token = await accessTokenProvider();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener("abort", abortFromCaller);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: requestBody,
      signal: controller.signal,
    });
  } catch (cause) {
    if (timedOut) {
      throw new ApiError({
        kind: "timeout",
        message: `Request timed out: ${method} ${path}`,
        cause,
      });
    }
    if (signal?.aborted) {
      throw new ApiError({ kind: "aborted", message: `Request aborted: ${method} ${path}`, cause });
    }
    throw new ApiError({
      kind: "network",
      message: `Network request failed: ${method} ${path}`,
      cause,
    });
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortFromCaller);
  }

  if (!response.ok) {
    const { message, fieldErrors } = parseErrorBody(await readErrorBody(response));
    throw new ApiError({
      kind: "http",
      status: response.status,
      message: message ?? `Request failed with status ${response.status}`,
      fieldErrors,
    });
  }

  // Response bodies are trusted to match TResponse; feature API modules define these types
  // from the backend contract.
  return (await readSuccessBody(response, method, path)) as TResponse;
}

export function buildUrl(baseUrl: string, path: string, query?: QueryParams): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const params = Object.entries(query ?? {})
    .filter((entry): entry is [string, string | number | boolean] => entry[1] != null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return params.length > 0
    ? `${baseUrl}${normalizedPath}?${params.join("&")}`
    : `${baseUrl}${normalizedPath}`;
}

async function readSuccessBody(response: Response, method: HttpMethod, path: string) {
  try {
    return await readBody(response);
  } catch (cause) {
    throw new ApiError({
      kind: "invalid-response",
      status: response.status,
      message: `Could not read response: ${method} ${path}`,
      cause,
    });
  }
}

async function readErrorBody(response: Response): Promise<unknown> {
  try {
    return await readBody(response);
  } catch {
    return undefined;
  }
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  if (text === "") {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("json") ? JSON.parse(text) : text;
}
