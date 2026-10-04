import { APICallError } from "ai";
import {
  ALLERGEN_NOTICE,
  ChatFailureSchema,
  ERROR_HTTP_STATUS,
  type ChatFailure,
  type ChatRequest,
} from "../contracts/chat";

type ErrorCode = ChatFailure["error"]["code"];
const messages: Record<ErrorCode, string> = {
  INVALID_REQUEST:
    "Please check your message and session settings, then try again.",
  PAYLOAD_TOO_LARGE:
    "This conversation is too large. Shorten the message or clear the session.",
  RATE_LIMITED: "PantryPal is busy. Please wait a moment before trying again.",
  CONFIGURATION_ERROR:
    "PantryPal's provider configuration is unavailable. Please contact the operator.",
  UPSTREAM_ERROR:
    "PantryPal could not complete a reliable answer. Please try again.",
  TIMEOUT: "The answer took too long. Please try a shorter request.",
  CANCELLED: "The request was cancelled.",
  INTERNAL_ERROR: "PantryPal could not complete this request.",
};

export class ChatError extends Error {
  constructor(readonly code: ErrorCode) {
    super(code);
  }
}

export function failureResponse(
  error: unknown,
  request?: ChatRequest,
  signal?: AbortSignal,
) {
  let code: ErrorCode = "INTERNAL_ERROR";
  if (signal?.aborted)
    code =
      signal.reason instanceof ChatError ? signal.reason.code : "CANCELLED";
  else if (error instanceof ChatError) code = error.code;
  else if (APICallError.isInstance(error)) {
    code =
      error.statusCode === 429
        ? "RATE_LIMITED"
        : [401, 403].includes(error.statusCode ?? 0)
          ? "CONFIGURATION_ERROR"
          : "UPSTREAM_ERROR";
  }
  const body = ChatFailureSchema.parse({
    ok: false,
    requestId: request?.requestId ?? null,
    sessionId: request?.sessionId ?? null,
    sessionRevision: request?.sessionRevision ?? null,
    error: {
      code,
      message: messages[code],
      retryable: [
        "RATE_LIMITED",
        "UPSTREAM_ERROR",
        "TIMEOUT",
        "CANCELLED",
      ].includes(code),
    },
    allergenNotice: ALLERGEN_NOTICE,
  });
  return Response.json(body, {
    status: ERROR_HTTP_STATUS[code],
    headers: { "Cache-Control": "no-store" },
  });
}
