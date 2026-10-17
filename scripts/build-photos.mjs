// Publishes the photos for the "Off the clock" section.
//
//   npm run photos
//
// Reads originals from photos/ (gitignored) and writes web-sized JPEGs to the
// same relative path under public/off-the-clock/. So photos/travel/lisbon-1.heic
// becomes /off-the-clock/travel/lisbon-1.jpg, which is the path to use in the
// content files.
//
// Folders whose name starts with "_" are skipped, so untouched originals can
// sit beside edited versions (e.g. photos/_originals/) without being published.
//
// Originals must never go in public/: anything there is downloadable as-is,
// GPS coordinates included. sharp drops all metadata unless told to keep it,
// so the published copies carry no location, camera or date information.

import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { dirname, extname, join, relative } from "node:path"

import sharp from "sharp"

const ROOT = join(import.meta.dirname, "..")
// The environment overrides exist for testing the script somewhere harmless.
const SOURCE = process.env.PHOTOS_DIR ?? join(ROOT, "photos")
const OUTPUT = process.env.PHOTOS_OUTPUT ?? join(ROOT, "public/off-the-clock")
/** Lists what was published, with sizes; the page shows a placeholder for
 *  any photo a content file names that is not in here. */
const MANIFEST =
  process.env.PHOTOS_MANIFEST ?? join(ROOT, "src/content/photos.json")
const MAX_EDGE = 1800
const FORMATS = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".avif", ".tif", ".tiff"])

function* walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name)
    if (statSync(path).isDirectory()) {
      if (!name.startsWith("_")) yield* walk(path)
    } else if (FORMATS.has(extname(name).toLowerCase())) yield path
  }
}

const manifest = {}
for (const source of walk(SOURCE)) {
  const target = join(
    OUTPUT,
    relative(SOURCE, source).replace(/\.[^.]+$/, ".jpg")
  )
  mkdirSync(dirname(target), { recursive: true })
  await sharp(source)
    // Bakes in the camera's orientation, which would otherwise be lost with
    // the rest of the metadata.
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(target)
  const metadata = await sharp(target).metadata()
  if (metadata.exif || metadata.xmp || metadata.iptc) {
    throw new Error(`Metadata survived in ${target}; not publishing it.`)
  }
  const url = `/off-the-clock/${relative(OUTPUT, target)}`
  manifest[url] = { width: metadata.width, height: metadata.height }
  console.log(url)
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n")
const count = Object.keys(manifest).length
console.log(count === 0 ? `No photos found in ${SOURCE}.` : `${count} photos published.`)
