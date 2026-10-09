import {
  MAX_ASSISTANT_CHARS,
  MAX_INPUT_CHARS,
  MAX_TURNS,
  type ChatMessage,
} from "./limits"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

/**
 * Accepts only `{ messages: [{ role: "user" | "assistant", content }] }` ending
 * in a user message. Anything else (including a client-supplied "system" role)
 * is rejected, so the system prompt can only ever come from the server.
 */
export function parseChatRequest(body: unknown): ChatMessage[] | null {
  if (!isRecord(body) || !Array.isArray(body.messages)) return null
  const raw: unknown[] = body.messages
  if (raw.length === 0 || raw.length > MAX_TURNS * 2 + 1) return null

  const messages: ChatMessage[] = []
  for (const item of raw) {
    if (!isRecord(item) || typeof item.content !== "string") return null
    const content = item.content.trim()
    if (item.role === "user") {
      if (content.length === 0 || content.length > MAX_INPUT_CHARS) return null
      messages.push({ role: "user", content })
    } else if (item.role === "assistant") {
      if (content.length > MAX_ASSISTANT_CHARS) return null
      messages.push({ role: "assistant", content })
    } else {
      return null
    }
  }

  return messages[messages.length - 1].role === "user" ? messages : null
}
