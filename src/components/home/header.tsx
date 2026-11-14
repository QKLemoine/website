import Image from "next/image"

import { AskPrompt } from "@/components/agent/ask-triggers"
import { askExamples, education, profile } from "@/lib/content"
import { cn } from "@/lib/utils"

import { socials } from "./shared"

function Portrait({
  sizes,
  preload = false,
  className,
}: {
  sizes: string
  preload?: boolean
  className?: string
}) {
  return (
    <div
      className={cn("relative aspect-4/5 overflow-hidden bg-media", className)}
    >
      <Image
        src="/headshot.jpg"
        alt={profile.name}
        fill
        sizes={sizes}
        className="object-cover object-[50%_20%]"
        preload={preload}
        loading={preload ? undefined : "eager"}
      />
    </div>
  )
}

/**
 * The page's opening, on the same 12-column grid as everything below it.
 * Who and where sit in a quiet row of metadata; the headline is the one
 * large statement; the summary, Ask bar and links close it under a
 * hairline.
 */
export function HomeHeader() {
  return (
    <header id="top" className="pt-12 sm:pt-20">
      <div className="grid gap-x-8 gap-y-4 border-b border-border pb-6 lg:grid-cols-12">
        <div className="flex items-center gap-4 lg:col-span-5">
          {/* On narrow screens the portrait sits beside the name. */}
          <Portrait sizes="64px" className="w-16 shrink-0 lg:hidden" />
          <div>
            <p className="type-title font-bold">{profile.name}</p>
            <p className="mt-1 type-small text-muted-foreground">
              {education.school},{" "}
              {education.degree.replace("Bachelor of Science", "BS")}
            </p>
          </div>
        </div>
        <p className="type-small text-muted-foreground lg:col-span-5 lg:col-start-8 lg:self-end">
          <span className="mb-1 block type-label text-signal">Currently</span>
          {profile.currently}
        </p>
      </div>

      <div className="grid gap-x-8 pt-10 sm:pt-14 lg:grid-cols-12 lg:items-end">
        <h1 className="type-display font-bold text-balance lg:col-span-9">
          {profile.title}
        </h1>
        <Portrait
          sizes="(min-width: 1440px) 320px, 22vw"
          preload
          className="hidden lg:col-span-3 lg:block"
        />
      </div>

      <div className="mt-10 grid gap-x-8 gap-y-8 border-t border-border pt-8 sm:mt-14 lg:grid-cols-12">
        <p className="max-w-measure type-lead text-foreground/90 lg:col-span-6">
          <span className="mr-1 type-label text-muted-foreground">
            Abstract.
          </span>{" "}
          {profile.pitch} {profile.availability}
        </p>
        <div className="lg:col-span-5 lg:col-start-8">
          <AskPrompt examples={askExamples} className="max-w-none" />
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 type-small">
            {socials.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noreferrer"
                  className="inline-flex min-h-6 items-center gap-1.5 rounded-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Icon aria-hidden className="size-4" />
                  {label === "Email" ? profile.email : label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  )
}
