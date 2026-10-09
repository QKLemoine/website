import { profile } from "@/lib/content"

// Placeholder until the terminal phase: the shell registers the app so window
// management can be verified end to end first.
export function TerminalApp() {
  return (
    <div className="h-full overflow-y-auto bg-black/40 p-4 font-mono text-[13px] leading-relaxed text-emerald-300/90 select-text">
      <p>{profile.name.split(" ")[0].toLowerCase()}@portfolio ~ %</p>
      <p className="text-muted-foreground">
        Terminal comes online in the next phase.
      </p>
    </div>
  )
}
