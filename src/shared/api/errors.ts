/**
 * Error model for all requests to the FoodLog backend.
 *
 * Every failure from `apiRequest` is an `ApiError`, so UI code can handle errors
 * in one way: `getErrorMessage(error)` for text, `error.fieldErrors` for forms.
 */

export type ApiErrorKind =
  /** The server answered with a non-2xx status. */
  | "http"
  /** No response: offline, DNS failure, server unreachable. */
  | "network"
  /** No response within the request timeout. */
  | "timeout"
  /** The caller cancelled the request (e.g. TanStack Query on unmount). */
  | "aborted"
  /** The server answered 2xx but the body could not be read. */
  | "invalid-response";

export type FieldErrors = Record<string, string[]>;

interface ApiErrorOptions {
  kind: ApiErrorKind;
  message: string;
  status?: number | null;
  fieldErrors?: FieldErrors;
  cause?: unknown;
}

export class ApiError extends Error {
  override name = "ApiError";
  readonly kind: ApiErrorKind;
  /** HTTP status for `kind: "http"`, otherwise `null`. */
  readonly status: number | null;
  /** Per-field validation messages from the backend (HTTP 400). Empty when there are none. */
  readonly fieldErrors: FieldErrors;

  constructor({ kind, message, status = null, fieldErrors = {}, cause }: ApiErrorOptions) {
    super(message, { cause });
    this.kind = kind;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

interface ParsedErrorBody {
  message: string | null;
  fieldErrors: FieldErrors;
}

/**
 * Reads an error body from the FoodLog backend. It handles the formats the backend
 * sends (see foodlog-backend `GlobalExceptionHandler`):
 *
 * - `ErrorResponse`: `{ status, message, timestamp }`
 * - `ValidationErrorResponse`: `{ status, message, errors: { field: string[] }, timestamp }`
 * - Spring's default `ProblemDetail` for exceptions without a custom handler:
 *   `{ title, detail, status }`
 *
 * Unknown or empty bodies (e.g. a 401 from the security filter) yield `message: null`.
 */
export function parseErrorBody(body: unknown): ParsedErrorBody {
  if (!isRecord(body)) {
    return { message: null, fieldErrors: {} };
  }

  const message =
    nonEmptyString(body.message) ?? nonEmptyString(body.detail) ?? nonEmptyString(body.title);

  return { message, fieldErrors: parseFieldErrors(body.errors) };
}

const FALLBACK_MESSAGES: Record<Exclude<ApiErrorKind, "http">, string> = {
  network: "Can't reach the server. Check your internet connection and try again.",
  timeout: "The server is taking too long to respond. Please try again.",
  aborted: "The request was cancelled.",
  "invalid-response": "The server sent an unexpected response. Please try again.",
};

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

/** A user-facing English message for any thrown value. */
export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return GENERIC_MESSAGE;
  }

  if (error.kind !== "http") {
    return FALLBACK_MESSAGES[error.kind];
  }

  // Server errors carry no useful detail for the user.
  if (error.status !== null && error.status >= 500) {
    return GENERIC_MESSAGE;
  }

  return error.message || GENERIC_MESSAGE;
}

function parseFieldErrors(value: unknown): FieldErrors {
  if (!isRecord(value)) {
    return {};
  }

  const result: FieldErrors = {};
  for (const [field, messages] of Object.entries(value)) {
    if (Array.isArray(messages)) {
      const strings = messages.filter((item): item is string => typeof item === "string");
      if (strings.length > 0) {
        result[field] = strings;
      }
    } else if (typeof messages === "string") {
      result[field] = [messages];
    }
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}
