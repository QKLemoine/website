import Anthropic from "@anthropic-ai/sdk";

import {
  createLeakDetector,
  looksLikeInjection,
  REFUSAL,
  wrapVisitorMessage,
} from "@/lib/chat/guard";
import {
  MAX_BODY_BYTES,
  MAX_OUTPUT_TOKENS,
  type ChatErrorCode,
} from "@/lib/chat/limits";
import { createRateLimiter } from "@/lib/chat/rate-limit";
import { buildSystemPrompt } from "@/lib/chat/system-prompt";
import { parseChatRequest } from "@/lib/chat/validate";

export const maxDuration = 30;

/** Time allowed for Claude to start answering. */
const FIRST_BYTE_TIMEOUT_MS = 25_000;

/** Fast and inexpensive; CHAT_MODEL can name another Claude model instead. */
const DEFAULT_MODEL = "claude-haiku-5-5";

const perMinute = createRateLimiter(8, 60_000);
const perDay = createRateLimiter(80, 24 * 60 * 60_000);

function fail(code: ChatErrorCode, status: number, headers?: HeadersInit) {
  return Response.json({ error: code }, { status, headers });
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/** Browsers send Origin on POST; reject other sites calling this endpoint from a page. */
function isCrossOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

/** Reads the body without trusting Content-Length, stopping once it is too large. */
async function readBody(request: Request): Promise<string | null> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    body += decoder.decode(value, { stream: true });
  }
  return body + decoder.decode();
}

const TEXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

type ClaudeStream = ReturnType<Anthropic["messages"]["stream"]>;
type StreamEvent = Anthropic.MessageStreamEvent;

/**
 * Turns Claude's stream into plain text, so the client only ever sees answer
 * text. `first` is the event already read while checking that Claude answered.
 */
function answerText(
  stream: ClaudeStream,
  events: AsyncIterator<StreamEvent>,
  first: StreamEvent
) {
  const encoder = new TextEncoder();
  const leaked = createLeakDetector();
  let pending: StreamEvent | null = first;
  let sentText = false;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        for (;;) {
          let event = pending;
          pending = null;
          if (!event) {
            const next = await events.next();
            if (next.done) {
              controller.close();
              return;
            }
            event = next.value;
          }
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta" &&
            event.delta.text
          ) {
            if (leaked(event.delta.text)) {
              // The model began reciting its instructions: stop the answer here.
              controller.enqueue(encoder.encode(`\n\n[stopped] ${REFUSAL}`));
              controller.close();
              stream.abort();
              return;
            }
            sentText = true;
            controller.enqueue(encoder.encode(event.delta.text));
            return;
          }
          // A declined request can end with no text at all; say so plainly.
          if (
            event.type === "message_delta" &&
            event.delta.stop_reason === "refusal" &&
            !sentText
          ) {
            sentText = true;
            controller.enqueue(encoder.encode(REFUSAL));
            return;
          }
        }
      } catch (error) {
        logClaudeError(error);
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });
}

/** Provider details stay in the server log, never in the response. */
function logClaudeError(error: unknown) {
  if (error instanceof Anthropic.APIUserAbortError) return;
  if (error instanceof Anthropic.APIError) {
    console.error(`[chat] Claude responded ${error.status ?? "without a status"}`);
  } else {
    console.error("[chat] Claude request failed");
  }
}

export async function POST(request: Request) {
  if (isCrossOrigin(request)) return fail("forbidden", 403);

  const key = clientKey(request);
  const limit = [perMinute(key), perDay(key)].find((result) => !result.ok);
  if (limit) {
    return fail("rate_limited", 429, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) return fail("not_configured", 503);
  const model = process.env.CHAT_MODEL || DEFAULT_MODEL;

  const body = await readBody(request);
  if (body === null) return fail("invalid_request", 413);

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return fail("invalid_request", 400);
  }
  const messages = parseChatRequest(json);
  if (!messages) return fail("invalid_request", 400);

  const question = messages[messages.length - 1];
  if (looksLikeInjection(question.content)) {
    return new Response(REFUSAL, { headers: TEXT_HEADERS });
  }
  question.content = wrapVisitorMessage(question.content);

  // Reads ANTHROPIC_API_KEY from the environment; it never reaches the browser.
  const client = new Anthropic({ maxRetries: 1 });
  const stream = client.messages.stream(
    {
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      // Short factual answers need no deliberation: with thinking off and low
      // effort the answer starts quickly and max_tokens is all answer.
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      system: buildSystemPrompt(),
      messages,
    },
    // Also stops the request when the visitor disconnects.
    { signal: request.signal }
  );

  // Wait for Claude's first event before answering, so a failure (bad key,
  // rate limit, outage) comes back as an error rather than an empty answer.
  // The timeout only guards that wait; the answer itself is bounded by
  // max_tokens and the platform's maxDuration.
  const events = stream[Symbol.asyncIterator]();
  const timer = setTimeout(() => stream.abort(), FIRST_BYTE_TIMEOUT_MS);
  let first: IteratorResult<StreamEvent>;
  try {
    first = await events.next();
  } catch (error) {
    logClaudeError(error);
    return fail("upstream_error", 502);
  } finally {
    clearTimeout(timer);
  }
  if (first.done) return fail("upstream_error", 502);

  return new Response(answerText(stream, events, first.value), {
    headers: TEXT_HEADERS,
  });
}
