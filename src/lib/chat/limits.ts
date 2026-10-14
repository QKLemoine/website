/** Shared by the terminal client and the /api/chat route. */
export const MAX_INPUT_CHARS = 500
// History is kept short on purpose: every request resends the system prompt
// (rules + portfolio data) plus the history, so a short history keeps each
// question small and cheap.
/** Conversation turns (question + answer pairs) sent as context. */
export const MAX_TURNS = 3
export const MAX_ASSISTANT_CHARS = 2000
export const MAX_BODY_BYTES = 16_000
export const MAX_OUTPUT_TOKENS = 400

export type ChatRole = "user" | "assistant"
export type ChatMessage = { role: ChatRole; content: string }

export type ChatErrorCode =
  | "rate_limited"
  | "not_configured"
  | "invalid_request"
  | "upstream_error"
  | "forbidden"
