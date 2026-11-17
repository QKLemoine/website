"use client"

import { Pause, Play, RotateCcw, StepForward } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { useVideosPaused } from "@/components/home/video-motion"
import { cn } from "@/lib/utils"

import {
  STAGES,
  STATS,
  STATUS_LABEL,
  TASKS,
  buildReplay,
  type ReplayEvent,
  type StageStatus,
} from "./data"

/** The replay never changes, so it is built once. */
const EVENTS = buildReplay()

const LABEL = "type-label text-muted-foreground"
const PANEL = "rounded-sm border border-border bg-card"

const TONE: Record<ReplayEvent["tone"], string> = {
  info: "text-muted-foreground",
  pass: "text-(--lc-ok)",
  fail: "text-(--lc-bad)",
}

const PILL: Record<StageStatus, string> = {
  running: "text-(--lc-ok)",
  written: "text-(--lc-wip)",
  planned: "text-muted-foreground",
}

/** True while `el` is at least partly on screen. */
function useOnScreen(el: React.RefObject<Element | null>) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const node = el.current
    if (!node) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(node)
    return () => io.disconnect()
  }, [el])
  return visible
}

/**
 * Steps through the replay every `ms` while `running`, looping at the end.
 * Returns the current index and a setter for manual stepping.
 */
function useReplay(length: number, running: boolean, ms: number, start = 0) {
  const [index, setIndex] = useState(start)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setIndex((i) => (i + 1) % length), ms)
    return () => clearInterval(id)
  }, [running, length, ms])
  return [index, setIndex] as const
}

function StatusPill({ status }: { status: StageStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 type-label whitespace-nowrap",
        PILL[status]
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  )
}

/**
 * The tile's moving picture: the pipeline's stages lighting up as the five
 * logged tasks pass through them, with the log underneath. Spans only, since
 * it sits inside the tile's button; always in the dark palette.
 */
export function LocalCoderPreview({ playing }: { playing: boolean }) {
  const root = useRef<HTMLSpanElement>(null)
  const events = EVENTS
  const visible = useOnScreen(root)
  const [index] = useReplay(events.length, playing && visible, 900, 9)
  const event = events[index]
  const recent = events.slice(Math.max(0, index - 7), index + 1)

  return (
    <span
      ref={root}
      className="local-coder dark flex size-full flex-col gap-4 bg-[#0d0e10] p-5 font-mono text-[#f4f4f2] sm:p-6"
    >
      <span className="grid grid-cols-4 gap-1.5 lg:grid-cols-8">
        {STAGES.map((stage, i) => (
          <span
            key={stage.key}
            className={cn(
              "truncate rounded-sm border px-2 py-1.5 text-[0.6875rem] tracking-[0.06em] uppercase lg:py-2.5 lg:text-[0.75rem] transition-colors duration-(--duration-fast)",
              i === event.stage
                ? "border-(--accent-dark) bg-(--accent-dark)/15 text-white"
                : stage.status === "running"
                  ? "border-white/15 text-white/60"
                  : "border-dashed border-white/10 text-white/30"
            )}
          >
            {i + 1} · {stage.key}
          </span>
        ))}
      </span>
      <span className="flex items-baseline justify-between gap-4 text-[0.75rem] text-white/60 lg:text-[0.875rem]">
        <span className="truncate">
          {TASKS[event.task].id} · {TASKS[event.task].name}
        </span>
        <span className="shrink-0">
          dataset <span className="text-white">{event.dataset}</span> pairs
        </span>
      </span>
      <span className="flex flex-col gap-1 text-[0.75rem] leading-snug lg:gap-1.5 lg:text-[0.875rem]">
        {recent.map((e, i) => (
          <span
            key={index - recent.length + 1 + i}
            className={cn(
              "truncate",
              e.tone === "pass"
                ? "text-(--lc-ok)"
                : e.tone === "fail"
                  ? "text-(--lc-bad)"
                  : "text-white/55",
              i < recent.length - 1 && "opacity-60",
              // Phones show the three newest lines.
              i < recent.length - 3 && "max-sm:hidden",
              i < recent.length - 5 && "max-lg:hidden"
            )}
          >
            {">"} {e.text}
          </span>
        ))}
      </span>
    </span>
  )
}

const BUTTON =
  "inline-flex min-h-8 items-center gap-1.5 rounded-sm border border-border px-3 type-small font-medium outline-none transition-colors hover:border-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"

/**
 * The project's dialog view: the eight-stage pipeline with its status, a
 * replay of the first logged runs moving through it, the run log, the
 * headline numbers and the GPU memory budget.
 */
export function LocalCoderDemo() {
  const root = useRef<HTMLDivElement>(null)
  const logRef = useRef<HTMLOListElement>(null)
  const events = EVENTS
  const visible = useOnScreen(root)
  // Follows the site's video switch until the visitor chooses here.
  const videosPaused = useVideosPaused()
  const [choice, setChoice] = useState<boolean | null>(null)
  const playing = choice ?? !videosPaused
  const [index, setIndex] = useReplay(events.length, playing && visible, 1100)
  const event = events[index]
  const shown = events.slice(0, index + 1)

  // Keep the newest log line in view, without moving the page.
  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [index])

  return (
    <div ref={root} className="local-coder space-y-4">
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {STAGES.map((stage, i) => (
          <li
            key={stage.key}
            aria-current={i === event.stage ? "step" : undefined}
            className={cn(
              PANEL,
              "flex flex-col gap-1.5 p-3 transition-colors duration-(--duration-fast)",
              i === event.stage && "border-primary ring-1 ring-primary",
              stage.status !== "running" && "border-dashed"
            )}
          >
            <span className={LABEL}>
              {i + 1} · {stage.key}
            </span>
            <span className="type-small font-semibold">{stage.title}</span>
            <span className="type-caption text-muted-foreground">
              {stage.text}
            </span>
            <span className="mt-auto pt-1">
              <StatusPill status={stage.status} />
            </span>
          </li>
        ))}
      </ol>
      <p className="type-caption text-muted-foreground">
        <span className="type-label text-primary">Loop</span> The fine-tuned
        model replaces the base model in step 3, under the same name, and the
        cycle continues with fresh logs.
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className={cn(PANEL, "flex min-w-0 flex-col")}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <p className={LABEL}>
              Replay of the first logged runs · task {event.task + 1} of{" "}
              {TASKS.length}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setChoice(!playing)}
                className={cn(
                  BUTTON,
                  "border-foreground bg-foreground text-background"
                )}
              >
                {playing ? (
                  <Pause aria-hidden className="size-3.5" />
                ) : (
                  <Play aria-hidden className="size-3.5" />
                )}
                {playing ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setChoice(false)
                  setIndex((i) => (i + 1) % events.length)
                }}
                className={BUTTON}
              >
                <StepForward aria-hidden className="size-3.5" />
                Step
              </button>
              <button
                type="button"
                onClick={() => setIndex(0)}
                className={BUTTON}
              >
                <RotateCcw aria-hidden className="size-3.5" />
                Restart
              </button>
            </div>
          </div>
          <ol
            ref={logRef}
            aria-live="polite"
            className="h-64 overflow-y-auto px-4 py-3 font-mono type-caption"
          >
            {shown.map((e, i) => (
              <li
                key={i}
                className={cn(
                  "flex gap-3 py-0.5",
                  TONE[e.tone],
                  i === index && "font-semibold"
                )}
              >
                <span className="w-16 shrink-0 text-muted-foreground">
                  {STAGES[e.stage].key}
                </span>
                <span className="min-w-0">{e.text}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className={cn(PANEL, "p-4")}>
            <p className={LABEL}>Verified training pairs</p>
            <p className="mt-1 type-heading font-bold tabular-nums">
              {event.dataset}
            </p>
            <p className="type-caption text-muted-foreground">
              A first QLoRA run is planned at roughly 500.
            </p>
          </div>
          <div className={cn(PANEL, "p-4")}>
            <p className={LABEL}>GPU memory · GTX 1070, 8 GB</p>
            <div
              role="img"
              aria-label="About 5.7 GB for the model and its context, about 2.3 GB for the desktop and other use, of 8 GB"
              className="mt-3 flex h-7 overflow-hidden rounded-sm border border-border font-mono text-[0.6875rem]"
            >
              <span className="flex w-[71%] items-center bg-primary px-2 text-primary-foreground">
                Q4 9B + 8k KV · 5.7 GB
              </span>
              <span className="flex flex-1 items-center px-2 text-muted-foreground">
                ~2.3 GB
              </span>
            </div>
            <p className="mt-2 type-caption text-muted-foreground">
              Inference runs locally; training needs a newer GPU, so it runs on
              a rented one.
            </p>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="border-t-2 border-foreground pt-2">
            <dt className="sr-only">{stat.label}</dt>
            <dd className="type-title font-bold tabular-nums">{stat.value}</dd>
            <dd className="type-caption text-muted-foreground">{stat.label}</dd>
          </div>
        ))}
      </dl>
      <p className="max-w-[90ch] type-caption text-muted-foreground">
        From the real logs of the base model, before any fine-tuning, on five
        tasks from the project: a small sample that shows the loop works, not
        how good the model is. Times marked with model load in the replay
        include loading it into GPU memory.
      </p>
    </div>
  )
}
