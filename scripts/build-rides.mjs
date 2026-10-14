// Turns ride recordings into the small JSON the cycling heatmap draws from.
//
//   npm run rides            read GPX files from data/rides/
//   npm run rides -- --sample   write made-up routes, for layout work
//
// Run it locally and commit src/content/cycling/rides.json. The GPX files
// themselves are gitignored: they show exactly where rides start and end.
//
// A route ridden more than once needs only one file: list how many times in
// data/rides/counts.json, e.g. { "Afternoon_Ride.gpx": 3 }. It is then drawn
// (and counted in the stats) that many times, so it shows brighter.
//
// Privacy, applied to every route before anything is written:
//   1. the first and last TRIM_METERS are cut off;
//   2. every point inside a zone listed in data/privacy-zones.json is dropped
//      (optional file, gitignored): [{ "lat": 0, "lon": 0, "radiusMeters": 800 }]
//      Trimming alone leaves the cut ends in a ring around a common start, so
//      add a zone for home.

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const ROOT = join(import.meta.dirname, "..")
const RIDES_DIR = process.env.RIDES_DIR ?? join(ROOT, "data/rides")
const ZONES_FILE = join(ROOT, "data/privacy-zones.json")
const OUTPUT = process.env.RIDES_OUTPUT ?? join(ROOT, "src/content/cycling/rides.json")

const TRIM_METERS = 500
/** Points closer together than this add nothing at heatmap size. */
const MIN_SPACING_METERS = 40
/** Climbs smaller than this are GPS noise, not hills. */
const ELEVATION_NOISE_METERS = 3

/**
 * A ride, whatever it came from.
 * @typedef {{ date: string | null, points: { lat: number, lon: number, ele: number | null }[] }} Ride
 */

function distanceMeters(a, b) {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(h))
}

/** @returns {Ride[]} */
function loadFromGpx() {
  if (!existsSync(RIDES_DIR)) return []
  const countsFile = join(RIDES_DIR, "counts.json")
  const counts = existsSync(countsFile)
    ? JSON.parse(readFileSync(countsFile, "utf8"))
    : {}
  return readdirSync(RIDES_DIR)
    .filter((name) => name.toLowerCase().endsWith(".gpx"))
    .sort()
    .flatMap((name) => {
      const xml = readFileSync(join(RIDES_DIR, name), "utf8")
      const points = []
      for (const match of xml.matchAll(/<trkpt\b([^>]*?)(?:\/>|>([\s\S]*?)<\/trkpt>)/g)) {
        const lat = Number(/\blat="([^"]+)"/.exec(match[1])?.[1])
        const lon = Number(/\blon="([^"]+)"/.exec(match[1])?.[1])
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
        const ele = /<ele>([^<]+)<\/ele>/.exec(match[2] ?? "")?.[1]
        points.push({ lat, lon, ele: ele === undefined ? null : Number(ele) })
      }
      const date = /<time>([^<]+)<\/time>/.exec(xml)?.[1] ?? null
      const times = Math.max(1, Math.round(Number(counts[name] ?? 1)))
      return Array.from({ length: times }, () => ({ date, points }))
    })
}

/**
 * TODO: the Strava source. It should return the same Ride[] as loadFromGpx,
 * so nothing after this function changes. Outline:
 *   1. POST https://www.strava.com/oauth/token with STRAVA_CLIENT_ID,
 *      STRAVA_CLIENT_SECRET and STRAVA_REFRESH_TOKEN (grant_type=refresh_token).
 *   2. Page through GET /api/v3/athlete/activities, keeping type "Ride".
 *   3. For each, GET /api/v3/activities/{id}/streams?keys=latlng,altitude.
 * The three variables live in .env.local only; this script runs at build time
 * on your machine, so they never reach the browser.
 * @returns {Promise<Ride[]>}
 */
async function loadFromStrava() {
  throw new Error(
    "The Strava source is not written yet. Use GPX files in data/rides/ for now."
  )
}

/** Made-up loops around a park, so the layout can be judged without real rides. */
function sampleRides() {
  let seed = 11
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
  const centre = { lat: 52.0, lon: 5.0 }
  return Array.from({ length: 14 }, (_, ride) => {
    const size = 0.03 + random() * 0.09
    const tilt = random() * Math.PI * 2
    const wobble = 2 + Math.floor(random() * 3)
    const points = []
    for (let step = 0; step <= 160; step++) {
      const angle = (step / 160) * Math.PI * 2
      const radius = size * (1 + 0.25 * Math.sin(angle * wobble + tilt))
      points.push({
        lat: centre.lat + radius * Math.sin(angle + tilt) + size * Math.sin(tilt),
        lon: centre.lon + (radius * Math.cos(angle + tilt) + size * Math.cos(tilt)) * 1.6,
        ele: 20 + 30 * Math.sin(angle * 3 + ride),
      })
    }
    const month = String(1 + (ride % 9)).padStart(2, "0")
    return { date: `${new Date().getFullYear()}-${month}-12T08:00:00Z`, points }
  })
}

function loadZones() {
  if (!existsSync(ZONES_FILE)) return []
  return JSON.parse(readFileSync(ZONES_FILE, "utf8"))
}

/** Cuts TRIM_METERS of riding off each end. Short rides vanish entirely. */
function trimEnds(points) {
  let start = 0
  for (let travelled = 0; start < points.length - 1 && travelled < TRIM_METERS; start++) {
    travelled += distanceMeters(points[start], points[start + 1])
  }
  let end = points.length - 1
  for (let travelled = 0; end > start && travelled < TRIM_METERS; end--) {
    travelled += distanceMeters(points[end], points[end - 1])
  }
  return points.slice(start, end + 1)
}

/** Splits a route wherever it passes through a privacy zone. */
function removeZones(points, zones) {
  const segments = [[]]
  for (const point of points) {
    const hidden = zones.some(
      (zone) => distanceMeters(point, zone) <= zone.radiusMeters
    )
    if (hidden) {
      if (segments.at(-1).length > 0) segments.push([])
    } else {
      segments.at(-1).push(point)
    }
  }
  return segments.filter((segment) => segment.length > 1)
}

function thin(points) {
  const kept = [points[0]]
  for (const point of points.slice(1, -1)) {
    if (distanceMeters(kept.at(-1), point) >= MIN_SPACING_METERS) kept.push(point)
  }
  kept.push(points.at(-1))
  return kept
}

function rideStats(points) {
  let meters = 0
  let climb = 0
  let reference = points.find((point) => point.ele !== null)?.ele ?? null
  for (let i = 1; i < points.length; i++) {
    meters += distanceMeters(points[i - 1], points[i])
    const ele = points[i].ele
    if (ele === null || reference === null) continue
    if (ele - reference > ELEVATION_NOISE_METERS) {
      climb += ele - reference
      reference = ele
    } else if (ele < reference) {
      reference = ele
    }
  }
  return { meters, climb }
}

const sample = process.argv.includes("--sample")
const source = process.env.RIDES_SOURCE ?? "gpx"
const rides = sample
  ? sampleRides()
  : source === "strava"
    ? await loadFromStrava()
    : loadFromGpx()

if (rides.length === 0) {
  console.error(
    `No rides found in ${RIDES_DIR}. Add .gpx files there, or run with --sample.`
  )
  process.exit(1)
}

const zones = sample ? [] : loadZones()
const year = new Date().getFullYear()
const routes = []
let totalMeters = 0
let yearMeters = 0
let longestMeters = 0
let climbMeters = 0

for (const ride of rides) {
  // Stats describe the whole ride; only the drawn line is trimmed.
  const stats = rideStats(ride.points)
  totalMeters += stats.meters
  climbMeters += stats.climb
  longestMeters = Math.max(longestMeters, stats.meters)
  if (ride.date && new Date(ride.date).getFullYear() === year) {
    yearMeters += stats.meters
  }
  for (const segment of removeZones(trimEnds(ride.points), zones)) {
    routes.push(
      thin(segment).map((point) => [
        Number(point.lon.toFixed(5)),
        Number(point.lat.toFixed(5)),
      ])
    )
  }
}

const km = (meters) => Math.round(meters / 1000)
writeFileSync(
  OUTPUT,
  JSON.stringify({
    // True for made-up routes; the page labels them as sample data.
    sample,
    source: sample ? "sample" : source,
    year,
    rideCount: rides.length,
    stats: {
      distanceThisYearKm: km(yearMeters),
      totalDistanceKm: km(totalMeters),
      longestRideKm: km(longestMeters),
      totalElevationM: Math.round(climbMeters),
    },
    // Each route is a list of [longitude, latitude].
    routes,
  }) + "\n"
)
console.log(
  `${rides.length} rides, ${routes.length} route segments, ${km(totalMeters)} km -> ${OUTPUT}` +
    (zones.length === 0 && !sample
      ? "\nNo privacy zones set: consider adding data/privacy-zones.json for home."
      : "")
)
