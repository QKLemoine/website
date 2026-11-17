// A planar (2D) version of the Monoprop navigator, for the website demo: an
// error-state-style Kalman filter over position, velocity, tilt and sensor
// biases, fed by two simulated IMUs, a downward LiDAR and GPS. The flight
// software runs the full 15-state, 3D filter in Rust; this is a stand-in so
// visitors can watch the same ideas work.

export const G = 9.81
/** Filter step, seconds (100 Hz). */
export const DT = 0.01
/** Height of the IMU above the pad, metres. */
export const IMU_H = 0.15
const ALT = 2.2
const SWAY = 2.0
const PAD_TILT = 0.012
export const T_LAUNCH = 4
const T_TOP = 7
const T_DESC = 16
export const T_LAND = 19
/** The flight loops after this many seconds. */
export const T_END = 23
const SIG = { a: 0.05, w: 0.003, gpsX: 0.5, gpsZ: 1.0, lidar: 0.02 }
const LIDAR_MIN = 0.04
const LIDAR_MAX = 4.0
const LIDAR_TILT = (30 * Math.PI) / 180
/** Samples of stillness needed to align (2 s). */
export const WINDOW = 200
const DIFF_MIN = 100
const DIFF_WIN = 1000
/** Chi-square gate for one degree of freedom at 99.9%. */
const GATE1 = 10.83
/** State: [px, pz, vx, vz, th, bax, baz, bg]. */
export const N = 8

type Vec = number[]
type Mat = Float64Array

export type Sensors = { gps: boolean; lidar: boolean; imuB: boolean }

export type Truth = { x: number; z: number; th: number; w: number; f: Vec }

export type SimState = {
  t: number
  step: number
  bA: Vec
  bB: Vec
  win: { n: number; f: Vec; lid: number; nl: number }
  diff: { d: Vec; n: number }
  aligned: boolean
  x: Vec
  P: Mat
  ground: number
  /** IMU-only dead reckoning, to show what the filter saves us from. */
  dr: { x: number; z: number; vx: number; vz: number; th: number }
  drTrail: [number, number][]
  truthTrail: [number, number][]
  gpsMarks: { x: number; z: number; ok: boolean; age: number }[]
  lidarHit: { ok: boolean; range: number } | null
  gpsAcc: number
  gpsRej: number
  lidAcc: number
  lidSkip: number
  hist: { t: number; ex: number; ez: number; sx: number; sz: number }[]
  imuMode: "Both" | "A only"
  badPending: boolean
  truth: Truth | null
}

// ---------- random numbers ----------

function mulberry(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------- truth ----------

const smoothstep = (u: number) => {
  u = Math.min(1, Math.max(0, u))
  return u * u * u * (u * (u * 6 - 15) + 10)
}

function pos(t: number): [number, number] {
  let x = 0
  let z = 0
  if (t >= T_LAUNCH && t < T_TOP) {
    z = ALT * smoothstep((t - T_LAUNCH) / (T_TOP - T_LAUNCH))
  } else if (t >= T_TOP && t < T_DESC) {
    const u = (t - T_TOP) / (T_DESC - T_TOP)
    const w = Math.sin(Math.PI * u) ** 2
    x = SWAY * Math.sin(2 * Math.PI * u) * w
    z = ALT + 0.12 * Math.sin(4 * Math.PI * u) * w
  } else if (t >= T_DESC && t < T_LAND) {
    z = ALT * (1 - smoothstep((t - T_DESC) / (T_LAND - T_DESC)))
  }
  return [x, z]
}

function accel(t: number): [number, number] {
  const h = 0.002
  const a = pos(t - h)
  const b = pos(t)
  const c = pos(t + h)
  return [
    (a[0] - 2 * b[0] + c[0]) / (h * h),
    (a[1] - 2 * b[1] + c[1]) / (h * h),
  ]
}

function pitch(t: number) {
  const a = accel(t)
  return Math.atan2(-a[0], a[1] + G) + PAD_TILT
}

function truthAt(t: number): Truth {
  const p = pos(t)
  const a = accel(t)
  const th = pitch(t)
  const h = 0.002
  const w = (pitch(t + h) - pitch(t - h)) / (2 * h)
  const c = Math.cos(th)
  const s = Math.sin(th)
  const nx = a[0]
  const nz = a[1] + G
  return { x: p[0], z: p[1], th, w, f: [c * nx + s * nz, -s * nx + c * nz] }
}

export function phaseName(t: number) {
  if (t < T_LAUNCH) return "Vehicle on the pad"
  if (t < T_TOP) return "Climbing to 2.2 m"
  if (t < T_DESC) return "Hovering, drifting side to side"
  if (t < T_LAND) return "Descending"
  return "Landed"
}

// ---------- small linear algebra ----------

const eye = (): Mat => {
  const m = new Float64Array(N * N)
  for (let i = 0; i < N; i++) m[i * N + i] = 1
  return m
}

function mul(A: Mat, B: Mat): Mat {
  const C = new Float64Array(N * N)
  for (let i = 0; i < N; i++)
    for (let k = 0; k < N; k++) {
      const a = A[i * N + k]
      if (a === 0) continue
      for (let j = 0; j < N; j++) C[i * N + j] += a * B[k * N + j]
    }
  return C
}

/** A · Bᵀ */
function mulT(A: Mat, B: Mat): Mat {
  const C = new Float64Array(N * N)
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      let s = 0
      for (let k = 0; k < N; k++) s += A[i * N + k] * B[j * N + k]
      C[i * N + j] = s
    }
  return C
}

function symmetrize(P: Mat) {
  for (let i = 0; i < N; i++)
    for (let j = i + 1; j < N; j++) {
      const v = 0.5 * (P[i * N + j] + P[j * N + i])
      P[i * N + j] = P[j * N + i] = v
    }
}

// ---------- the simulation ----------

export class MonopropSim {
  S!: SimState
  private seed: number
  private rnd: () => number = Math.random

  constructor(seed = 7) {
    this.seed = seed
    this.reset()
  }

  private gauss() {
    let u = 0
    while (u === 0) u = this.rnd()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * this.rnd())
  }

  /** Starts a new flight, with fresh sensor noise. */
  reset() {
    this.rnd = mulberry(this.seed++)
    this.S = {
      t: 0,
      step: 0,
      bA: [0.08, -0.05, 0.01],
      bB: [-0.05, 0.07, -0.006],
      win: { n: 0, f: [0, 0], lid: 0, nl: 0 },
      diff: { d: [0, 0, 0], n: 0 },
      aligned: false,
      x: [],
      P: new Float64Array(N * N),
      ground: -IMU_H,
      dr: { x: 0, z: 0, vx: 0, vz: 0, th: 0 },
      drTrail: [],
      truthTrail: [],
      gpsMarks: [],
      lidarHit: null,
      gpsAcc: 0,
      gpsRej: 0,
      lidAcc: 0,
      lidSkip: 0,
      hist: [],
      imuMode: "Both",
      badPending: false,
      truth: null,
    }
  }

  /** Queues a GPS fix several metres off, for the gate to catch. */
  sendBadGps() {
    this.S.badPending = true
  }

  private align() {
    const S = this.S
    const fx = S.win.f[0] / S.win.n
    const fz = S.win.f[1] / S.win.n
    const th = Math.atan2(fx, fz)
    S.x = [0, 0, 0, 0, th, 0, 0, 0]
    const sd = [0.02, 0.02, 0.05, 0.05, 0.02, 0.15, 0.15, 0.015]
    S.P = new Float64Array(N * N)
    sd.forEach((v, i) => (S.P[i * N + i] = v * v))
    S.ground = S.win.nl >= 5 ? -(S.win.lid / S.win.nl) * Math.cos(th) : -IMU_H
    S.dr = { x: 0, z: 0, vx: 0, vz: 0, th }
    S.aligned = true
  }

  private predict(f: Vec, w: number) {
    const S = this.S
    const x = S.x
    const c = Math.cos(x[4])
    const s = Math.sin(x[4])
    const ux = f[0] - x[5]
    const uz = f[1] - x[6]
    const rx = c * ux - s * uz
    const rz = s * ux + c * uz
    x[2] += rx * DT
    x[3] += (rz - G) * DT
    x[0] += x[2] * DT
    x[1] += x[3] * DT
    x[4] += (w - x[7]) * DT
    const F = eye()
    F[0 * N + 2] = DT
    F[1 * N + 3] = DT
    F[2 * N + 4] = -rz * DT
    F[3 * N + 4] = rx * DT
    F[2 * N + 5] = -c * DT
    F[2 * N + 6] = s * DT
    F[3 * N + 5] = -s * DT
    F[3 * N + 6] = -c * DT
    F[4 * N + 7] = -DT
    const P = mulT(mul(F, S.P), F)
    const qa = (1.5 * SIG.a * DT) ** 2
    const qw = (1.5 * SIG.w * DT) ** 2
    P[2 * N + 2] += qa
    P[3 * N + 3] += qa
    P[4 * N + 4] += qw
    P[5 * N + 5] += 1e-8
    P[6 * N + 6] += 1e-8
    P[7 * N + 7] += 1e-10
    symmetrize(P)
    S.P = P
  }

  /** One scalar measurement update. Returns false when the gate refuses it. */
  private update(h: Mat, y: number, r: number) {
    const S = this.S
    const P = S.P
    const Ph = new Float64Array(N)
    for (let i = 0; i < N; i++) {
      let v = 0
      for (let j = 0; j < N; j++) v += P[i * N + j] * h[j]
      Ph[i] = v
    }
    let Sv = r
    for (let i = 0; i < N; i++) Sv += h[i] * Ph[i]
    if (!(Sv > 0) || (y * y) / Sv > GATE1) return false
    const K = Ph.map((v) => v / Sv)
    // Joseph form keeps P symmetric and positive.
    const A = eye()
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) A[i * N + j] -= K[i] * h[j]
    const Pn = mulT(mul(A, P), A)
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) Pn[i * N + j] += r * K[i] * K[j]
    symmetrize(Pn)
    S.P = Pn
    for (let i = 0; i < N; i++) S.x[i] += K[i] * y
    return true
  }

  private gpsUpdate(gx: number, gz: number) {
    const hx = new Float64Array(N)
    hx[0] = 1
    const hz = new Float64Array(N)
    hz[1] = 1
    const okx = this.update(hx, gx - this.S.x[0], SIG.gpsX ** 2)
    const okz = this.update(hz, gz - this.S.x[1], SIG.gpsZ ** 2)
    return okx && okz
  }

  /** Tilt-corrected range to the ground measured at alignment. */
  private lidarUpdate(range: number) {
    const S = this.S
    const th = S.x[4]
    const c = Math.cos(th)
    const s = Math.sin(th)
    if (range < LIDAR_MIN || range > LIDAR_MAX || Math.abs(th) > LIDAR_TILT)
      return false
    const d = S.x[1] - S.ground
    const h = new Float64Array(N)
    h[1] = 1 / c
    h[4] = (d * s) / (c * c)
    return this.update(h, range - d / c, SIG.lidar ** 2)
  }

  /**
   * Averages the two IMUs while both report, learning their difference, so
   * losing one shifts the survivor by half that difference instead of
   * jolting the estimate.
   */
  private combine(a: Vec, b: Vec | null): Vec {
    const D = this.S.diff
    if (b) {
      const k = D.n < DIFF_WIN ? 1 / (D.n + 1) : 1 / DIFF_WIN
      for (let i = 0; i < 3; i++) D.d[i] += k * (a[i] - b[i] - D.d[i])
      D.n++
      this.S.imuMode = "Both"
      return a.map((v, i) => 0.5 * (v + b[i]))
    }
    this.S.imuMode = "A only"
    return D.n >= DIFF_MIN ? a.map((v, i) => v - 0.5 * D.d[i]) : a
  }

  /** Advances one 10 ms step with the given sensors switched on. */
  step(sensors: Sensors) {
    const S = this.S
    const T = truthAt(S.t)
    const st = S.step
    S.bA[0] += 2e-5 * this.gauss()
    S.bB[0] += 2e-5 * this.gauss()
    const imuA = [
      T.f[0] + S.bA[0] + SIG.a * this.gauss(),
      T.f[1] + S.bA[1] + SIG.a * this.gauss(),
      T.w + S.bA[2] + SIG.w * this.gauss(),
    ]
    const imuB = sensors.imuB
      ? [
          T.f[0] + S.bB[0] + SIG.a * this.gauss(),
          T.f[1] + S.bB[1] + SIG.a * this.gauss(),
          T.w + S.bB[2] + SIG.w * this.gauss(),
        ]
      : null
    const m = this.combine(imuA, imuB)
    const lidarDue = st % 2 === 0
    const gpsDue = st % 20 === 0
    const trueRange = (T.z + IMU_H) / Math.cos(T.th)
    const range =
      trueRange < LIDAR_MIN ? trueRange : trueRange + SIG.lidar * this.gauss()

    if (!S.aligned) {
      const still =
        Math.abs(Math.hypot(m[0], m[1]) - G) < 0.3 && Math.abs(m[2]) < 0.05
      if (still) {
        S.win.n++
        S.win.f[0] += m[0]
        S.win.f[1] += m[1]
        if (lidarDue && sensors.lidar) {
          S.win.lid += range
          S.win.nl++
        }
        if (S.win.n >= WINDOW) this.align()
      } else {
        S.win = { n: 0, f: [0, 0], lid: 0, nl: 0 }
      }
    } else {
      this.predict([m[0], m[1]], m[2])
      const d = S.dr
      const c = Math.cos(d.th)
      const s = Math.sin(d.th)
      d.vx += (c * imuA[0] - s * imuA[1]) * DT
      d.vz += (s * imuA[0] + c * imuA[1] - G) * DT
      d.x += d.vx * DT
      d.z += d.vz * DT
      d.th += imuA[2] * DT
      if (st % 3 === 0) {
        S.drTrail.push([d.x, d.z])
        if (S.drTrail.length > 400) S.drTrail.shift()
      }

      S.lidarHit = null
      if (lidarDue && sensors.lidar) {
        const ok = this.lidarUpdate(range)
        if (ok) S.lidAcc++
        else S.lidSkip++
        S.lidarHit = { ok, range: trueRange }
      }
      if (gpsDue && sensors.gps) {
        let gx = T.x + SIG.gpsX * this.gauss()
        let gz = T.z + SIG.gpsZ * this.gauss()
        if (S.badPending) {
          gx += 5
          gz += 3
          S.badPending = false
        }
        const ok = this.gpsUpdate(gx, gz)
        if (ok) S.gpsAcc++
        else S.gpsRej++
        S.gpsMarks.push({ x: gx, z: gz, ok, age: 0 })
        if (S.gpsMarks.length > 12) S.gpsMarks.shift()
      }
      if (st % 5 === 0) {
        S.hist.push({
          t: S.t,
          ex: S.x[0] - T.x,
          ez: S.x[1] - T.z,
          sx: Math.sqrt(S.P[0]),
          sz: Math.sqrt(S.P[N + 1]),
        })
      }
    }
    if (st % 4 === 0) {
      S.truthTrail.push([T.x, T.z])
      if (S.truthTrail.length > 300) S.truthTrail.shift()
    }
    S.gpsMarks.forEach((g) => (g.age += DT))
    S.t += DT
    S.step++
    S.truth = T
  }

  /**
   * Runs `seconds` of simulated time, looping back to the pad at the end of
   * the flight. Capped so a long pause can't stall the page.
   */
  advance(seconds: number, sensors: Sensors) {
    const steps = Math.min(60, Math.floor(seconds / DT))
    for (let i = 0; i < steps; i++) {
      this.step(sensors)
      if (this.S.t >= T_END) {
        this.reset()
        break
      }
    }
    return steps * DT
  }
}
