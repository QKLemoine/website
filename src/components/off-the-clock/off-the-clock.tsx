import {
  getCycling,
  getInterests,
  mapRegions,
  places,
  worldMap,
} from "@/lib/off-the-clock"
import { cn } from "@/lib/utils"

import { Gallery } from "./gallery"
import { TravelMap } from "./travel-map"

/**
 * The same places as plain text, grouped by country: the map's fallback, and
 * its phone view, where the dots are small.
 */
function PlaceList() {
  const lived = places.filter((place) => place.kind === "lived")
  const visited = places.filter((place) => place.kind === "visited")
  const countries = [...new Set(visited.map((place) => place.country))]
  const noted = places.filter((place) => place.note)

  return (
    <div className="space-y-3 text-sm">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        {lived.length > 0 && (
          <>
            <dt className="text-signal">Lived</dt>
            <dd>{lived.map((place) => place.name).join(", ")}</dd>
          </>
        )}
        {countries.map((country) => {
          const names = visited
            .filter((place) => place.country === country)
            .map((place) => place.name)
          return (
            <div key={country} className="contents">
              <dt className="text-muted-foreground">{country}</dt>
              {/* A country with no named places inside it is its own entry. */}
              <dd>
                {names.length === 1 && names[0] === country
                  ? "Visited"
                  : names.join(", ")}
              </dd>
            </div>
          )
        })}
      </dl>
      {noted.length > 0 && (
        <ul className="space-y-1.5 border-t border-border pt-3">
          {noted.map((place) => (
            <li key={place.name}>
              <span className="font-medium">{place.name}</span>
              {place.date && (
                <span className="text-xs text-signal"> {place.date}</span>
              )}
              <span className="block text-muted-foreground">{place.note}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function RideHeatmap({
  cycling,
}: {
  cycling: ReturnType<typeof getCycling>
}) {
  return (
    <div className="relative aspect-16/10 overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10">
      <svg
        viewBox={cycling.viewBox}
        role="img"
        aria-label="Every recorded ride drawn on top of each other; busier roads are brighter."
        className="absolute inset-0 size-full"
      >
        {cycling.routes.map((route, index) => (
          <path
            key={index}
            d={route}
            fill="none"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-primary/30"
          />
        ))}
      </svg>
      {cycling.sample && (
        <p className="absolute top-2 left-2 rounded-sm bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          Sample routes, not real rides
        </p>
      )}
    </div>
  )
}

/**
 * The "Off the clock" section's content, without a section heading: each page
 * style wraps it in its own. `headingClassName` styles the block titles.
 */
export function OffTheClock({
  headingClassName = "text-lg font-semibold",
  interestsClassName,
}: {
  headingClassName?: string
  /** Extra classes for the row of interest cards, e.g. to widen it. */
  interestsClassName?: string
}) {
  const cycling = getCycling()
  const interests = getInterests()

  return (
    <div className="space-y-10">
      <div className="grid gap-x-8 gap-y-10 lg:grid-cols-2">
        <div>
          <h3 className={headingClassName}>Travel</h3>
          <div className="mt-3">
            <TravelMap
              land={worldMap.land}
              borders={worldMap.borders}
              regions={mapRegions}
              places={places}
            />
          </div>
          {/* Always open on phones, where the dots are small; tucked away on
              wider screens. Either way it works without JavaScript. */}
          <div className="mt-4 border-t border-border pt-3 lg:hidden">
            <p className="mb-3 text-sm text-muted-foreground">
              {places.length} of the many places I&apos;ve been
            </p>
            <PlaceList />
          </div>
          <details className="mt-3 hidden text-sm lg:block">
            <summary className="cursor-pointer rounded-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
              {places.length} of the many places I&apos;ve been, as a list
            </summary>
            <div className="mt-3">
              <PlaceList />
            </div>
          </details>
        </div>

        <div>
          <h3 className={headingClassName}>Cycling</h3>
          {/* Lines the heatmap up with the map beside it, under its controls. */}
          <div className="mt-3 lg:pt-[calc(1.5rem+0.5rem)]">
            <RideHeatmap cycling={cycling} />
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-4">
            {cycling.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse justify-end">
                <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                <dd className="text-xl font-semibold tracking-tight tabular-nums">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex items-start gap-3">
            <Gallery
              title="Cycling"
              photos={cycling.photos}
              strip
              className="shrink-0"
            />
            <p className="text-sm leading-relaxed text-muted-foreground">
              {cycling.caption}
            </p>
          </div>
        </div>
      </div>

      <ul
        className={cn(
          "grid gap-x-8 gap-y-10 border-t border-border pt-8 sm:grid-cols-2",
          // One column per card, so a short row fills the width evenly.
          interests.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
          interestsClassName
        )}
      >
        {interests.map((interest, index) => (
          <li key={interest.slug}>
            <Gallery
              title={interest.title}
              photos={interest.photos}
              layout={index}
            />
            <h3 className={cn(headingClassName, "mt-3")}>{interest.title}</h3>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm leading-relaxed text-muted-foreground marker:text-primary">
              {interest.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}
