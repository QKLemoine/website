export type WallpaperConfig = {
  /** Points simulated on a capable device; halved on low-power ones. */
  particleCount: number
  /** Number of drifting clusters the points gather around. */
  clusterCount: number
  /** One hex colour per cluster, cycled if there are fewer colours than clusters. */
  palette: string[]
  /** Hex colour behind everything. */
  background: string
  /** How hard the cursor pushes points away. 0 turns cursor interaction off. */
  interactionStrength: number
  /** Reach of the cursor, in CSS pixels. */
  interactionRadius: number
  /** Canvas resolution cap; higher is sharper but costs fill rate. */
  maxDevicePixelRatio: number
  /** Seconds of motion each point's streak shows; 0 draws plain dots. */
  trailLength: number
  /** 0–1. Brightness of the soft colour fields behind each cluster. */
  glowOpacity: number
}

export const defaultWallpaperConfig: WallpaperConfig = {
  particleCount: 800,
  clusterCount: 6,
  palette: ["#6366f1", "#38bdf8", "#2dd4bf", "#a78bfa", "#34d399", "#60a5fa"],
  background: "#06070b",
  interactionStrength: 1,
  interactionRadius: 150,
  maxDevicePixelRatio: 1.5,
  trailLength: 0.07,
  glowOpacity: 0.2,
}
