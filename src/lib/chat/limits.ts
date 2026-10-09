/** Shared by the terminal client and the /api/chat route. */
export const MAX_INPUT_CHARS = 500
// History is kept short on purpose: small local models have a ~4k-token
// window, and the system prompt (rules + portfolio data) must never be the
// part that gets truncated.
/** Conversation turns (question + answer pairs) sent as context. */
export const MAX_TURNS = 3
export const MAX_ASSISTANT_CHARS = 1200
export const MAX_BODY_BYTES = 16_000
export const MAX_OUTPUT_TOKENS = 220

export type ChatRole = "user" | "assistant"
export type ChatMessage = { role: ChatRole; content: string }

export type ChatErrorCode =
  | "rate_limited"
  | "not_configured"
  | "invalid_request"
  | "upstream_error"
  | "forbidden"
