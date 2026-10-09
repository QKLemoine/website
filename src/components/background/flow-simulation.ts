// The model behind the background, with no DOM or WebGL in it: flow particles
// carried by a curl-noise field, a smaller set of clustered "nodes" joined by
// lines, a smoothed pointer vortex, ripples, and a section-driven layout.

import { createNoise2D } from "./noise"

export type SimSize = {
  particleCount: number
  nodeCount: number
  clusterCount: number
}

export type SimParams = {
  flowSpeed: number
  flowScale: number
  clusterPull: number
  interactionStrength: number
  interactionRadius: number
  linkDistance: number
}

export type SimInput = {
  pointerX: number
  pointerY: number
  pointerActive: boolean
  /** Which page section is in view, fractional (1.5 = halfway from 1 to 2). */
  section: number
  /** Pixels scrolled since the last step, already scaled by the parallax factor. */
  parallaxShift: number
  /** 0–1, e.g. while the agent is streaming. */
  activity: number
}

export type Ripple = {
  x: number
  y: number
  age: number
  strength: number
  hue: number
}

/** Floats per vertex in the buffers handed to the renderer. */
export const POINT_STRIDE = 5 // x, y, vx, vy, alpha
export const NODE_STRIDE = 3 // x, y, hue index
export const LINE_STRIDE = 3 // x, y, alpha
const MAX_LINES = 700

export const RIPPLE_LIFE = 1.7 // seconds
export const RIPPLE_SPEED = 430 // px/s
const RIPPLE_WIDTH = 60
const MAX_RIPPLES = 4
/** Peak swirl speed at the cursor, px/s. Much faster and trails break into dots. */
const VORTEX_SPEED = 150

export type Sim = {
  width: number
  height: number
  time: number
  /** Flow particles currently simulated; lowered at runtime if frames run long. */
  count: number
  readonly capacity: number
  readonly nodeCount: number
  readonly clusterCount: number
  /** x, y, vx, vy, alpha per particle. */
  points: Float32Array
  life: Float32Array
  age: Float32Array
  home: Uint8Array
  nodes: Float32Array
  nodeVelX: Float32Array
  nodeVelY: Float32Array
  nodeOffX: Float32Array
  nodeOffY: Float32Array
  nodeHome: Uint8Array
  lines: Float32Array
  lineVertexCount: number
  centerX: Float32Array
  centerY: Float32Array
  /** Smoothed pointer: position plus 0–1 presence. */
  pointerX: number
  pointerY: number
  pointerStrength: number
  /** Smoothed section position. */
  section: number
  ripples: Ripple[]
}

const potentialA = createNoise2D(7)
const potentialB = createNoise2D(131)

/** Deterministic 0–1 value for a (section, cluster) pair, so layouts are stable. */
function hash(a: number, b: number): number {
  const value = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return value - Math.floor(value)
}

function gaussian(): number {
  const u = Math.max(Math.random(), 1e-6)
  const n = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random())
  return Math.max(-2.5, Math.min(2.5, n))
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

/**
 * Every section has its own cluster layout; scrolling blends from one to the
 * next, which is what makes the clusters "regroup" between sections.
 */
function updateCenters(sim: Sim) {
  const from = Math.floor(sim.section)
  const blend = smoothstep(sim.section - from)
  const orbit = Math.min(sim.width, sim.height) * 0.035
  for (let k = 0; k < sim.clusterCount; k++) {
    const ax = 0.1 + 0.8 * hash(from, k)
    const ay = 0.14 + 0.72 * hash(from + 0.5, k)
    const bx = 0.1 + 0.8 * hash(from + 1, k)
    const by = 0.14 + 0.72 * hash(from + 1.5, k)
    sim.centerX[k] =
      (ax + (bx - ax) * blend) * sim.width +
      Math.sin(sim.time * 0.11 + k * 1.7) * orbit
    sim.centerY[k] =
      (ay + (by - ay) * blend) * sim.height +
      Math.cos(sim.time * 0.09 + k * 2.3) * orbit
  }
}

function spawn(sim: Sim, i: number, anywhere: boolean) {
  const p = i * POINT_STRIDE
  const k = sim.home[i]
  if (anywhere || Math.random() < 0.3) {
    sim.points[p] = Math.random() * sim.width
    sim.points[p + 1] = Math.random() * sim.height
  } else {
    const spread = Math.min(sim.width, sim.height) * 0.2
    sim.points[p] = sim.centerX[k] + gaussian() * spread
    sim.points[p + 1] = sim.centerY[k] + gaussian() * spread
  }
  sim.points[p + 2] = 0
  sim.points[p + 3] = 0
  sim.points[p + 4] = 0
  sim.age[i] = 0
  sim.life[i] = 3 + Math.random() * 6
}

export function createSim(size: SimSize, width: number, height: number): Sim {
  const n = size.particleCount
  const m = size.nodeCount
  const k = size.clusterCount
  const sim: Sim = {
    width,
    height,
    time: Math.random() * 500,
    count: n,
    capacity: n,
    nodeCount: m,
    clusterCount: k,
    points: new Float32Array(n * POINT_STRIDE),
    life: new Float32Array(n),
    age: new Float32Array(n),
    home: new Uint8Array(n),
    nodes: new Float32Array(m * NODE_STRIDE),
    nodeVelX: new Float32Array(m),
    nodeVelY: new Float32Array(m),
    nodeOffX: new Float32Array(m),
    nodeOffY: new Float32Array(m),
    nodeHome: new Uint8Array(m),
    lines: new Float32Array(MAX_LINES * 2 * LINE_STRIDE),
    lineVertexCount: 0,
    centerX: new Float32Array(k),
    centerY: new Float32Array(k),
    pointerX: width / 2,
    pointerY: height / 2,
    pointerStrength: 0,
    section: 0,
    ripples: [],
  }
  updateCenters(sim)

  for (let i = 0; i < n; i++) {
    sim.home[i] = i % k
    spawn(sim, i, false)
    // Stagger ages so the first frames aren't one synchronized fade-in.
    sim.age[i] = Math.random() * sim.life[i]
  }

  const radius = Math.min(width, height) * 0.1
  for (let i = 0; i < m; i++) {
    const c = i % k
    sim.nodeHome[i] = c
    sim.nodeOffX[i] = gaussian() * radius
    sim.nodeOffY[i] = gaussian() * radius
    sim.nodes[i * NODE_STRIDE] = sim.centerX[c] + sim.nodeOffX[i]
    sim.nodes[i * NODE_STRIDE + 1] = sim.centerY[c] + sim.nodeOffY[i]
    sim.nodes[i * NODE_STRIDE + 2] = c % 4
  }
  return sim
}

export function resizeSim(sim: Sim, width: number, height: number) {
  const sx = width / sim.width
  const sy = height / sim.height
  const scale = Math.min(width, height) / Math.min(sim.width, sim.height)
  for (let i = 0; i < sim.capacity; i++) {
    sim.points[i * POINT_STRIDE] *= sx
    sim.points[i * POINT_STRIDE + 1] *= sy
  }
  for (let i = 0; i < sim.nodeCount; i++) {
    sim.nodes[i * NODE_STRIDE] *= sx
    sim.nodes[i * NODE_STRIDE + 1] *= sy
    sim.nodeOffX[i] *= scale
    sim.nodeOffY[i] *= scale
  }
  sim.width = width
  sim.height = height
  updateCenters(sim)
}

export function addRipple(
  sim: Sim,
  x: number,
  y: number,
  strength: number
) {
  if (sim.ripples.length >= MAX_RIPPLES) sim.ripples.shift()
  // Cycle through the palette so successive ripples differ in colour.
  const hue = Math.floor(sim.time * 3 + sim.ripples.length) % 4
  sim.ripples.push({ x, y, age: 0, strength, hue })
}

export function stepSim(
  sim: Sim,
  dt: number,
  params: SimParams,
  input: SimInput
) {
  sim.time += dt

  // Everything the visitor drives is eased, so input never looks twitchy.
  const follow = 1 - Math.exp(-dt * 7)
  sim.pointerX += (input.pointerX - sim.pointerX) * follow
  sim.pointerY += (input.pointerY - sim.pointerY) * follow
  sim.pointerStrength +=
    ((input.pointerActive ? 1 : 0) - sim.pointerStrength) *
    (1 - Math.exp(-dt * 3))
  sim.section += (input.section - sim.section) * (1 - Math.exp(-dt * 1.8))
  updateCenters(sim)

  for (const ripple of sim.ripples) ripple.age += dt
  while (sim.ripples.length > 0 && sim.ripples[0].age > RIPPLE_LIFE) {
    sim.ripples.shift()
  }

  const { width, height, time, points } = sim
  const speed = params.flowSpeed * (1 + input.activity * 0.9)
  // Noise coordinates: one "swirl" is roughly 400px at flowScale 1.
  const frequency = (params.flowScale * 2.4) / Math.max(width, height, 1)
  const epsilon = 0.01
  const radius = params.interactionRadius
  const vortex =
    sim.pointerStrength > 0.01
      ? VORTEX_SPEED * params.interactionStrength * sim.pointerStrength
      : 0
  const ease = Math.min(1, dt * 4)
  const margin = 40

  /** Curl of the noise potential at (x, y): a divergence-free flow. */
  const flowAt = (x: number, y: number, out: Float32Array) => {
    const ax = x * frequency + time * 0.03
    const ay = y * frequency
    const bx = x * frequency * 2.1 - time * 0.05
    const by = y * frequency * 2.1 + time * 0.04
    const base = potentialA(ax, ay) + 0.5 * potentialB(bx, by)
    const dx =
      potentialA(ax + epsilon, ay) + 0.5 * potentialB(bx + epsilon, by) - base
    const dy =
      potentialA(ax, ay + epsilon) + 0.5 * potentialB(bx, by + epsilon) - base
    out[0] = (dy / epsilon) * 0.5
    out[1] = (-dx / epsilon) * 0.5
  }
  const flow = scratch

  /** Adds the cursor vortex and any ripple push to (fx, fy) at (x, y). */
  const interact = (x: number, y: number, out: Float32Array) => {
    if (vortex > 0) {
      const dx = x - sim.pointerX
      const dy = y - sim.pointerY
      const distSq = dx * dx + dy * dy
      if (distSq < radius * radius && distSq > 1) {
        const dist = Math.sqrt(distSq)
        const falloff = 1 - dist / radius
        const force = falloff * falloff * vortex
        // Mostly tangential (the swirl) with a gentle pull inward.
        out[0] += (-dy / dist) * force - (dx / dist) * force * 0.3
        out[1] += (dx / dist) * force - (dy / dist) * force * 0.3
      }
    }
    for (const ripple of sim.ripples) {
      const dx = x - ripple.x
      const dy = y - ripple.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const band = Math.abs(dist - ripple.age * RIPPLE_SPEED)
      if (band < RIPPLE_WIDTH) {
        const force =
          (1 - band / RIPPLE_WIDTH) *
          (1 - ripple.age / RIPPLE_LIFE) *
          ripple.strength *
          260
        out[0] += (dx / dist) * force
        out[1] += (dy / dist) * force
      }
    }
  }

  // --- flow particles ---
  for (let i = 0; i < sim.count; i++) {
    const p = i * POINT_STRIDE
    let x = points[p]
    let y = points[p + 1]

    flowAt(x, y, flow)
    let fx = flow[0] * speed
    let fy = flow[1] * speed

    if (params.clusterPull > 0) {
      const k = sim.home[i]
      fx += (sim.centerX[k] - x) * params.clusterPull
      fy += (sim.centerY[k] - y) * params.clusterPull
    }
    flow[0] = fx
    flow[1] = fy
    interact(x, y, flow)

    const vx = points[p + 2] + (flow[0] - points[p + 2]) * ease
    const vy = points[p + 3] + (flow[1] - points[p + 3]) * ease
    x += vx * dt
    y += vy * dt - input.parallaxShift

    sim.age[i] += dt
    const remaining = sim.life[i] - sim.age[i]
    if (
      remaining <= 0 ||
      x < -margin ||
      x > width + margin ||
      y < -margin ||
      y > height + margin
    ) {
      spawn(sim, i, false)
      continue
    }
    points[p] = x
    points[p + 1] = y
    points[p + 2] = vx
    points[p + 3] = vy
    // Fade in and out so particles never pop.
    points[p + 4] = Math.min(1, sim.age[i] / 0.7, remaining / 1.1)
  }

  // --- cluster nodes ---
  const damp = Math.exp(-2.2 * dt)
  for (let i = 0; i < sim.nodeCount; i++) {
    const n = i * NODE_STRIDE
    const k = sim.nodeHome[i]
    const spin = (k % 2 === 0 ? 0.07 : -0.07) * dt
    const cos = Math.cos(spin)
    const sin = Math.sin(spin)
    const ox = sim.nodeOffX[i] * cos - sim.nodeOffY[i] * sin
    const oy = sim.nodeOffX[i] * sin + sim.nodeOffY[i] * cos
    sim.nodeOffX[i] = ox
    sim.nodeOffY[i] = oy

    const x = sim.nodes[n]
    const y = sim.nodes[n + 1]
    flowAt(x, y, flow)
    flow[0] = (sim.centerX[k] + ox - x) * 1.3 + flow[0] * speed * 0.5
    flow[1] = (sim.centerY[k] + oy - y) * 1.3 + flow[1] * speed * 0.5
    interact(x, y, flow)

    sim.nodeVelX[i] = (sim.nodeVelX[i] + flow[0] * dt) * damp
    sim.nodeVelY[i] = (sim.nodeVelY[i] + flow[1] * dt) * damp
    sim.nodes[n] = x + sim.nodeVelX[i] * dt
    sim.nodes[n + 1] = y + sim.nodeVelY[i] * dt - input.parallaxShift
  }

  // --- lines between close nodes ---
  let v = 0
  const link = params.linkDistance
  const linkSq = link * link
  const maxVertices = MAX_LINES * 2
  for (let i = 0; i < sim.nodeCount && v < maxVertices; i++) {
    const ax = sim.nodes[i * NODE_STRIDE]
    const ay = sim.nodes[i * NODE_STRIDE + 1]
    for (let j = i + 1; j < sim.nodeCount && v < maxVertices; j++) {
      const bx = sim.nodes[j * NODE_STRIDE]
      const by = sim.nodes[j * NODE_STRIDE + 1]
      const dx = ax - bx
      const dy = ay - by
      const distSq = dx * dx + dy * dy
      if (distSq >= linkSq) continue
      const alpha = 1 - Math.sqrt(distSq) / link
      const o = v * LINE_STRIDE
      sim.lines[o] = ax
      sim.lines[o + 1] = ay
      sim.lines[o + 2] = alpha
      sim.lines[o + 3] = bx
      sim.lines[o + 4] = by
      sim.lines[o + 5] = alpha
      v += 2
    }
  }
  sim.lineVertexCount = v
}

const scratch = new Float32Array(2)
