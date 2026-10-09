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

/** Time allowed for the provider to start answering (covers a cold model load). */
const FIRST_BYTE_TIMEOUT_MS = 25_000;

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

function deltaText(event: unknown): string {
  if (typeof event !== "object" || event === null) return "";
  const choices = (event as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) return "";
  const delta = (choices[0] as { delta?: { content?: unknown } } | undefined)
    ?.delta;
  return typeof delta?.content === "string" ? delta.content : "";
}

const TEXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

/** Turns the provider's SSE stream into plain text, so the client only ever sees answer text. */
function sseToText(upstream: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const leaked = createLeakDetector();
  let buffer = "";

  return upstream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const piece = deltaText(JSON.parse(data));
            if (!piece) continue;
            if (leaked(piece)) {
              // The model began reciting its instructions: stop the answer here.
              controller.enqueue(encoder.encode(`\n\n[stopped] ${REFUSAL}`));
              controller.terminate();
              return;
            }
            controller.enqueue(encoder.encode(piece));
          } catch {
            // A malformed event is skipped; the rest of the answer still streams.
          }
        }
      },
    })
  );
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

  const baseUrl = process.env.CHAT_BASE_URL;
  const model = process.env.CHAT_MODEL;
  if (!baseUrl || !model) return fail("not_configured", 503);

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

  const apiKey = process.env.CHAT_API_KEY;
  // The timeout only guards the wait for the first byte. Once the answer is
  // streaming it is bounded by max_tokens and the platform's maxDuration, so a
  // slow local model isn't cut off mid-sentence.
  const startTimeout = new AbortController();
  const timer = setTimeout(() => startTimeout.abort(), FIRST_BYTE_TIMEOUT_MS);
  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature: 0.2,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          ...messages,
        ],
      }),
      // Also stops the provider call when the visitor disconnects.
      signal: AbortSignal.any([request.signal, startTimeout.signal]),
    });
  } catch {
    return fail("upstream_error", 502);
  } finally {
    clearTimeout(timer);
  }

  if (!upstream.ok || !upstream.body) {
    // Provider details stay in the server log, never in the response.
    console.error(`[chat] upstream responded ${upstream.status}`);
    return fail("upstream_error", 502);
  }

  return new Response(sseToText(upstream.body), { headers: TEXT_HEADERS });
}
