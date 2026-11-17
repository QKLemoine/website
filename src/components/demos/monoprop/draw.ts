// Canvas drawing for the Monoprop demo: the side-view scene and the two
// error plots. Colours come from CSS custom properties on the canvas's own
// element, so the drawing follows the site theme (and any forced theme on
// the tile).

import { IMU_H, N, T_END, T_LAND, T_LAUNCH, type SimState } from "./sim"

export type Palette = {
  sky: string
  ground: string
  ink: string
  muted: string
  rule: string
  surface: string
  est: string
  gps: string
  lidar: string
  drift: string
  danger: string
  plume: string
  font: string
}

/** Reads the palette from the tokens in effect at `el`. */
export function readPalette(el: Element): Palette {
  const cs = getComputedStyle(el)
  const v = (name: string) => cs.getPropertyValue(name).trim()
  return {
    sky: v("--surface"),
    ground: v("--line"),
    ink: v("--text"),
    muted: v("--text-muted"),
    rule: v("--line"),
    surface: v("--page"),
    est: v("--brand"),
    gps: v("--mp-gps"),
    lidar: v("--mp-lidar"),
    drift: v("--mp-drift"),
    danger: v("--mp-danger"),
    plume: v("--mp-plume"),
    font: v("--font-geist-mono") || "ui-monospace, monospace",
  }
}

/** Matches the canvas's backing store to its laid-out size. */
function fit(cv: HTMLCanvasElement) {
  const r = cv.getBoundingClientRect()
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const w = Math.max(1, Math.round(r.width * dpr))
  const h = Math.max(1, Math.round(r.height * dpr))
  if (cv.width !== w || cv.height !== h) {
    cv.width = w
    cv.height = h
  }
  return { w, h, dpr }
}

function drawVehicle(
  ctx: CanvasRenderingContext2D,
  col: Palette,
  sc: number,
  X: number,
  Y: number,
  th: number,
  mode: "truth" | "est",
  flame: boolean
) {
  ctx.save()
  ctx.translate(X, Y)
  ctx.rotate(-th)
  const u = (v: number) => v * sc
  ctx.lineWidth = Math.max(1.2, u(0.025))
  ctx.lineJoin = "round"
  if (flame) {
    const len = u(0.35 + 0.08 * Math.sin(performance.now() / 60))
    ctx.beginPath()
    ctx.moveTo(u(-0.07), u(0.16))
    ctx.quadraticCurveTo(0, u(0.16) + len * 1.2, u(0.07), u(0.16))
    ctx.closePath()
    ctx.fillStyle = col.plume
    ctx.globalAlpha = 0.85
    ctx.fill()
    ctx.globalAlpha = 1
  }
  const body = () => {
    ctx.beginPath()
    ctx.moveTo(u(-0.15), u(0.05))
    ctx.lineTo(u(-0.15), u(-0.55))
    ctx.quadraticCurveTo(u(-0.15), u(-0.78), 0, u(-0.82))
    ctx.quadraticCurveTo(u(0.15), u(-0.78), u(0.15), u(-0.55))
    ctx.lineTo(u(0.15), u(0.05))
    ctx.closePath()
  }
  const legs = () => {
    ctx.beginPath()
    ctx.moveTo(u(-0.13), u(-0.02))
    ctx.lineTo(u(-0.32), u(0.15))
    ctx.moveTo(u(0.13), u(-0.02))
    ctx.lineTo(u(0.32), u(0.15))
    ctx.moveTo(u(-0.07), u(0.05))
    ctx.lineTo(u(-0.1), u(0.16))
    ctx.lineTo(u(0.1), u(0.16))
    ctx.lineTo(u(0.07), u(0.05))
  }
  if (mode === "truth") {
    body()
    ctx.fillStyle = col.surface
    ctx.fill()
    ctx.strokeStyle = col.ink
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(u(-0.15), u(-0.3))
    ctx.lineTo(u(0.15), u(-0.3))
    ctx.strokeStyle = col.muted
    ctx.stroke()
    legs()
    ctx.strokeStyle = col.ink
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, 0, u(0.03), 0, Math.PI * 2)
    ctx.fillStyle = col.ink
    ctx.fill()
  } else {
    ctx.setLineDash([u(0.06), u(0.04)])
    body()
    ctx.strokeStyle = col.est
    ctx.stroke()
    legs()
    ctx.stroke()
    ctx.setLineDash([])
  }
  ctx.restore()
}

/**
 * The side view: the true vehicle, the filter's estimate with its 2σ
 * ellipse, GPS fixes, the LiDAR beam and the uncorrected IMU-only track.
 * `zoom` > 1 frames the vehicle tighter, for the small tile.
 */
export function drawScene(
  cv: HTMLCanvasElement,
  S: SimState,
  col: Palette,
  lidarOn: boolean,
  zoom = 1
) {
  const ctx = cv.getContext("2d")
  if (!ctx) return
  const { w, h, dpr } = fit(cv)
  const sc = Math.min(w / 8.4, h / 4.2) * zoom
  const cx = w / 2
  const groundY = h - 0.45 * sc
  const X = (x: number) => cx + x * sc
  const Y = (z: number) => groundY - (z + IMU_H) * sc
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = col.sky
  ctx.fillRect(0, 0, w, h)

  // Altitude grid.
  ctx.font = `${11 * dpr}px ${col.font}`
  ctx.fillStyle = col.muted
  ctx.strokeStyle = col.rule
  ctx.lineWidth = 1
  for (let m = 1; m <= 3; m++) {
    const y = Y(m - IMU_H)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
    ctx.fillText(`${m} m`, 10 * dpr, y - 4 * dpr)
  }
  // Ground and pad.
  ctx.fillStyle = col.ground
  ctx.fillRect(0, groundY, w, h - groundY)
  ctx.fillStyle = col.muted
  ctx.fillRect(X(-0.6), groundY - 0.05 * sc, 1.2 * sc, 0.05 * sc)
  ctx.fillText("pad", X(0.68), groundY - 3 * dpr)
  if (!S.truth) return
  const T = S.truth

  // Truth trail.
  ctx.strokeStyle = col.ink
  ctx.globalAlpha = 0.18
  ctx.lineWidth = 1.5 * dpr
  ctx.beginPath()
  S.truthTrail.forEach((p, i) =>
    i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))
  )
  ctx.stroke()
  ctx.globalAlpha = 1

  // IMU-only drift.
  if (S.drTrail.length > 1) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, w, groundY)
    ctx.clip()
    ctx.strokeStyle = col.drift
    ctx.lineWidth = 2 * dpr
    ctx.setLineDash([2 * dpr, 4 * dpr])
    ctx.beginPath()
    S.drTrail.forEach((p, i) =>
      i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))
    )
    ctx.stroke()
    ctx.setLineDash([])
    const last = S.drTrail[S.drTrail.length - 1]
    const lx = X(last[0])
    const ly = Y(last[1])
    if (lx > 0 && lx < w && ly > 0 && ly < groundY) {
      ctx.fillStyle = col.drift
      ctx.fillText("IMU only", lx + 6 * dpr, ly - 6 * dpr)
    }
    ctx.restore()
  }

  // LiDAR beam.
  if (S.lidarHit && lidarOn) {
    const s = Math.sin(T.th)
    const c = Math.cos(T.th)
    const r = S.lidarHit.range
    ctx.strokeStyle = col.lidar
    ctx.lineWidth = 2 * dpr
    ctx.globalAlpha = S.lidarHit.ok ? 0.9 : 0.3
    ctx.beginPath()
    ctx.moveTo(X(T.x), Y(T.z))
    ctx.lineTo(X(T.x + s * r), Y(T.z - c * r))
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(X(T.x + s * r), Y(T.z - c * r), 3 * dpr, 0, 7)
    ctx.fillStyle = col.lidar
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // GPS fixes, fading out; rejected ones circled.
  S.gpsMarks.forEach((g) => {
    const a = Math.max(0, 1 - g.age / 2.4)
    if (!a) return
    const gx = X(g.x)
    const gy = Y(g.z)
    const k = 5 * dpr
    ctx.globalAlpha = a
    ctx.strokeStyle = g.ok ? col.gps : col.danger
    ctx.lineWidth = 2 * dpr
    ctx.beginPath()
    ctx.moveTo(gx - k, gy - k)
    ctx.lineTo(gx + k, gy + k)
    ctx.moveTo(gx + k, gy - k)
    ctx.lineTo(gx - k, gy + k)
    ctx.stroke()
    if (!g.ok) {
      ctx.beginPath()
      ctx.arc(gx, gy, 12 * dpr, 0, 7)
      ctx.stroke()
      ctx.fillStyle = col.danger
      ctx.fillText("rejected by gate", gx - 50 * dpr, gy - 18 * dpr)
    }
    ctx.globalAlpha = 1
  })

  // The vehicle, and the filter's idea of it.
  const flame = S.t > T_LAUNCH && S.t < T_LAND + 0.3
  drawVehicle(ctx, col, sc, X(T.x), Y(T.z), T.th, "truth", flame)
  if (S.aligned) {
    const a = S.P[0]
    const b = S.P[1]
    const d = S.P[N + 1]
    const tr = (a + d) / 2
    const det = Math.sqrt(Math.max(0, ((a - d) / 2) ** 2 + b * b))
    const l1 = tr + det
    const l2 = Math.max(1e-9, tr - det)
    const ang = 0.5 * Math.atan2(2 * b, a - d)
    ctx.save()
    ctx.translate(X(S.x[0]), Y(S.x[1]))
    ctx.rotate(-ang)
    ctx.beginPath()
    ctx.ellipse(
      0,
      0,
      Math.max(2 * dpr, 2 * Math.sqrt(l1) * sc),
      Math.max(2 * dpr, 2 * Math.sqrt(l2) * sc),
      0,
      0,
      7
    )
    ctx.fillStyle = col.est
    ctx.globalAlpha = 0.12
    ctx.fill()
    ctx.globalAlpha = 0.7
    ctx.strokeStyle = col.est
    ctx.lineWidth = dpr
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.restore()
    drawVehicle(ctx, col, sc, X(S.x[0]), Y(S.x[1]), S.x[4], "est", false)
  }
}

/** Estimate-minus-truth over the flight, inside the filter's own ±2σ band. */
export function drawPlot(
  cv: HTMLCanvasElement,
  S: SimState,
  col: Palette,
  key: "ex" | "ez",
  sKey: "sx" | "sz",
  lim: number
) {
  const ctx = cv.getContext("2d")
  if (!ctx) return
  const { w, h, dpr } = fit(cv)
  ctx.clearRect(0, 0, w, h)
  const padL = 40 * dpr
  const padB = 16 * dpr
  const pw = w - padL - 4 * dpr
  const ph = h - padB - 4 * dpr
  const X = (t: number) => padL + (t / T_END) * pw
  const Y = (v: number) =>
    4 * dpr + ph / 2 - (Math.max(-lim, Math.min(lim, v)) / lim) * (ph / 2)
  ctx.font = `${10.5 * dpr}px ${col.font}`
  ctx.fillStyle = col.muted
  ctx.strokeStyle = col.rule
  ctx.lineWidth = 1
  ;[lim, 0, -lim].forEach((v) => {
    const y = Y(v)
    ctx.beginPath()
    ctx.moveTo(padL, y)
    ctx.lineTo(w, y)
    ctx.stroke()
    ctx.fillText(
      (v > 0 ? "+" : "") + v.toFixed(v ? 1 : 0),
      2 * dpr,
      y + 4 * dpr
    )
  })
  ;[0, 5, 10, 15, 20].forEach((t) =>
    ctx.fillText(`${t}s`, X(t) - 6 * dpr, h - 3 * dpr)
  )
  const H = S.hist
  if (H.length < 2) return
  ctx.beginPath()
  H.forEach((p, i) =>
    i ? ctx.lineTo(X(p.t), Y(2 * p[sKey])) : ctx.moveTo(X(p.t), Y(2 * p[sKey]))
  )
  for (let i = H.length - 1; i >= 0; i--)
    ctx.lineTo(X(H[i].t), Y(-2 * H[i][sKey]))
  ctx.closePath()
  ctx.fillStyle = col.est
  ctx.globalAlpha = 0.15
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.beginPath()
  H.forEach((p, i) =>
    i ? ctx.lineTo(X(p.t), Y(p[key])) : ctx.moveTo(X(p.t), Y(p[key]))
  )
  ctx.strokeStyle = col.est
  ctx.lineWidth = 1.6 * dpr
  ctx.stroke()
}
