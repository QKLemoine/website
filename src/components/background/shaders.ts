// GLSL ES 1.0 so the background runs on any WebGL-capable device.

const PRECISION = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`

/** Full-screen triangle pair; vUv has its origin at the bottom-left. */
export const QUAD_VERTEX = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

/**
 * Layer 1. Domain-warped value noise picks where each of the four hues tints
 * the base colour. Rendered small and upscaled, which is both cheap and soft.
 */
export const AURORA_FRAGMENT = `${PRECISION}
varying vec2 vUv;
uniform float uTime;
uniform float uAspect;
uniform vec3 uBase;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec4 uWeights;
uniform float uIntensity;
uniform float uScale;
uniform float uScroll;
uniform vec3 uPointer;
uniform vec4 uRipples[4];
uniform vec4 uRippleHues;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    amplitude *= 0.5;
  }
  return value / 0.875;
}

vec3 hue(float index) {
  if (index < 0.5) return uColor0;
  if (index < 1.5) return uColor1;
  if (index < 2.5) return uColor2;
  return uColor3;
}

void main() {
  vec2 aspect = vec2(uAspect, 1.0);
  vec2 p = vUv * aspect * uScale + vec2(0.0, uScroll);

  // The colour field bends toward the cursor.
  vec2 toPointer = (vUv - uPointer.xy) * aspect;
  float near = exp(-dot(toPointer, toPointer) * 9.0) * uPointer.z;
  p -= toPointer * near * 1.3;

  // Domain warp: sample the noise at a position that is itself displaced by
  // noise. This is what turns blobby noise into flowing, aurora-like shapes.
  vec2 warp = vec2(
    fbm(p + vec2(0.0, uTime * 0.05)),
    fbm(p + vec2(5.2, 1.3) - vec2(uTime * 0.04, 0.0))
  );
  vec2 q = p + 1.4 * warp;

  float n0 = fbm(q + vec2(uTime * 0.03, 0.0));
  float n1 = fbm(q * 1.2 + vec2(9.1, -uTime * 0.025));
  float n2 = fbm(q * 0.9 + vec2(-3.7, uTime * 0.02) + 4.0);
  float n3 = fbm(q * 1.5 + vec2(uTime * 0.035, 7.7));

  vec3 color = uBase;
  color = mix(color, uColor0, smoothstep(0.42, 0.82, n0) * uWeights.x * uIntensity);
  color = mix(color, uColor1, smoothstep(0.42, 0.82, n1) * uWeights.y * uIntensity);
  color = mix(color, uColor2, smoothstep(0.42, 0.82, n2) * uWeights.z * uIntensity);
  color = mix(color, uColor3, smoothstep(0.46, 0.86, n3) * uWeights.w * uIntensity);

  color = mix(color, uColor1, near * 0.16 * uIntensity * 3.0);

  // Click/tap ripples: soft expanding rings of colour.
  for (int i = 0; i < 4; i++) {
    vec4 ripple = uRipples[i];
    if (ripple.w > 0.0) {
      float dist = length((vUv - ripple.xy) * aspect);
      float ring = exp(-pow((dist - ripple.z) / 0.05, 2.0));
      float index = i == 0 ? uRippleHues.x : i == 1 ? uRippleHues.y : i == 2 ? uRippleHues.z : uRippleHues.w;
      color = mix(color, hue(index), ring * ripple.w);
    }
  }

  gl_FragColor = vec4(color, 1.0);
}
`

/**
 * Trail feedback: redraw last frame slightly dimmer. Subtracting a small
 * constant as well makes trails reach exactly zero; multiplying alone stalls
 * a few 8-bit steps above it and leaves permanent ghosts.
 */
export const FADE_FRAGMENT = `${PRECISION}
varying vec2 vUv;
uniform sampler2D uPrevious;
uniform float uDecay;
void main() {
  vec4 previous = texture2D(uPrevious, vUv);
  gl_FragColor = max(previous * uDecay - vec4(1.0 / 255.0), 0.0);
}
`

/** Layer 2. Each particle is coloured by its direction of travel. */
export const POINT_VERTEX = `
attribute vec2 aPosition;
attribute vec2 aVelocity;
attribute float aAlpha;
uniform vec2 uResolution;
uniform float uPointSize;
uniform float uOpacity;
uniform float uSpeedReference;
uniform vec3 uColors[4];
varying vec4 vColor;

void main() {
  // Direction of travel mapped around the four-hue palette.
  float angle = atan(aVelocity.y, aVelocity.x) / 6.2831853 + 0.5;
  float position = angle * 4.0;
  int index = int(mod(floor(position), 4.0));
  int next = int(mod(floor(position) + 1.0, 4.0));
  vec3 color = mix(uColors[index], uColors[next], fract(position));

  // Slow particles are fainter, so the picture is quiet where nothing moves.
  float speed = clamp(length(aVelocity) / uSpeedReference, 0.25, 1.0);
  float alpha = aAlpha * uOpacity * speed;
  vColor = vec4(color * alpha, alpha);

  vec2 clip = aPosition / uResolution * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = uPointSize;
}
`

export const POINT_FRAGMENT = `${PRECISION}
varying vec4 vColor;
void main() {
  float dist = length(gl_PointCoord - 0.5);
  gl_FragColor = vColor * smoothstep(0.5, 0.15, dist);
}
`

const CONTENT_DIM = `
uniform vec3 uDim; // left edge, right edge (0-1 across the screen), amount
float calm(float x) {
  float inside =
    smoothstep(uDim.x - 0.07, uDim.x + 0.05, x) *
    (1.0 - smoothstep(uDim.y - 0.05, uDim.y + 0.07, x));
  return 1.0 - uDim.z * inside;
}
`

/** Puts the aurora and the trails on screen, calmer behind the text column. */
export const COMPOSITE_FRAGMENT = `${PRECISION}
varying vec2 vUv;
uniform sampler2D uAurora;
uniform sampler2D uTrail;
uniform vec3 uBase;
uniform float uTrailAmount;
uniform float uAdditive;
${CONTENT_DIM}

float grain(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float keep = calm(vUv.x);
  vec3 aurora = texture2D(uAurora, vUv).rgb;
  // Behind the text the blobs are pulled back toward the base colour.
  vec3 color = mix(uBase, aurora, keep);

  vec4 trail = texture2D(uTrail, vUv) * uTrailAmount * keep;
  color = mix(color * (1.0 - trail.a) + trail.rgb, color + trail.rgb, uAdditive);

  // A sub-visible dither stops the soft gradients from banding.
  color += (grain(gl_FragCoord.xy) - 0.5) / 255.0;
  gl_FragColor = vec4(color, 1.0);
}
`

/** Layer 3. Lines and nodes, drawn straight to the screen each frame. */
export const SHAPE_VERTEX = `
attribute vec2 aPosition;
attribute float aValue;
uniform vec2 uResolution;
uniform float uPointSize;
uniform float uOpacity;
uniform float uUseHue;
uniform vec3 uColor;
uniform vec3 uColors[4];
varying vec4 vColor;
varying float vRound;
${CONTENT_DIM}

void main() {
  float x = aPosition.x / uResolution.x;
  // Lines pass their alpha in aValue; nodes pass a palette index.
  vec3 color = uUseHue > 0.5 ? uColors[int(mod(aValue, 4.0))] : uColor;
  float alpha = (uUseHue > 0.5 ? 1.0 : aValue) * uOpacity * calm(x);
  vColor = vec4(color * alpha, alpha);
  vRound = uUseHue;
  vec2 clip = aPosition / uResolution * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = uPointSize;
}
`

export const SHAPE_FRAGMENT = `${PRECISION}
varying vec4 vColor;
varying float vRound;
void main() {
  float shape = 1.0;
  if (vRound > 0.5) {
    shape = smoothstep(0.5, 0.2, length(gl_PointCoord - 0.5));
  }
  gl_FragColor = vColor * shape;
}
`
