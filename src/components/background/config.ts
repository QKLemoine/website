export type BackgroundLayers = {
  /** Soft, slowly morphing colour blobs. */
  aurora: boolean
  /** Flow-field particles and their trails. */
  flow: boolean
  /** Clustered nodes with lines between close neighbours. */
  clusters: boolean
}

export type BackgroundConfig = {
  layers: BackgroundLayers
  /** Page colour under everything. Never pure black or white. */
  base: string
  /** Four hues shared by every layer. */
  palette: [string, string, string, string]
  /** Add particle light to the page (dark themes) instead of painting over it (light themes). */
  additive: boolean

  /** 0–1. How strongly the colour blobs tint the base. */
  auroraIntensity: number
  /** Blob size: higher means more, smaller blobs. */
  auroraScale: number
  /** How fast the blobs morph. 1 is the default pace. */
  auroraSpeed: number

  /** Upper bound on flow particles; scaled down on small screens. */
  particleCount: number
  /** Point size in CSS pixels. */
  particleSize: number
  /** 0–1. */
  particleOpacity: number
  /** Seconds a trail takes to fade. */
  trailLength: number
  /** Flow speed at rest, CSS pixels per second. */
  flowSpeed: number
  /** Size of the swirls in the flow field: lower means broader curves. */
  flowScale: number

  clusterCount: number
  /** How firmly flow particles gather around clusters. 0 disables it. */
  clusterPull: number
  /** Nodes that carry the connecting lines. */
  nodeCount: number
  /** 0–1. */
  nodeOpacity: number
  /** Nodes closer than this (CSS pixels) are joined by a line. */
  linkDistance: number
  /** 0–1. */
  lineOpacity: number

  /** Strength of the cursor vortex. 0 turns it off. */
  interactionStrength: number
  /** Reach of the cursor, CSS pixels. */
  interactionRadius: number
  /** 0–1. Brightness of the click/tap ripple. */
  rippleStrength: number
  /** How far the field shifts per pixel scrolled. */
  scrollParallax: number

  /** Width (CSS pixels) of the centred column where the page's text sits. */
  contentWidth: number
  /** 0–1. How much the field is calmed behind that column. */
  contentDim: number
  /** Canvas resolution cap. */
  maxDevicePixelRatio: number
}

const shared = {
  layers: { aurora: true, flow: true, clusters: true },
  auroraScale: 1.6,
  auroraSpeed: 1,
  particleCount: 2600,
  particleSize: 1.6,
  trailLength: 1.1,
  flowSpeed: 38,
  flowScale: 1,
  clusterCount: 5,
  clusterPull: 0.12,
  nodeCount: 110,
  linkDistance: 86,
  interactionStrength: 1,
  interactionRadius: 190,
  rippleStrength: 0.5,
  scrollParallax: 0.06,
  contentWidth: 1024,
  // 0.75 is the measured point where muted text keeps WCAG AA (4.5:1) on
  // every sampled block, including under ripples on a phone.
  contentDim: 0.75,
  maxDevicePixelRatio: 1.5,
} satisfies Partial<BackgroundConfig>

export const lightBackgroundConfig: BackgroundConfig = {
  ...shared,
  base: "#faf7f2",
  palette: ["#3b82f6", "#8b5cf6", "#14b8a6", "#ec4899"],
  additive: false,
  auroraIntensity: 0.2,
  particleOpacity: 0.42,
  nodeOpacity: 0.5,
  lineOpacity: 0.22,
}

export const darkBackgroundConfig: BackgroundConfig = {
  ...shared,
  base: "#0a0e24",
  palette: ["#60a5fa", "#a78bfa", "#2dd4bf", "#f472b6"],
  additive: true,
  auroraIntensity: 0.26,
  particleOpacity: 0.5,
  nodeOpacity: 0.5,
  // Bright additive ripples over light nodes are the one place dark-mode
  // text contrast gets tight, so both are a touch lower here.
  rippleStrength: 0.38,
  lineOpacity: 0.2,
}
