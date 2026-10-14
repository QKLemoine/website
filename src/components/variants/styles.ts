// Temporary: the homepage styles being compared. Once one is picked, delete
// the others, this file and the switcher, and render the winner from page.tsx.

export const STYLES = [
  { id: "current", label: "Current" },
  { id: "bento", label: "Bento" },
  { id: "notebook", label: "Notebook" },
  { id: "editorial", label: "Editorial" },
  { id: "combined", label: "Combined" },
] as const

export type StyleId = (typeof STYLES)[number]["id"]

/** Reads `?style=`; anything unrecognised falls back to the current design. */
export function parseStyle(value: string | string[] | undefined): StyleId {
  return STYLES.find((style) => style.id === value)?.id ?? "current"
}
