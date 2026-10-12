"use client"

import { ArrowUp, Square } from "lucide-react"
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react"

import {
  MAX_ASSISTANT_CHARS,
  MAX_INPUT_CHARS,
  MAX_TURNS,
  type ChatMessage,
} from "@/lib/chat/limits"
import { profile } from "@/lib/content"
import { streamChat, type ChatOutcome } from "@/lib/terminal/chat-client"
import {
  QUICK_ACTIONS,
  runCommand,
  text,
  type Line,
  type OpenTarget,
} from "@/lib/terminal/commands"
import type { Path } from "@/lib/terminal/filesystem"
import { answerOffline } from "@/lib/terminal/offline-answer"

import { Message, type Entry } from "./chat-messages"

const SUGGESTIONS = [
  "What has he built?",
  "What's his ML experience?",
  "Is he open to roles?",
]

type FailureReason = Exclude<
  Extract<ChatOutcome, { ok: false }>["reason"],
  "aborted"
>

const FAILURE: Record<FailureReason, string> = {
  rate_limited:
    "I'm rate-limited for a moment, so here's what my notes say instead.",
  not_configured:
    "The language model isn't connected right now, so here's what my notes say instead.",
  upstream_error:
    "The language model didn't answer, so here's what my notes say instead.",
  network:
    "I couldn't reach the language model, so here's what my notes say instead.",
  forbidden:
    "I couldn't reach the language model, so here's what my notes say instead.",
  invalid_request: "I couldn't send that message. Try a shorter question.",
}

const chipClass =
  "shrink-0 rounded-full border border-border bg-transparent px-3 py-1 text-xs text-foreground outline-none transition-colors hover:border-ring hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"

export function ChatView({
  inputRef,
  onOpen,
}: {
  /** Owned by the panel so the dialog can focus the input when it opens. */
  inputRef: RefObject<HTMLInputElement | null>
  /** Called when a command asks to scroll somewhere (`open projects`). */
  onOpen: (target: OpenTarget) => void
}) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [value, setValue] = useState("")
  const [cwd, setCwd] = useState<Path>([])
  const [busy, setBusy] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(0)
  const history = useRef<string[]>([])
  const historyIndex = useRef<number | null>(null)
  const draft = useRef("")
  const turns = useRef<ChatMessage[]>([])
  const abort = useRef<AbortController | null>(null)
  // Follow new messages unless the visitor has scrolled up to read.
  const stickToBottom = useRef(true)

  const firstName = profile.name.split(" ")[0]

  useEffect(() => {
    const el = scrollRef.current
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight
  }, [entries, busy])

  useEffect(() => () => abort.current?.abort(), [])

  function addEntry(entry: Entry) {
    setEntries((previous) => [...previous, entry])
  }
  function addOutput(lines: Line[]) {
    addEntry({ id: nextId.current++, kind: "output", lines })
  }

  async function ask(question: string) {
    if (question.length > MAX_INPUT_CHARS) {
      addOutput([
        text(`Questions are limited to ${MAX_INPUT_CHARS} characters.`, "error"),
      ])
      return
    }

    const id = nextId.current++
    addEntry({ id, kind: "answer", text: "", streaming: true })
    setBusy(true)
    const controller = new AbortController()
    abort.current = controller

    let answer = ""
    const outcome = await streamChat(
      [...turns.current, { role: "user", content: question }],
      {
        signal: controller.signal,
        onText: (chunk) => {
          answer += chunk
          setEntries((previous) =>
            previous.map((entry) =>
              entry.id === id && entry.kind === "answer"
                ? { ...entry, text: entry.text + chunk }
                : entry
            )
          )
        },
      }
    )

    abort.current = null
    setBusy(false)
    // Settle the answer; drop it entirely if nothing arrived.
    setEntries((previous) =>
      previous.flatMap((entry) => {
        if (entry.id !== id || entry.kind !== "answer") return [entry]
        return entry.text ? [{ ...entry, streaming: false }] : []
      })
    )

    if (outcome.ok) {
      turns.current = [
        ...turns.current,
        { role: "user" as const, content: question },
        {
          role: "assistant" as const,
          content: answer.slice(0, MAX_ASSISTANT_CHARS),
        },
      ].slice(-MAX_TURNS * 2)
    } else if (outcome.reason === "aborted") {
      addOutput([text("Stopped.", "muted")])
    } else {
      // Shortcuts and the notes search keep working when the model is down.
      addOutput([
        text(FAILURE[outcome.reason], "muted"),
        ...(outcome.reason === "invalid_request"
          ? []
          : [text(""), ...answerOffline(question)]),
      ])
    }
  }

  /** `shown` is what appears in the visitor's bubble (a chip's label, say). */
  function submit(raw: string, shown = raw.trim()) {
    const input = raw.trim()
    if (busy || !input) return
    stickToBottom.current = true
    historyIndex.current = null
    setValue("")
    if (history.current[history.current.length - 1] !== input) {
      history.current.push(input)
    }

    const result = runCommand(input, { cwd, history: history.current })
    if (result.kind === "local" && result.effect?.type === "clear") {
      setEntries([])
      turns.current = []
      return
    }
    addEntry({ id: nextId.current++, kind: "user", text: shown })
    if (result.kind === "chat") {
      void ask(result.question)
      return
    }
    if (result.lines.length > 0) addOutput(result.lines)
    if (result.cwd) setCwd(result.cwd)
    if (result.effect?.type === "open") onOpen(result.effect.target)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    submit(value)
  }

  // Up/Down recall earlier messages, like a shell, without getting in the way
  // of normal typing.
  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowUp") {
      const past = history.current
      if (past.length === 0) return
      event.preventDefault()
      if (historyIndex.current === null) {
        draft.current = value
        historyIndex.current = past.length - 1
      } else {
        historyIndex.current = Math.max(0, historyIndex.current - 1)
      }
      setValue(past[historyIndex.current])
    } else if (event.key === "ArrowDown" && historyIndex.current !== null) {
      event.preventDefault()
      const next = historyIndex.current + 1
      if (next >= history.current.length) {
        historyIndex.current = null
        setValue(draft.current)
      } else {
        historyIndex.current = next
        setValue(history.current[next])
      }
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col text-sm">
      <div
        ref={scrollRef}
        onScroll={(event) => {
          const el = event.currentTarget
          stickToBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 24
        }}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4"
      >
        {entries.length === 0 && (
          <div>
            <p className="font-medium">
              Ask me anything about {firstName}&apos;s work.
            </p>
            <p className="mt-1 text-muted-foreground">
              I answer from his portfolio: projects, experience, skills and
              how to reach him.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={busy}
                  onClick={() => submit(suggestion)}
                  className={chipClass}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          role="log"
          aria-live="polite"
          aria-busy={busy}
          className="flex flex-col gap-3"
        >
          {entries.map((entry) => (
            <Message key={entry.id} entry={entry} />
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-border px-3 pt-2.5 pb-3">
        {/* The local commands, as one-tap shortcuts. They answer instantly
            and work even when the language model is unavailable. */}
        <div
          role="group"
          aria-label="Shortcuts"
          className="-mx-1 mb-2.5 flex gap-1.5 overflow-x-auto px-1 pb-0.5"
        >
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.command}
              type="button"
              disabled={busy}
              onClick={() => submit(action.command, action.label)}
              className={chipClass}
            >
              {action.label}
            </button>
          ))}
          {entries.length > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => submit("clear")}
              className={chipClass}
            >
              Clear chat
            </button>
          )}
        </div>

        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 rounded-xl border border-border bg-background pr-1.5 pl-3.5 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30"
        >
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask me anything about my work"
            aria-label={`Ask a question about ${profile.name}`}
            autoComplete="off"
            enterKeyHint="send"
            maxLength={MAX_INPUT_CHARS}
            // 16px on phones stops iOS from zooming the page on focus.
            className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
          />
          {busy ? (
            <button
              type="button"
              aria-label="Stop answering"
              onClick={() => abort.current?.abort()}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Square className="size-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              aria-label="Send"
              disabled={!value.trim()}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
