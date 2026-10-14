// Server-only: loads the "Off the clock" content and does the map maths, so
// the browser receives finished SVG paths and plain data.

import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { geoEqualEarth, geoPath } from "d3-geo"
import matter from "gray-matter"
import { feature, mesh } from "topojson-client"
import type { GeometryCollection, Topology } from "topojson-specification"
import worldData from "world-atlas/countries-110m.json"

import ridesData from "@/content/cycling/rides.json"
import photoManifest from "@/content/photos.json"
import placesData from "@/content/travel/places.json"

const CONTENT = join(process.cwd(), "src/content")
const published = photoManifest as Record<
  string,
  { width: number; height: number }
>

export type Photo = {
  src: string
  caption: string
  /** True until `npm run photos` has published the file; shown as a placeholder. */
  missing: boolean
  /** Width over height of the published file; 4:3 for a placeholder. */
  aspect: number
}

function toPhotos(value: unknown): Photo[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is { src: string; caption?: string } =>
      Boolean(item && typeof item.src === "string")
    )
    .map((item) => {
      const size = published[item.src]
      return {
        src: item.src,
        caption: item.caption ?? "",
        missing: !size,
        aspect: size ? size.width / size.height : 4 / 3,
      }
    })
}

// --- Travel -----------------------------------------------------------------

/** Every map view has this shape, so markers can be placed by percentage. */
export const MAP_ASPECT = 16 / 10
const MAP_WIDTH = 960

export type MapRegion = {
  id: string
  label: string
  /** SVG viewBox: x, y, width, height. */
  box: [number, number, number, number]
}

/** One entry of places.json. Only the first five fields are required. */
type PlaceEntry = {
  name: string
  country: string
  kind: string
  lat: number
  lon: number
  date?: string
  note?: string
  photos?: unknown
}

export type Place = {
  name: string
  /** Groups the plain-text list. */
  country: string
  kind: "lived" | "visited"
  /** Empty when the place is just a dot for now. */
  date: string
  note: string
  photos: Photo[]
  /** Position in the map's own coordinates. */
  x: number
  y: number
}

const projection = geoEqualEarth().fitWidth(MAP_WIDTH, { type: "Sphere" })

/** The smallest MAP_ASPECT box around a longitude/latitude range. */
function regionBox(
  west: number,
  east: number,
  south: number,
  north: number
): MapRegion["box"] {
  const xs: number[] = []
  const ys: number[] = []
  // The projection curves, so sample the edges rather than just the corners.
  for (let step = 0; step <= 8; step++) {
    const lon = west + ((east - west) * step) / 8
    const lat = south + ((north - south) * step) / 8
    for (const point of [
      projection([lon, south]),
      projection([lon, north]),
      projection([west, lat]),
      projection([east, lat]),
    ]) {
      if (!point) continue
      xs.push(point[0])
      ys.push(point[1])
    }
  }
  const left = Math.min(...xs)
  const top = Math.min(...ys)
  let width = Math.max(...xs) - left
  let height = Math.max(...ys) - top
  const centreX = left + width / 2
  const centreY = top + height / 2
  if (width / height > MAP_ASPECT) height = width / MAP_ASPECT
  else width = height * MAP_ASPECT
  const round = (value: number) => Math.round(value * 10) / 10
  return [
    round(centreX - width / 2),
    round(centreY - height / 2),
    round(width),
    round(height),
  ]
}

/** The widest view; panning and zooming stay inside it. */
export const mapRegions: MapRegion[] = [
  { id: "world", label: "World", box: regionBox(-168, 180, -54, 76) },
  { id: "europe", label: "Europe", box: regionBox(-25, 30, 35, 67) },
  { id: "north-america", label: "North America", box: regionBox(-128, -64, 22, 52) },
]

const world = worldData as unknown as Topology<{
  land: GeometryCollection
  countries: GeometryCollection
}>
const path = geoPath(projection).digits(1)

/** The world as two SVG paths: the land, and the borders between countries. */
export const worldMap = {
  land: path(feature(world, world.objects.land)) ?? "",
  borders:
    path(mesh(world, world.objects.countries, (a, b) => a !== b)) ?? "",
}

export const places: Place[] = (placesData as PlaceEntry[]).map((place) => {
  const [x, y] = projection([place.lon, place.lat]) ?? [0, 0]
  return {
    name: place.name,
    country: place.country,
    kind: place.kind === "lived" ? "lived" : "visited",
    date: place.date ?? "",
    note: place.note ?? "",
    photos: toPhotos(place.photos),
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
  }
})

// --- Cycling ----------------------------------------------------------------

const RIDE_BOX = { width: 400, height: 250, padding: 14 }
/** Rides further than this from the usual area would shrink it to a speck. */
const RIDE_AREA_KM = 80

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

function rideHeatmap(routes: number[][][]) {
  const middles = routes.map((route) => route[Math.floor(route.length / 2)])
  const lon0 = median(middles.map((point) => point[0]))
  const lat0 = median(middles.map((point) => point[1]))
  // Over one riding area a flat projection is accurate enough: scale
  // longitude by the cosine of the latitude and leave the rest alone.
  const shrink = Math.cos((lat0 * Math.PI) / 180)
  const flat = ([lon, lat]: number[]) => [(lon - lon0) * shrink, lat0 - lat]
  const nearby = routes.filter((_, index) => {
    const [x, y] = flat(middles[index])
    return Math.hypot(x, y) * 111 <= RIDE_AREA_KM
  })
  const points = nearby.flat().map(flat)
  const left = Math.min(...points.map((point) => point[0]))
  const top = Math.min(...points.map((point) => point[1]))
  const spanX = Math.max(...points.map((point) => point[0])) - left || 1
  const spanY = Math.max(...points.map((point) => point[1])) - top || 1
  const { width, height, padding } = RIDE_BOX
  const scale = Math.min(
    (width - padding * 2) / spanX,
    (height - padding * 2) / spanY
  )
  const offsetX = (width - spanX * scale) / 2
  const offsetY = (height - spanY * scale) / 2
  return nearby.map((route) =>
    route
      .map((point, index) => {
        const [x, y] = flat(point)
        const px = ((x - left) * scale + offsetX).toFixed(1)
        const py = ((y - top) * scale + offsetY).toFixed(1)
        return `${index === 0 ? "M" : "L"}${px} ${py}`
      })
      .join("")
  )
}

export type Stat = { value: string; label: string }

const wholeNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })

/** Figures measured from the recorded routes, for when none are typed in. */
const measuredStats: Stat[] = [
  {
    value: `${wholeNumber.format(ridesData.stats.distanceThisYearKm * 0.6214)} mi`,
    label: `ridden in ${ridesData.year}`,
  },
  {
    value: `${wholeNumber.format(ridesData.stats.longestRideKm * 0.6214)} mi`,
    label: "longest ride",
  },
  {
    value: `${wholeNumber.format(ridesData.stats.totalElevationM * 3.281)} ft`,
    label: "climbed in total",
  },
]

function toStats(value: unknown): Stat[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item) => item && item.value !== undefined && item.label)
    .map((item) => ({ value: String(item.value), label: String(item.label) }))
}

const rideRoutes = rideHeatmap(ridesData.routes)

// The markdown is read on each call rather than once at start-up, so an edit
// shows on the next refresh while developing.
export function getCycling() {
  const file = matter(readFileSync(join(CONTENT, "cycling/cycling.md"), "utf8"))
  const writtenStats = toStats(file.data.stats)
  return {
    /** True while rides.json holds made-up routes. */
    sample: ridesData.sample,
    /** From cycling.md when it lists any, otherwise measured from the routes. */
    stats: writtenStats.length > 0 ? writtenStats : measuredStats,
    viewBox: `0 0 ${RIDE_BOX.width} ${RIDE_BOX.height}`,
    /** One SVG path per route, so overlapping rides build up. */
    routes: rideRoutes,
    caption: file.content.trim(),
    photos: toPhotos(file.data.photos),
  }
}

// --- Simple interests -------------------------------------------------------

export type Interest = {
  slug: string
  title: string
  bullets: string[]
  photos: Photo[]
}

/** One card per markdown file in src/content/interests/. */
export function getInterests(): Interest[] {
  return readdirSync(join(CONTENT, "interests"))
  .filter((name) => name.endsWith(".md"))
  .map((name) => {
    const file = matter(readFileSync(join(CONTENT, "interests", name), "utf8"))
    return {
      slug: name.replace(/\.md$/, ""),
      title: String(file.data.title ?? name.replace(/\.md$/, "")),
      order: Number(file.data.order ?? 99),
      // The body is a markdown list; each "- " line is one bullet.
      bullets: file.content
        .split("\n")
        .filter((line) => /^\s*[-*]\s+/.test(line))
        .map((line) => line.replace(/^\s*[-*]\s+/, "").trim()),
      photos: toPhotos(file.data.photos),
    }
  })
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
}
