import {
  CHAT_LIMITS as limits,
  ChatRequestSchema,
  type ChatRequest,
} from "../../../lib/contracts/chat";
import { answerChat } from "../../../lib/server/chat";
import { ChatError, failureResponse } from "../../../lib/server/errors";
import { readBoundedJson, withAbort } from "../../../lib/server/http";

export const runtime = "nodejs";
let activeRequests = 0;

export async function POST(request: Request) {
  const started = performance.now();
  const controller = new AbortController();
  const cancel = () => controller.abort(new ChatError("CANCELLED"));
  request.signal.addEventListener("abort", cancel, { once: true });
  if (request.signal.aborted) cancel();
  const timer = setTimeout(
    () => controller.abort(new ChatError("TIMEOUT")),
    limits.requestTimeoutMs,
  );
  let validated: ChatRequest | undefined;
  let admitted = false;
  try {
    if (activeRequests >= limits.maxConcurrentRequests)
      throw new ChatError("RATE_LIMITED");
    activeRequests++;
    admitted = true;
    if (
      request.headers
        .get("content-type")
        ?.split(";")[0]
        .trim()
        .toLowerCase() !== "application/json"
    )
      throw new ChatError("INVALID_REQUEST");
    const contentLength = request.headers.get("content-length");
    if (contentLength && Number(contentLength) > limits.maxRequestBytes)
      throw new ChatError("PAYLOAD_TOO_LARGE");
    const raw = await readBoundedJson(
      request.body,
      limits.maxRequestBytes,
      controller.signal,
    );
    const parsed = ChatRequestSchema.safeParse(raw);
    if (!parsed.success) throw new ChatError("INVALID_REQUEST");
    validated = parsed.data;
    const response = await withAbort(
      answerChat(validated, controller.signal, started),
      controller.signal,
    );
    controller.signal.throwIfAborted();
    return Response.json(response, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failureResponse(error, validated, controller.signal);
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener("abort", cancel);
    if (admitted) activeRequests--;
  }
}
