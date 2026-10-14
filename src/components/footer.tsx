import { profile } from "@/lib/content"

export function Footer({ width = "max-w-5xl" }: { width?: string }) {
  return (
    <footer className="border-t border-border/60">
      <div
        className={`mx-auto flex ${width} flex-col items-center justify-between gap-2 px-6 pt-8 pb-24 text-sm text-muted-foreground sm:flex-row xl:pb-8`}
      >
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
        <p>Built with Next.js, Tailwind CSS, and shadcn/ui.</p>
      </div>
    </footer>
  )
}
