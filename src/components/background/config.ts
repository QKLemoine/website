export type BackgroundConfig = {
  /** Upper bound on points; small screens get fewer (see areaPerParticle). */
  particleCount: number
  /** One point per this many CSS pixels of viewport, so phones aren't crowded. */
  areaPerParticle: number
  /** Number of drifting clusters the points gather around. */
  clusterCount: number
  /** One hex colour per cluster, cycled if there are fewer colours than clusters. */
  palette: string[]
  /** 0–1. Opacity of the points. */
  pointOpacity: number
  /** 0–1. Brightness of the soft colour fields behind each cluster. */
  glowOpacity: number
  /** "lighter" adds light where points overlap (dark pages); "source-over" keeps colours solid (light pages). */
  blend: "lighter" | "source-over"
  /** "r, g, b" of the click/stream ripple ring. */
  rippleColor: string
  /** How hard the cursor pushes points away. 0 turns cursor interaction off. */
  interactionStrength: number
  /** Reach of the cursor, in CSS pixels. */
  interactionRadius: number
  /** 0–1. Strength of the ripple sent out by a click or tap. */
  clickStrength: number
  /** How far the clusters travel along their paths per viewport of scroll, in radians. */
  scrollShift: number
  /** Canvas resolution cap; higher is sharper but costs fill rate. */
  maxDevicePixelRatio: number
  /** Seconds of motion each point's streak shows; 0 draws plain dots. */
  trailLength: number
}

const shared = {
  particleCount: 420,
  areaPerParticle: 3000,
  clusterCount: 5,
  interactionStrength: 0.55,
  interactionRadius: 140,
  clickStrength: 0.5,
  scrollShift: 0.35,
  maxDevicePixelRatio: 1.5,
  trailLength: 0.04,
} satisfies Partial<BackgroundConfig>

// Light pages need deeper, more saturated points (pale ones vanish on white)
// and normal blending; dark pages get lighter tints that glow where they overlap.
export const lightBackgroundConfig: BackgroundConfig = {
  ...shared,
  palette: ["#4f46e5", "#0284c7", "#0d9488", "#7c3aed", "#059669"],
  pointOpacity: 0.4,
  glowOpacity: 0.09,
  blend: "source-over",
  rippleColor: "30, 41, 59",
}

export const darkBackgroundConfig: BackgroundConfig = {
  ...shared,
  palette: ["#818cf8", "#38bdf8", "#2dd4bf", "#a78bfa", "#34d399"],
  pointOpacity: 0.55,
  glowOpacity: 0.11,
  blend: "lighter",
  rippleColor: "255, 255, 255",
}
