import { education, experience, profile, projects, skills } from "@/lib/content"

import {
  formatPath,
  getNode,
  resolvePath,
  ROOT,
  slugify,
  type Path,
} from "./filesystem"

export type Tone = "muted" | "accent" | "error" | "dir"
export type Span = { text: string; tone?: Tone; href?: string }
export type Line = Span[]

export const text = (value: string, tone?: Tone): Line => [{ text: value, tone }]

/** Page sections `open` can scroll to. */
export const OPEN_TARGETS = [
  "projects",
  "about",
  "experience",
  "contact",
  "top",
] as const
export type OpenTarget = (typeof OPEN_TARGETS)[number]

export type CommandEffect =
  | { type: "clear" }
  | { type: "open"; target: OpenTarget }

export type CommandResult =
  | { kind: "local"; lines: Line[]; cwd?: Path; effect?: CommandEffect }
  | { kind: "chat"; question: string }

export type CommandContext = { cwd: Path; history: string[] }

type Command = {
  summary: string
  usage?: string
  /** Hidden commands work but are left out of `help`. */
  hidden?: boolean
  run: (args: string[], ctx: CommandContext) => Omit<
    Extract<CommandResult, { kind: "local" }>,
    "kind"
  >
}

const HOME = "/home/quinten"
const firstName = profile.name.split(" ")[0]

function isOpenTarget(value: string): value is OpenTarget {
  return (OPEN_TARGETS as readonly string[]).includes(value)
}

const COMMANDS: Record<string, Command> = {
  help: {
    summary: "Show this list",
    run: () => ({
      lines: [
        text("Commands", "accent"),
        ...Object.entries(COMMANDS)
          .filter(([, command]) => !command.hidden)
          .map(([name, command]) =>
            text(`  ${(command.usage ?? name).padEnd(16)}${command.summary}`)
          ),
        text("  ls, cd, cat     Browse the same content as files", "muted"),
        text(""),
        text(
          `Anything else is treated as a question about ${firstName}. Try: what has he built?`,
          "muted"
        ),
      ],
    }),
  },
  projects: {
    summary: `What ${firstName} has built`,
    run: () => ({
      lines: [
        ...projects.flatMap((project): Line[] => [
          [
            {
              text: project.title,
              tone: "accent",
              href: `#project-${slugify(project.title)}`,
            },
          ],
          text(`  ${project.summary}`, "muted"),
        ]),
        text(""),
        text("Select a title to jump to it on the page.", "muted"),
      ],
    }),
  },
  experience: {
    summary: `Where ${firstName} has worked`,
    run: () => ({
      lines: [
        ...experience.map((entry): Line => [
          { text: `${entry.role} · ${entry.org}`, href: "#experience" },
          { text: `  ${entry.dates}`, tone: "muted" },
        ]),
      ],
    }),
  },
  skills: {
    summary: "Languages, ML, robotics and tools",
    run: () => ({
      lines: skills.map((group): Line => [
        { text: `${group.label}: `, tone: "accent" },
        { text: group.items.join(", ") },
      ]),
    }),
  },
  whoami: {
    summary: `Who ${firstName} is, in three lines`,
    run: () => ({
      lines: [
        text(profile.name, "accent"),
        text(`${profile.title} · ${profile.location}`),
        text(profile.pitch, "muted"),
      ],
    }),
  },
  ls: {
    hidden: true,
    summary: "List files",
    usage: "ls [path]",
    run: ([target = "."], { cwd }) => {
      const node = getNode(resolvePath(cwd, target))
      if (!node)
        return {
          lines: [text(`ls: ${target}: No such file or directory`, "error")],
        }
      if (node.kind === "file") return { lines: [text(target)] }
      const entries = Object.entries(node.children).sort(
        ([aName, a], [bName, b]) =>
          Number(b.kind === "dir") - Number(a.kind === "dir") ||
          aName.localeCompare(bName)
      )
      return {
        lines: entries.map(([name, child]) =>
          child.kind === "dir" ? text(`${name}/`, "dir") : text(name)
        ),
      }
    },
  },
  cd: {
    hidden: true,
    summary: "Change directory",
    usage: "cd [path]",
    run: ([target = "~"], { cwd }) => {
      const path = resolvePath(cwd, target)
      const node = getNode(path)
      if (!node)
        return {
          lines: [text(`cd: no such file or directory: ${target}`, "error")],
        }
      if (node.kind !== "dir")
        return { lines: [text(`cd: not a directory: ${target}`, "error")] }
      return { lines: [], cwd: path }
    },
  },
  cat: {
    hidden: true,
    summary: "Print a file",
    usage: "cat <file>",
    run: ([target], { cwd }) => {
      if (!target) return { lines: [text("usage: cat <file>", "muted")] }
      const node = getNode(resolvePath(cwd, target))
      if (!node)
        return {
          lines: [text(`cat: ${target}: No such file or directory`, "error")],
        }
      if (node.kind === "dir")
        return { lines: [text(`cat: ${target}: Is a directory`, "error")] }
      return { lines: node.content.split("\n").map((row) => text(row)) }
    },
  },
  pwd: {
    hidden: true,
    summary: "Print the working directory",
    run: (_args, { cwd }) => ({
      lines: [text([HOME, ...cwd].join("/"))],
    }),
  },
  open: {
    summary: "Scroll the page to a section",
    usage: "open <section>",
    run: ([target]) => {
      if (!target || !isOpenTarget(target))
        return {
          lines: [
            text(
              target ? `open: no such section: ${target}` : "usage: open <section>",
              target ? "error" : "muted"
            ),
            text(`Available: ${OPEN_TARGETS.join(", ")}`, "muted"),
          ],
        }
      return {
        lines: [text(`Scrolling to ${target}...`, "muted")],
        effect: { type: "open", target },
      }
    },
  },
  contact: {
    summary: `How to reach ${firstName}`,
    run: () => ({
      lines: [
        [
          { text: "Email     " },
          {
            text: profile.email,
            tone: "accent",
            href: `mailto:${profile.email}`,
          },
        ],
        [
          { text: "LinkedIn  " },
          { text: profile.linkedin, tone: "accent", href: profile.linkedin },
        ],
        [
          { text: "GitHub    " },
          { text: profile.github, tone: "accent", href: profile.github },
        ],
      ],
    }),
  },
  history: {
    hidden: true,
    summary: "Show what you've typed",
    run: (_args, { history }) => ({
      lines: history.map((entry, index) =>
        text(`${String(index + 1).padStart(4)}  ${entry}`)
      ),
    }),
  },
  clear: {
    summary: "Clear the screen",
    run: () => ({ lines: [], effect: { type: "clear" } }),
  },
  neofetch: {
    summary: "System summary",
    hidden: true,
    run: () => ({
      lines: [
        text(`${firstName.toLowerCase()}@portfolio`, "accent"),
        text("-----------------"),
        text(`Role      ${profile.title}`),
        text(`School    ${education.school}`),
        text(`Threads   ${education.threads.join(", ")}`),
        text(`Location  ${profile.location}`),
        text(`Stack     ${skills[0].items.join(", ")}`),
        text("Shell     portfolio-sh, built on Next.js"),
      ],
    }),
  },
  echo: {
    summary: "Print text",
    hidden: true,
    run: (args) => ({ lines: [text(args.join(" "))] }),
  },
  sudo: {
    summary: "Nice try",
    hidden: true,
    run: () => ({
      lines: [
        text(
          "visitor is not in the sudoers file. This incident will be reported.",
          "error"
        ),
        text(`(To ${firstName}. He'll be flattered.)`, "muted"),
      ],
    }),
  },
  rm: {
    summary: "Also nice try",
    hidden: true,
    run: (args) =>
      args.some((arg) => /^-\w*r/.test(arg)) && args.includes("/")
        ? {
            lines: [
              text("rm: removing /projects ..."),
              text("rm: removing /experience ..."),
              text("rm: removing /career ..."),
              text(""),
              text(
                "Just kidding. This filesystem is read-only and everything is still here.",
                "accent"
              ),
            ],
          }
        : {
            lines: [
              text("rm: permission denied: this portfolio is read-only", "error"),
            ],
          },
  },
  exit: {
    summary: "Leave",
    hidden: true,
    run: () => ({
      lines: [
        text(
          "There's no shell to return to. Press Esc to close this panel.",
          "muted"
        ),
      ],
    }),
  },
}

export const COMMAND_NAMES = Object.keys(COMMANDS)

/** Commands whose arguments are free text, so they are never mistaken for a question. */
const FREE_TEXT_COMMANDS = new Set(["echo", "sudo", "rm"])

// A visitor may type "open source work?" or "history of his research". Input
// that starts with a command word but reads like a sentence goes to chat.
function readsLikeQuestion(raw: string, tokens: string[]): boolean {
  if (FREE_TEXT_COMMANDS.has(tokens[0].replace(/^\//, ""))) return false
  return raw.includes("?") || tokens.length > 3
}

export function runCommand(
  input: string,
  ctx: CommandContext
): CommandResult {
  const raw = input.trim()
  if (!raw) return { kind: "local", lines: [] }

  const tokens = raw.split(/\s+/)
  // A leading slash is optional: `/help` and `help` are the same command.
  const name = tokens[0].replace(/^\//, "")
  const args = tokens.slice(1)
  const command = COMMANDS[name.toLowerCase()]

  if (command && !readsLikeQuestion(raw, tokens)) {
    return { kind: "local", ...command.run(args, ctx) }
  }

  if (tokens.length === 1 && !command) {
    // A bare word that names something in the home directory is a shortcut:
    // `skills` prints skills.txt, `projects` lists the folder.
    const lowered = name.toLowerCase().replace(/\?$/, "")
    const match = Object.entries(ROOT.children).find(
      ([entry]) => entry.replace(/\.\w+$/, "") === lowered
    )
    if (match) {
      const [entry, node] = match
      const shortcut = node.kind === "dir" ? COMMANDS.ls : COMMANDS.cat
      return { kind: "local", ...shortcut.run([`~/${entry}`], ctx) }
    }
    if (!raw.includes("?")) {
      return {
        kind: "local",
        lines: [
          text(`command not found: ${name}`, "error"),
          text("Type help for commands, or ask a question in plain English.", "muted"),
        ],
      }
    }
  }

  return { kind: "chat", question: raw }
}

/** The prompt shown before each command, e.g. "~/projects ›". */
export function promptLabel(cwd: Path): string {
  return `${formatPath(cwd)} ›`
}
