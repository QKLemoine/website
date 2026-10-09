"use client"

import {
  useEffect,
  useRef,
  useState,
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
  promptLabel,
  runCommand,
  text,
  type Line,
  type OpenTarget,
} from "@/lib/terminal/commands"
import { complete } from "@/lib/terminal/complete"
import type { Path } from "@/lib/terminal/filesystem"
import { answerOffline } from "@/lib/terminal/offline-answer"

import { emitBackgroundEvent } from "@/components/background/events"

import { Cursor, EntryView, type Entry } from "./terminal-output"

const SUGGESTIONS = [
  "What has he built?",
  "What's his ML experience?",
  "Is he open to roles?",
]

type FailureReason = Exclude<Extract<ChatOutcome, { ok: false }>["reason"], "aborted">

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

export function TerminalView({
  inputRef,
  onOpen,
}: {
  /** Owned by the panel so the dialog can focus the prompt when it opens. */
  inputRef: RefObject<HTMLInputElement | null>
  /** Called when a command asks to scroll somewhere (`open projects`). */
  onOpen: (target: OpenTarget) => void
}) {

  const [entries, setEntries] = useState<Entry[]>([])
  const [showBanner, setShowBanner] = useState(true)
  const [value, setValue] = useState("")
  const [caret, setCaret] = useState(0)
  const [cwd, setCwd] = useState<Path>([])
  const [busy, setBusy] = useState(false)
  const [focused, setFocused] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(0)
  const history = useRef<string[]>([])
  const historyIndex = useRef<number | null>(null)
  const draft = useRef("")
  const turns = useRef<ChatMessage[]>([])
  const abort = useRef<AbortController | null>(null)
  // Follow new output unless the visitor has scrolled up to read.
  const stickToBottom = useRef(true)

  useEffect(() => {
    const root = rootRef.current
    if (root && stickToBottom.current) root.scrollTop = root.scrollHeight
  }, [entries, value, busy])

  useEffect(() => () => abort.current?.abort(), [])

  function addEntry(entry: Entry) {
    setEntries((previous) => [...previous, entry])
  }
  function addOutput(lines: Line[]) {
    addEntry({ id: nextId.current++, kind: "output", lines })
  }
  function addCommand(input: string) {
    addEntry({
      id: nextId.current++,
      kind: "command",
      prompt: promptLabel(cwd),
      input,
    })
  }
  function setInput(next: string) {
    setValue(next)
    setCaret(next.length)
  }
  function clearScreen() {
    setEntries([])
    setShowBanner(false)
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

    // Let the background stir around the panel while the answer streams.
    const rect = rootRef.current?.getBoundingClientRect()
    const origin = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : { x: 0, y: 0 }
    emitBackgroundEvent({ type: "activity", active: true, ...origin })

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

    emitBackgroundEvent({ type: "activity", active: false, ...origin })
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
      addOutput([text("^C", "muted")])
    } else {
      // Local commands and the notes search keep working when the model is down.
      addOutput([
        text(FAILURE[outcome.reason], "muted"),
        ...(outcome.reason === "invalid_request"
          ? []
          : [text(""), ...answerOffline(question)]),
      ])
    }
  }

  function submit(raw: string) {
    if (busy) return
    const input = raw.trim()
    stickToBottom.current = true
    historyIndex.current = null
    addCommand(raw)
    setInput("")
    if (!input) return
    if (history.current[history.current.length - 1] !== input) {
      history.current.push(input)
    }

    const result = runCommand(input, { cwd, history: history.current })
    if (result.kind === "chat") {
      void ask(result.question)
      return
    }
    if (result.effect?.type === "clear") {
      clearScreen()
      return
    }
    if (result.lines.length > 0) addOutput(result.lines)
    if (result.cwd) setCwd(result.cwd)
    if (result.effect?.type === "open") onOpen(result.effect.target)
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.ctrlKey && event.key.toLowerCase() === "c") {
      event.preventDefault()
      if (busy) abort.current?.abort()
      else if (value) {
        addCommand(`${value}^C`)
        setInput("")
      }
      return
    }
    if (event.ctrlKey && event.key.toLowerCase() === "l") {
      event.preventDefault()
      clearScreen()
      return
    }

    switch (event.key) {
      case "Enter":
        event.preventDefault()
        submit(value)
        break
      case "ArrowUp": {
        const past = history.current
        if (past.length === 0) break
        event.preventDefault()
        if (historyIndex.current === null) {
          draft.current = value
          historyIndex.current = past.length - 1
        } else {
          historyIndex.current = Math.max(0, historyIndex.current - 1)
        }
        setInput(past[historyIndex.current])
        break
      }
      case "ArrowDown": {
        if (historyIndex.current === null) break
        event.preventDefault()
        const next = historyIndex.current + 1
        if (next >= history.current.length) {
          historyIndex.current = null
          setInput(draft.current)
        } else {
          historyIndex.current = next
          setInput(history.current[next])
        }
        break
      }
      case "Tab": {
        // With an empty prompt Tab keeps its normal job, so keyboard users
        // can always move focus out of the terminal.
        if (value === "" || event.shiftKey) break
        event.preventDefault()
        const completion = complete(value, cwd)
        if (completion.candidates.length > 1) {
          addCommand(value)
          addOutput([text(completion.candidates.join("   "), "muted")])
        }
        setInput(completion.value)
        break
      }
    }
  }

  return (
    <div
      ref={rootRef}
      onScroll={(event) => {
        const el = event.currentTarget
        stickToBottom.current =
          el.scrollHeight - el.scrollTop - el.clientHeight < 24
      }}
      onMouseUp={() => {
        // Don't steal focus (and the selection) while the visitor is copying text.
        if (!window.getSelection()?.toString()) {
          inputRef.current?.focus({ preventScroll: true })
        }
      }}
      className="min-h-0 flex-1 cursor-text overflow-y-auto overscroll-contain p-3.5 font-mono text-[13px] leading-[1.55] text-zinc-200"
    >
      {showBanner && (
        <div className="mb-3">
          <p className="text-emerald-300">
            {profile.name} · portfolio shell
          </p>
          <p className="text-zinc-400">
            Ask a question about me in plain English, or try:{" "}
            <span className="text-zinc-200">help</span>,{" "}
            <span className="text-zinc-200">projects</span>,{" "}
            <span className="text-zinc-200">contact</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={busy}
                onClick={() => submit(suggestion)}
                className="rounded-full border border-emerald-300/30 px-2.5 py-0.5 text-xs text-emerald-200 outline-none transition-colors hover:bg-emerald-300/10 focus-visible:ring-1 focus-visible:ring-emerald-300 disabled:opacity-40"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div role="log" aria-live="polite" aria-busy={busy}>
        {entries.map((entry) => (
          <EntryView key={entry.id} entry={entry} />
        ))}
      </div>

      <label className="relative block">
        {/* While an answer streams the prompt is hidden, like a real shell,
            but the input stays mounted so Ctrl+C still works. */}
        <span
          aria-hidden
          className={
            busy ? "block h-0 overflow-hidden" : "break-all whitespace-pre-wrap"
          }
        >
          <span className="text-emerald-300">{promptLabel(cwd)}</span>{" "}
          {value.slice(0, caret)}
          <Cursor char={value[caret] ?? " "} focused={focused} />
          {value.slice(caret + 1)}
          {value === "" && (
            <span className="text-zinc-600"> ask anything, or type help</span>
          )}
        </span>
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setCaret(event.target.selectionStart ?? event.target.value.length)
          }}
          onSelect={(event) =>
            setCaret(event.currentTarget.selectionStart ?? value.length)
          }
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Terminal prompt. Type a command, or a question about Quinten."
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          maxLength={MAX_INPUT_CHARS}
          // Invisible but real: it owns the keyboard (including on phones) while
          // the styled mirror above shows the text and block cursor. 16px
          // prevents iOS from zooming the page on focus.
          className="absolute inset-0 w-full cursor-text text-base opacity-0"
        />
      </label>
    </div>
  )
}
