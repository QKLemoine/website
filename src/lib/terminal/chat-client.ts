import type { ChatErrorCode, ChatMessage } from "@/lib/chat/limits"

export type ChatOutcome =
  | { ok: true }
  | { ok: false; reason: ChatErrorCode | "network" | "aborted" }

function isErrorCode(value: unknown): value is ChatErrorCode {
  return (
    typeof value === "string" &&
    [
      "rate_limited",
      "not_configured",
      "invalid_request",
      "upstream_error",
      "forbidden",
    ].includes(value)
  )
}

/** Streams an answer from /api/chat, calling `onText` with each chunk as it arrives. */
export async function streamChat(
  messages: ChatMessage[],
  options: { signal: AbortSignal; onText: (chunk: string) => void }
): Promise<ChatOutcome> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal: options.signal,
    })

    if (!response.ok || !response.body) {
      const payload: unknown = await response.json().catch(() => null)
      const code =
        typeof payload === "object" && payload !== null
          ? (payload as { error?: unknown }).error
          : null
      return { ok: false, reason: isErrorCode(code) ? code : "upstream_error" }
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let received = false
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      if (chunk) {
        received = true
        options.onText(chunk)
      }
    }
    // A 200 with an empty body means the provider produced nothing usable.
    return received ? { ok: true } : { ok: false, reason: "upstream_error" }
  } catch {
    return {
      ok: false,
      reason: options.signal.aborted ? "aborted" : "network",
    }
  }
}
