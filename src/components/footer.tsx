import { profile } from "@/lib/content"

export function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 pt-8 pb-24 xl:pb-8 text-sm text-muted-foreground sm:flex-row">
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
        <p>Built with Next.js, Tailwind CSS, and shadcn/ui.</p>
      </div>
    </footer>
  )
}
