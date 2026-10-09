import { text, type Line } from "./commands"
import { listFiles } from "./filesystem"

const STOPWORDS = new Set(
  "a an and are as at be by did do does for from has have he her him his how i in is it me my of on or she so tell that the their them they this to was were what when where which who why with you your about quinten".split(
    " "
  )
)

// Maps how people ask to the words the content actually uses.
const SYNONYMS: Record<string, string[]> = {
  built: ["projects", "built"],
  build: ["projects", "built"],
  made: ["projects", "built"],
  work: ["experience", "intern"],
  worked: ["experience", "intern"],
  job: ["experience", "intern"],
  jobs: ["experience", "intern"],
  ml: ["machine", "learning", "model"],
  ai: ["machine", "learning", "model"],
  school: ["education", "coursework"],
  study: ["education", "coursework"],
  studied: ["education", "coursework"],
  degree: ["education"],
  college: ["education"],
  reach: ["contact", "email"],
  hire: ["contact", "email"],
  stack: ["skills", "languages"],
  tech: ["skills", "tools"],
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9*+#]+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word))
}

/**
 * Keyword search over the same files the terminal exposes. Used when the
 * language model is unreachable, so a question still gets a factual answer
 * (it can only ever quote the content, never invent).
 */
export function answerOffline(question: string): Line[] {
  const terms = new Set(
    tokenize(question).flatMap((word) => [word, ...(SYNONYMS[word] ?? [])])
  )

  let best: { path: string; content: string; score: number } | null = null
  for (const file of listFiles()) {
    const pathWords = new Set(tokenize(file.path))
    const bodyWords = new Set(tokenize(file.content))
    let score = 0
    for (const term of terms) {
      if (pathWords.has(term)) score += 3
      if (bodyWords.has(term)) score += 1
    }
    if (score > 0 && (!best || score > best.score)) best = { ...file, score }
  }

  if (!best) {
    return [
      text("Nothing in my notes matched that directly.", "muted"),
      text("Try: ls, cat about.txt, or help", "muted"),
    ]
  }

  return [
    text(`Closest match in my notes: ${best.path}`, "muted"),
    text(""),
    ...best.content.split("\n").map((row) => text(row)),
  ]
}
