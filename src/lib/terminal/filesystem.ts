import {
  about,
  education,
  experience,
  profile,
  projects,
  skills,
  spokenLanguages,
} from "@/lib/content"

export type FsFile = { kind: "file"; content: string }
export type FsDir = { kind: "dir"; children: Record<string, FsNode> }
export type FsNode = FsFile | FsDir

/** A path is the list of directory names below the home directory. */
export type Path = string[]

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

const file = (content: string): FsFile => ({ kind: "file", content })

// The fake filesystem is derived from content.ts, so the terminal, the chat
// knowledge base and the site can never drift apart.
function build(): FsDir {
  const projectFiles: Record<string, FsNode> = {}
  for (const project of projects) {
    projectFiles[`${slugify(project.title)}.md`] = file(
      [
        `# ${project.title}`,
        "",
        project.description,
        "",
        `Tech: ${project.tech.join(", ")}`,
      ].join("\n")
    )
  }

  const experienceFiles: Record<string, FsNode> = {}
  for (const entry of experience) {
    experienceFiles[`${slugify(entry.org)}.md`] = file(
      [
        `# ${entry.role} at ${entry.org}`,
        `${entry.location} | ${entry.dates}`,
        "",
        ...entry.bullets.map((bullet) => `- ${bullet}`),
      ].join("\n")
    )
  }

  return {
    kind: "dir",
    children: {
      "about.txt": file(about.join("\n\n")),
      "contact.txt": file(
        [
          `Email:    ${profile.email}`,
          `LinkedIn: ${profile.linkedin}`,
          `GitHub:   ${profile.github}`,
          "",
          profile.availability,
        ].join("\n")
      ),
      "education.txt": file(
        [
          `${education.school} (${education.location})`,
          education.degree,
          `Threads: ${education.threads.join(", ")}`,
          "",
          `Coursework: ${education.coursework.join(", ")}`,
        ].join("\n")
      ),
      "skills.txt": file(
        [
          ...skills.map((group) => `${group.label}: ${group.items.join(", ")}`),
          `Spoken languages: ${spokenLanguages.join(", ")} (native)`,
        ].join("\n")
      ),
      projects: { kind: "dir", children: projectFiles },
      experience: { kind: "dir", children: experienceFiles },
    },
  }
}

export const ROOT: FsDir = build()

export function getNode(path: Path): FsNode | null {
  let node: FsNode = ROOT
  for (const segment of path) {
    if (node.kind !== "dir") return null
    const next: FsNode | undefined = node.children[segment]
    if (!next) return null
    node = next
  }
  return node
}

/** Resolves `target` against `cwd`. `~` and `/` both mean home; `..` never escapes it. */
export function resolvePath(cwd: Path, target: string): Path {
  const absolute = target.startsWith("~") || target.startsWith("/")
  const result = absolute ? [] : [...cwd]
  for (const segment of target.replace(/^~/, "").split("/")) {
    if (segment === "" || segment === ".") continue
    if (segment === "..") result.pop()
    else result.push(segment)
  }
  return result
}

export function formatPath(path: Path): string {
  return path.length === 0 ? "~" : `~/${path.join("/")}`
}

/** Every file with its display path, used for chat knowledge and offline search. */
export function listFiles(
  dir: FsDir = ROOT,
  prefix: Path = []
): { path: string; content: string }[] {
  return Object.entries(dir.children).flatMap(([name, node]) =>
    node.kind === "file"
      ? [{ path: [...prefix, name].join("/"), content: node.content }]
      : listFiles(node, [...prefix, name])
  )
}
