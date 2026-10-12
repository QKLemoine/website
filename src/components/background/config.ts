/** The two candidate patterns. Compare them at /bg-playground. */
export type BackgroundMotif = "dots" | "contours"

export type BackgroundConfig = {
  motif: BackgroundMotif
  /** Colour of the pattern at rest. Comes from the --text-muted token. */
  ink: string
  /** Colour it brightens to near the cursor. Comes from the --brand token. */
  accent: string

  /** 0–1. Opacity of the pattern at rest; keep it low. */
  restOpacity: number
  /** 0–1. Opacity of the accent colour right under the cursor. */
  highlightOpacity: number

  /** Dots: gap between dots, CSS pixels. */
  dotSpacing: number
  /** Dots: radius, CSS pixels. */
  dotSize: number

  /** Contours: size of the hills the lines trace, CSS pixels. */
  contourScale: number
  /** Contours: lines per hill; higher packs them closer. */
  contourDensity: number
  /** Contours: stroke width, CSS pixels. */
  lineWidth: number

  /** Reach of the cursor, CSS pixels. */
  interactionRadius: number
  /** 0–1. How far the pattern bends around the cursor. 0 only brightens. */
  bend: number
  /** 0–1. Strength of the click/tap ripple. 0 turns it off. */
  rippleStrength: number

  /** Fraction of the section's height scrolled at which it has faded out. */
  fadeEnd: number
  /** Canvas resolution cap. */
  maxDevicePixelRatio: number
}

/** The two colour fields, which come from CSS tokens rather than from here. */
export type BackgroundColors = Pick<BackgroundConfig, "ink" | "accent">

/** Everything about the background except its colours. */
export type BackgroundSettings = Omit<BackgroundConfig, keyof BackgroundColors>

const shared = {
  // Switch to "contours" here once you've picked one in the playground.
  motif: "dots",
  dotSpacing: 28,
  dotSize: 1,
  contourScale: 380,
  contourDensity: 7,
  lineWidth: 1,
  interactionRadius: 170,
  bend: 0.5,
  fadeEnd: 0.6,
  maxDevicePixelRatio: 2,
} satisfies Partial<BackgroundSettings>

export const lightBackgroundSettings: BackgroundSettings = {
  ...shared,
  restOpacity: 0.26,
  highlightOpacity: 0.7,
  rippleStrength: 0.5,
}

export const darkBackgroundSettings: BackgroundSettings = {
  ...shared,
  restOpacity: 0.22,
  highlightOpacity: 0.8,
  rippleStrength: 0.5,
}

/** Rest opacities that suit each motif: lines carry more ink than dots. */
export const MOTIF_REST_SCALE: Record<BackgroundMotif, number> = {
  dots: 1,
  contours: 0.6,
}
