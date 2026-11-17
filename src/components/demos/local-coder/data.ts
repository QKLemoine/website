// The verifier-gated local coder's pipeline and its first logged runs, as
// reported in the project write-up. Every number here comes from the real
// logs of the base model (before fine-tuning) on five tasks.

export type StageStatus = "running" | "written" | "planned"

export type Stage = {
  key: string
  title: string
  text: string
  status: StageStatus
}

export const STAGES: Stage[] = [
  {
    key: "plan",
    title: "Task decomposition",
    text: "A frontier model (Claude) splits a feature into small tasks with exact signatures and acceptance criteria.",
    status: "running",
  },
  {
    key: "budget",
    title: "Context packing",
    text: "Each task must fit a 4,500-token prompt. Large files are referenced by section or line range, not whole.",
    status: "running",
  },
  {
    key: "generate",
    title: "Local model",
    text: "Qwen3.5-9B writes complete files on an isolated git branch.",
    status: "running",
  },
  {
    key: "verify",
    title: "Static verifiers",
    text: "A linter, a strict type checker and a deprecated-API scan. Errors go back to the model, up to 3 attempts.",
    status: "running",
  },
  {
    key: "review",
    title: "Model review",
    text: "The frontier model approves, or writes notes for another round. The local model fixes its own code.",
    status: "running",
  },
  {
    key: "distil",
    title: "Dataset build",
    text: "Approved tasks become (first prompt → final verified code) pairs.",
    status: "running",
  },
  {
    key: "train",
    title: "QLoRA fine-tune",
    text: "4-bit base, LoRA adapters, on a rented GPU. Exported back to GGUF for local use.",
    status: "written",
  },
  {
    key: "ground",
    title: "Retrieval (RAG)",
    text: "Retrieve API reference and existing code into the prompt at task time.",
    status: "planned",
  },
]

export const STATUS_LABEL: Record<StageStatus, string> = {
  running: "Running",
  written: "Written, not yet run",
  planned: "Planned",
}

export type Attempt = {
  round: number
  attempt: number
  /** null when the verifiers passed. */
  error: string | null
  promptTokens: number
  outputTokens: number
  seconds: number
  /** The time includes loading the model into GPU memory. */
  coldStart?: boolean
}

export type LoggedTask = { id: string; name: string; attempts: Attempt[] }

export const TASKS: LoggedTask[] = [
  {
    id: "T-001",
    name: "Vote-counting class",
    attempts: [
      {
        round: 1,
        attempt: 1,
        error: "type error",
        promptTokens: 1380,
        outputTokens: 449,
        seconds: 83.9,
        coldStart: true,
      },
      {
        round: 1,
        attempt: 2,
        error: "same error",
        promptTokens: 1888,
        outputTokens: 449,
        seconds: 19.9,
      },
      {
        round: 1,
        attempt: 3,
        error: "same error",
        promptTokens: 1888,
        outputTokens: 449,
        seconds: 17.8,
      },
      {
        round: 2,
        attempt: 1,
        error: null,
        promptTokens: 1975,
        outputTokens: 405,
        seconds: 20.1,
      },
    ],
  },
  {
    id: "T-002",
    name: "Gift validation rules",
    attempts: [
      {
        round: 1,
        attempt: 1,
        error: null,
        promptTokens: 1439,
        outputTokens: 295,
        seconds: 12.9,
      },
    ],
  },
  {
    id: "T-003",
    name: "Weighted roll + pity counter",
    attempts: [
      {
        round: 1,
        attempt: 1,
        error: "lint error",
        promptTokens: 1613,
        outputTokens: 338,
        seconds: 76.8,
        coldStart: true,
      },
      {
        round: 1,
        attempt: 2,
        error: null,
        promptTokens: 2040,
        outputTokens: 337,
        seconds: 15.3,
      },
    ],
  },
  {
    id: "T-004",
    name: "Daily streak reward",
    attempts: [
      {
        round: 1,
        attempt: 1,
        error: null,
        promptTokens: 1539,
        outputTokens: 331,
        seconds: 16.3,
      },
    ],
  },
  {
    id: "T-005",
    name: "Trade offer validation",
    attempts: [
      {
        round: 1,
        attempt: 1,
        error: null,
        promptTokens: 1570,
        outputTokens: 335,
        seconds: 14.4,
      },
    ],
  },
]

export const STATS = [
  { value: "5 / 5", label: "tasks approved" },
  { value: "3 / 5", label: "passed verifiers on the first attempt" },
  { value: "16.7 s", label: "mean time per attempt, model loaded" },
  { value: "1,704", label: "mean prompt tokens" },
]

/** One beat of the replay: which stage lights up and what the log says. */
export type ReplayEvent = {
  stage: number
  task: number
  tone: "info" | "pass" | "fail"
  text: string
  /** The verified-pairs count after this event. */
  dataset: number
}

const fmt = (n: number) => n.toLocaleString("en-US")

/** Turns the logged runs into the sequence of pipeline steps they went through. */
export function buildReplay(): ReplayEvent[] {
  const events: ReplayEvent[] = []
  let dataset = 0
  TASKS.forEach((task, t) => {
    const push = (stage: number, tone: ReplayEvent["tone"], text: string) =>
      events.push({ stage, task: t, tone, text, dataset })
    push(0, "info", `${task.id} planned: ${task.name}`)
    push(
      1,
      "info",
      `Prompt packed: ${fmt(task.attempts[0].promptTokens)} tokens, under the 4,500 budget`
    )
    task.attempts.forEach((a, i) => {
      const next = task.attempts[i + 1]
      push(
        2,
        "info",
        `Round ${a.round}, attempt ${a.attempt}: ${fmt(a.outputTokens)} tokens in ${a.seconds} s${a.coldStart ? " (incl. model load)" : ""}`
      )
      if (a.error) {
        push(3, "fail", `Verifiers: ${a.error}`)
        if (next && next.round > a.round) {
          push(4, "info", "Review: notes written for another round")
        }
      } else {
        push(3, "pass", "Verifiers: pass")
      }
    })
    push(4, "pass", "Review: approved")
    dataset++
    push(5, "pass", `Training pair added (first prompt → final verified code)`)
  })
  return events
}
