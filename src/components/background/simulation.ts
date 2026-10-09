// The model behind the background: points that settle into slowly drifting
// clusters, like a 2D projection of an embedding space. No DOM in here, so the
// same step function drives the animation and the single reduced-motion frame.

export type Pointer = { x: number; y: number; active: boolean }

export type Pulse = { x: number; y: number; age: number; strength: number }

export type FieldOptions = {
  particleCount: number
  clusterCount: number
  interactionStrength: number
  interactionRadius: number
}

export type Field = {
  /** Points currently simulated and drawn; lowered at runtime if frames run long. */
  count: number
  readonly capacity: number
  readonly clusterCount: number
  width: number
  height: number
  time: number
  /** Extra travel along the cluster paths, in radians; driven by page scroll. */
  drift: number
  x: Float32Array
  y: Float32Array
  vx: Float32Array
  vy: Float32Array
  /** Each point's resting offset from its cluster centre. */
  offsetX: Float32Array
  offsetY: Float32Array
  cluster: Uint8Array
  size: Float32Array
  centerX: Float32Array
  centerY: Float32Array
  /** Per-cluster drift phases/speeds and rotation speed. */
  phaseX: Float32Array
  phaseY: Float32Array
  speedX: Float32Array
  speedY: Float32Array
  spin: Float32Array
  pulses: Pulse[]
}

const SPRING = 1.4 // pull toward the resting position, 1/s²
const DAMPING = 2.2 // velocity decay, 1/s
const FLOW = 14 // ambient drift force, px/s²
const POINTER_FORCE = 2600
const POINTER_SWIRL = 0.4 // tangential share of the pointer force: the "warp"
const MIGRATIONS_PER_SECOND = 1.2 // points that hop to another cluster
export const PULSE_SPEED = 520 // px/s
export const PULSE_LIFE = 1.4 // s
const PULSE_WIDTH = 70
const PULSE_FORCE = 1800

function gaussian(): number {
  // Box-Muller; clamped so a rare outlier doesn't park a point off-screen.
  const u = Math.max(Math.random(), 1e-6)
  const n = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random())
  return Math.max(-2.5, Math.min(2.5, n))
}

function clusterRadius(field: Field): number {
  return Math.min(field.width, field.height) * 0.085
}

function assign(field: Field, index: number, cluster: number) {
  const radius = clusterRadius(field)
  field.cluster[index] = cluster
  field.offsetX[index] = gaussian() * radius
  field.offsetY[index] = gaussian() * radius
}

function updateCenters(field: Field) {
  for (let k = 0; k < field.clusterCount; k++) {
    field.centerX[k] =
      field.width *
      (0.5 +
        0.36 *
          Math.sin(field.time * field.speedX[k] + field.phaseX[k] + field.drift))
    field.centerY[k] =
      field.height *
      (0.5 +
        0.32 *
          Math.cos(
            field.time * field.speedY[k] + field.phaseY[k] - field.drift * 0.7
          ))
  }
}

export function createField(
  options: FieldOptions,
  width: number,
  height: number
): Field {
  const n = options.particleCount
  const k = options.clusterCount
  const field: Field = {
    count: n,
    capacity: n,
    clusterCount: k,
    width,
    height,
    time: Math.random() * 1000,
    drift: 0,
    x: new Float32Array(n),
    y: new Float32Array(n),
    vx: new Float32Array(n),
    vy: new Float32Array(n),
    offsetX: new Float32Array(n),
    offsetY: new Float32Array(n),
    cluster: new Uint8Array(n),
    size: new Float32Array(n),
    centerX: new Float32Array(k),
    centerY: new Float32Array(k),
    phaseX: new Float32Array(k),
    phaseY: new Float32Array(k),
    speedX: new Float32Array(k),
    speedY: new Float32Array(k),
    spin: new Float32Array(k),
    pulses: [],
  }

  for (let c = 0; c < k; c++) {
    field.phaseX[c] = Math.random() * Math.PI * 2
    field.phaseY[c] = Math.random() * Math.PI * 2
    field.speedX[c] = 0.02 + Math.random() * 0.03
    field.speedY[c] = 0.02 + Math.random() * 0.03
    field.spin[c] = (0.05 + Math.random() * 0.07) * (c % 2 === 0 ? 1 : -1)
  }
  updateCenters(field)

  for (let i = 0; i < n; i++) {
    assign(field, i, i % k)
    // Start at rest in the cluster so the first frame already looks settled.
    field.x[i] = field.centerX[field.cluster[i]] + field.offsetX[i]
    field.y[i] = field.centerY[field.cluster[i]] + field.offsetY[i]
    field.size[i] = 0.9 + Math.random() * 0.9
  }
  return field
}

/** Keeps the layout proportional when the viewport changes. */
export function resizeField(field: Field, width: number, height: number) {
  const sx = width / field.width
  const sy = height / field.height
  const scale = Math.min(width, height) / Math.min(field.width, field.height)
  for (let i = 0; i < field.capacity; i++) {
    field.x[i] *= sx
    field.y[i] *= sy
    field.offsetX[i] *= scale
    field.offsetY[i] *= scale
  }
  field.width = width
  field.height = height
  updateCenters(field)
}

export function addPulse(field: Field, x: number, y: number, strength = 1) {
  // A handful at once is plenty; drop the oldest rather than stacking forces.
  if (field.pulses.length >= 6) field.pulses.shift()
  field.pulses.push({ x, y, age: 0, strength })
}

/**
 * Advances the field by `dt` seconds. `activity` (0–1) stirs the ambient flow,
 * used while the agent is streaming.
 */
export function stepField(
  field: Field,
  dt: number,
  pointer: Pointer,
  activity: number,
  options: FieldOptions
) {
  field.time += dt
  updateCenters(field)

  for (const pulse of field.pulses) pulse.age += dt
  while (field.pulses.length > 0 && field.pulses[0].age > PULSE_LIFE) {
    field.pulses.shift()
  }

  // Occasionally a point changes its mind about which cluster it belongs to,
  // which is what makes the picture slowly evolve instead of loop.
  if (Math.random() < dt * MIGRATIONS_PER_SECOND) {
    const index = Math.floor(Math.random() * field.count)
    assign(field, index, Math.floor(Math.random() * field.clusterCount))
  }

  const damp = Math.exp(-DAMPING * dt)
  const flow = FLOW * (1 + activity * 1.6)
  const radius = options.interactionRadius
  const radiusSq = radius * radius
  const pointerOn = pointer.active && options.interactionStrength > 0
  const pointerForce = POINTER_FORCE * options.interactionStrength
  const { x, y, vx, vy, offsetX, offsetY, cluster, pulses, time } = field

  for (let i = 0; i < field.count; i++) {
    const k = cluster[i]

    // Each cluster rotates slowly, so its points orbit rather than sit still.
    const angle = field.spin[k] * dt
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const ox = offsetX[i] * cos - offsetY[i] * sin
    const oy = offsetX[i] * sin + offsetY[i] * cos
    offsetX[i] = ox
    offsetY[i] = oy

    let ax = (field.centerX[k] + ox - x[i]) * SPRING
    let ay = (field.centerY[k] + oy - y[i]) * SPRING

    ax += Math.sin(y[i] * 0.006 + time * 0.35) * flow
    ay += Math.cos(x[i] * 0.006 - time * 0.3) * flow

    if (pointerOn) {
      const dx = x[i] - pointer.x
      const dy = y[i] - pointer.y
      const distSq = dx * dx + dy * dy
      if (distSq < radiusSq && distSq > 1) {
        const dist = Math.sqrt(distSq)
        const falloff = 1 - dist / radius
        const force = falloff * falloff * pointerForce
        const nx = dx / dist
        const ny = dy / dist
        ax += (nx - ny * POINTER_SWIRL) * force
        ay += (ny + nx * POINTER_SWIRL) * force
      }
    }

    for (const pulse of pulses) {
      const dx = x[i] - pulse.x
      const dy = y[i] - pulse.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const band = Math.abs(dist - pulse.age * PULSE_SPEED)
      if (band < PULSE_WIDTH) {
        const force =
          (1 - band / PULSE_WIDTH) *
          (1 - pulse.age / PULSE_LIFE) *
          pulse.strength *
          PULSE_FORCE
        ax += (dx / dist) * force
        ay += (dy / dist) * force
      }
    }

    vx[i] = (vx[i] + ax * dt) * damp
    vy[i] = (vy[i] + ay * dt) * damp
    x[i] += vx[i] * dt
    y[i] += vy[i] * dt
  }
}
