import { memo } from "react"

import { cn } from "@/lib/utils"
import type { Line, Tone } from "@/lib/terminal/commands"

export type Entry =
  | { id: number; kind: "command"; prompt: string; input: string }
  | { id: number; kind: "output"; lines: Line[] }
  | { id: number; kind: "answer"; text: string; streaming: boolean }

const TONE: Record<Tone, string> = {
  muted: "text-zinc-500",
  accent: "text-emerald-300",
  error: "text-red-400",
  dir: "font-medium text-sky-400",
}

export function Lines({ lines }: { lines: Line[] }) {
  return lines.map((line, index) => (
    <div key={index} className="min-h-[1.5em] break-words whitespace-pre-wrap">
      {line.map((span, spanIndex) =>
        span.href ? (
          <a
            key={spanIndex}
            href={span.href}
            target={span.href.startsWith("mailto:") ? undefined : "_blank"}
            rel="noreferrer"
            className={cn(
              "underline underline-offset-2 outline-none focus-visible:ring-1 focus-visible:ring-emerald-300",
              span.tone && TONE[span.tone]
            )}
          >
            {span.text}
          </a>
        ) : (
          <span key={spanIndex} className={span.tone && TONE[span.tone]}>
            {span.text}
          </span>
        )
      )}
    </div>
  ))
}

export function Cursor({ char = " ", focused = true }: { char?: string; focused?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block min-w-[1ch] whitespace-pre",
        focused
          ? "animate-[terminal-blink_1.1s_steps(1)_infinite] bg-emerald-300 text-black motion-reduce:animate-none"
          : "outline outline-1 -outline-offset-1 outline-emerald-300/70"
      )}
    >
      {char}
    </span>
  )
}

/** Small models sometimes emit markdown despite being told not to; a terminal shows plain text. */
function plain(value: string): string {
  return value.replace(/\*\*/g, "").replace(/^\s*[*•]\s+/gm, "- ")
}

// Memoized per entry: while an answer streams, only that entry re-renders.
export const EntryView = memo(function EntryView({ entry }: { entry: Entry }) {
  if (entry.kind === "command") {
    return (
      <div className="break-words whitespace-pre-wrap">
        <span className="text-emerald-300">{entry.prompt}</span> {entry.input}
      </div>
    )
  }
  if (entry.kind === "output") return <Lines lines={entry.lines} />
  return (
    <div className="break-words whitespace-pre-wrap text-zinc-100">
      {plain(entry.text)}
      {entry.streaming && <Cursor />}
    </div>
  )
})
