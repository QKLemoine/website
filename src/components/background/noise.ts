// 2D simplex noise (Gustavson's algorithm), used as the height field the contour
// lines trace. Returns values in roughly [-1, 1].

const F2 = 0.5 * (Math.sqrt(3) - 1)
const G2 = (3 - Math.sqrt(3)) / 6
const GRAD = [1, 1, -1, 1, 1, -1, -1, -1, 1, 0, -1, 0, 0, 1, 0, -1]

export type Noise2D = (x: number, y: number) => number

export function createNoise2D(seed = 1): Noise2D {
  // Seeded shuffle, so the same seed always draws the same field.
  const perm = new Uint8Array(512)
  const source = new Uint8Array(256)
  for (let i = 0; i < 256; i++) source[i] = i
  let state = seed * 2654435761 >>> 0
  for (let i = 255; i > 0; i--) {
    state = (state * 1664525 + 1013904223) >>> 0
    const j = state % (i + 1)
    const swap = source[i]
    source[i] = source[j]
    source[j] = swap
  }
  for (let i = 0; i < 512; i++) perm[i] = source[i & 255]

  const corner = (gi: number, x: number, y: number) => {
    const t = 0.5 - x * x - y * y
    if (t < 0) return 0
    const g = (gi & 7) * 2
    return t * t * t * t * (GRAD[g] * x + GRAD[g + 1] * y)
  }

  return (x, y) => {
    const s = (x + y) * F2
    const i = Math.floor(x + s)
    const j = Math.floor(y + s)
    const t = (i + j) * G2
    const x0 = x - (i - t)
    const y0 = y - (j - t)
    const i1 = x0 > y0 ? 1 : 0
    const j1 = 1 - i1
    const ii = i & 255
    const jj = j & 255
    return (
      70 *
      (corner(perm[ii + perm[jj]], x0, y0) +
        corner(perm[ii + i1 + perm[jj + j1]], x0 - i1 + G2, y0 - j1 + G2) +
        corner(perm[ii + 1 + perm[jj + 1]], x0 - 1 + 2 * G2, y0 - 1 + 2 * G2))
    )
  }
}
