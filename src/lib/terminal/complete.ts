import { COMMAND_NAMES, OPEN_TARGETS } from "./commands"
import { getNode, resolvePath, type Path } from "./filesystem"

export type Completion = {
  /** The input after completion (unchanged when nothing matched). */
  value: string
  /** Shown to the user when more than one option remains. */
  candidates: string[]
}

const PATH_COMMANDS = new Set(["ls", "cd", "cat"])

function commonPrefix(values: string[]): string {
  let prefix = values[0] ?? ""
  for (const value of values) {
    while (!value.startsWith(prefix)) prefix = prefix.slice(0, -1)
  }
  return prefix
}

function finish(head: string, partial: string, options: string[]): Completion {
  const matches = options.filter((option) => option.startsWith(partial))
  if (matches.length === 0) return { value: head + partial, candidates: [] }
  if (matches.length === 1) {
    // Directories end in "/" so the next Tab continues into them.
    const suffix = matches[0].endsWith("/") ? "" : " "
    return { value: head + matches[0] + suffix, candidates: [] }
  }
  return { value: head + commonPrefix(matches), candidates: matches }
}

export function complete(input: string, cwd: Path): Completion {
  const lastSpace = input.lastIndexOf(" ")
  if (lastSpace === -1) return finish("", input, COMMAND_NAMES)

  const command = input.trimStart().split(/\s+/)[0]
  const head = input.slice(0, lastSpace + 1)
  const partial = input.slice(lastSpace + 1)

  if (command === "open") return finish(head, partial, [...OPEN_TARGETS])
  if (!PATH_COMMANDS.has(command)) return { value: input, candidates: [] }

  const slash = partial.lastIndexOf("/")
  const dirPart = partial.slice(0, slash + 1)
  const base = partial.slice(slash + 1)
  const dir = getNode(resolvePath(cwd, dirPart || "."))
  if (!dir || dir.kind !== "dir") return { value: input, candidates: [] }

  const names = Object.entries(dir.children)
    .filter(([, node]) => command !== "cd" || node.kind === "dir")
    .map(([name, node]) => (node.kind === "dir" ? `${name}/` : name))

  const result = finish(head + dirPart, base, names)
  return result
}
