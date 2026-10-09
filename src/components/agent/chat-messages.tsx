import { memo } from "react"

import { cn } from "@/lib/utils"
import type { Line, Tone } from "@/lib/terminal/commands"

export type Entry =
  | { id: number; kind: "user"; text: string }
  | { id: number; kind: "output"; lines: Line[] }
  | { id: number; kind: "answer"; text: string; streaming: boolean }

// Tones are expressed with weight and the neutral text colours; the brand
// colour is reserved for focus rings and the send button.
const TONE: Record<Tone, string> = {
  muted: "text-muted-foreground",
  accent: "font-medium",
  error: "text-destructive",
  dir: "font-medium",
}

export function Lines({ lines }: { lines: Line[] }) {
  return lines.map((line, index) => (
    <div key={index} className="min-h-[0.6em] break-words whitespace-pre-wrap">
      {line.map((span, spanIndex) =>
        span.href ? (
          <a
            key={spanIndex}
            href={span.href}
            target={
              span.href.startsWith("#") || span.href.startsWith("mailto:")
                ? undefined
                : "_blank"
            }
            rel="noreferrer"
            className={cn(
              "rounded-sm font-medium underline decoration-border underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring",
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

/** Small models sometimes emit markdown despite being told not to; show plain text. */
function plain(value: string): string {
  return value.replace(/\*\*/g, "").replace(/^\s*[*•]\s+/gm, "- ")
}

// Memoized per entry: while an answer streams, only that entry re-renders.
export const Message = memo(function Message({ entry }: { entry: Entry }) {
  if (entry.kind === "user") {
    return (
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md border border-border bg-muted px-3 py-1.5 break-words whitespace-pre-wrap">
        {entry.text}
      </div>
    )
  }
  if (entry.kind === "output") {
    return (
      <div className="max-w-[94%] leading-relaxed">
        <Lines lines={entry.lines} />
      </div>
    )
  }
  return (
    <div className="max-w-[94%] leading-relaxed break-words whitespace-pre-wrap">
      {entry.text ? (
        plain(entry.text)
      ) : (
        <span className="animate-pulse text-muted-foreground motion-reduce:animate-none">
          Thinking…
        </span>
      )}
    </div>
  )
})
