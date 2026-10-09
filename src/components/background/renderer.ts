import type { BackgroundConfig } from "./config"
import {
  LINE_STRIDE,
  NODE_STRIDE,
  POINT_STRIDE,
  RIPPLE_LIFE,
  RIPPLE_SPEED,
  type Sim,
} from "./flow-simulation"
import {
  AURORA_FRAGMENT,
  COMPOSITE_FRAGMENT,
  FADE_FRAGMENT,
  POINT_FRAGMENT,
  POINT_VERTEX,
  QUAD_VERTEX,
  SHAPE_FRAGMENT,
  SHAPE_VERTEX,
} from "./shaders"

/** The aurora is rendered at 1/AURORA_SCALE of the CSS size and stretched. */
const AURORA_SCALE = 5

export type RenderOptions = {
  config: BackgroundConfig
  /** Draw flow trails this frame (off under reduced motion or low quality). */
  flow: boolean
  /** Draw cluster nodes and lines this frame. */
  clusters: boolean
  /** Seconds since the previous frame; drives trail decay. */
  dt: number
  /** Extra energy while the agent streams, 0–1. */
  activity: number
  /** Accumulated scroll offset for the aurora's parallax, in noise units. */
  scroll: number
}

export type Renderer = {
  resize: (width: number, height: number, dpr: number) => void
  render: (sim: Sim, options: RenderOptions) => void
  dispose: () => void
}

type Program = {
  program: WebGLProgram
  uniform: (name: string) => WebGLUniformLocation | null
  attribute: (name: string) => number
}

type Target = { texture: WebGLTexture; framebuffer: WebGLFramebuffer }

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16)
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ]
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) throw new Error("Could not create shader")
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "Shader failed to compile")
  }
  return shader
}

function createProgram(
  gl: WebGLRenderingContext,
  vertex: string,
  fragment: string
): Program {
  const program = gl.createProgram()
  if (!program) throw new Error("Could not create program")
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertex))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "Program failed to link")
  }
  const uniforms = new Map<string, WebGLUniformLocation | null>()
  const attributes = new Map<string, number>()
  return {
    program,
    uniform: (name) => {
      if (!uniforms.has(name)) {
        uniforms.set(name, gl.getUniformLocation(program, name))
      }
      return uniforms.get(name) ?? null
    },
    attribute: (name) => {
      if (!attributes.has(name)) {
        attributes.set(name, gl.getAttribLocation(program, name))
      }
      return attributes.get(name) ?? -1
    },
  }
}

function createTarget(
  gl: WebGLRenderingContext,
  width: number,
  height: number
): Target {
  const texture = gl.createTexture()
  const framebuffer = gl.createFramebuffer()
  if (!texture || !framebuffer) throw new Error("Could not create target")
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    Math.max(1, width),
    Math.max(1, height),
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  )
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)
  return { texture, framebuffer }
}

function deleteTarget(gl: WebGLRenderingContext, target: Target | null) {
  if (!target) return
  gl.deleteTexture(target.texture)
  gl.deleteFramebuffer(target.framebuffer)
}

/**
 * Each section of the page leans on a different hue: the weight of hue k
 * peaks when the (cyclic) section position is at k.
 */
function hueWeights(section: number): [number, number, number, number] {
  const weights: [number, number, number, number] = [0, 0, 0, 0]
  const position = ((section % 4) + 4) % 4
  for (let k = 0; k < 4; k++) {
    const direct = Math.abs(position - k)
    const distance = Math.min(direct, 4 - direct)
    weights[k] = 0.45 + 0.55 * Math.max(0, 1 - distance / 1.5)
  }
  return weights
}

/** Returns null when WebGL isn't available, so the caller can fall back. */
export function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  })
  if (!gl) return null

  let aurora: Program
  let fade: Program
  let pointProgram: Program
  let composite: Program
  let shape: Program
  try {
    aurora = createProgram(gl, QUAD_VERTEX, AURORA_FRAGMENT)
    fade = createProgram(gl, QUAD_VERTEX, FADE_FRAGMENT)
    pointProgram = createProgram(gl, POINT_VERTEX, POINT_FRAGMENT)
    composite = createProgram(gl, QUAD_VERTEX, COMPOSITE_FRAGMENT)
    shape = createProgram(gl, SHAPE_VERTEX, SHAPE_FRAGMENT)
  } catch (error) {
    console.warn("[background] shaders unavailable:", error)
    return null
  }

  const quad = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  )
  const pointBuffer = gl.createBuffer()
  const nodeBuffer = gl.createBuffer()
  const lineBuffer = gl.createBuffer()

  gl.disable(gl.DEPTH_TEST)

  let width = 1
  let height = 1
  let dpr = 1
  let auroraTarget: Target | null = null
  let trailA: Target | null = null
  let trailB: Target | null = null
  let auroraSize: [number, number] = [1, 1]

  const drawQuad = (program: Program) => {
    const location = program.attribute("aPosition")
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.disableVertexAttribArray(location)
  }

  const setPalette = (program: Program, palette: string[]) => {
    const flat = new Float32Array(12)
    palette.slice(0, 4).forEach((hex, i) => flat.set(hexToRgb(hex), i * 3))
    gl.uniform3fv(program.uniform("uColors"), flat)
  }

  const setDim = (program: Program, config: BackgroundConfig) => {
    const half = Math.min(0.5, config.contentWidth / 2 / width)
    gl.uniform3f(
      program.uniform("uDim"),
      0.5 - half,
      0.5 + half,
      config.contentDim
    )
  }

  const resize: Renderer["resize"] = (nextWidth, nextHeight, nextDpr) => {
    width = Math.max(1, nextWidth)
    height = Math.max(1, nextHeight)
    dpr = nextDpr
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    deleteTarget(gl, auroraTarget)
    deleteTarget(gl, trailA)
    deleteTarget(gl, trailB)
    auroraSize = [
      Math.ceil(width / AURORA_SCALE),
      Math.ceil(height / AURORA_SCALE),
    ]
    auroraTarget = createTarget(gl, auroraSize[0], auroraSize[1])
    trailA = createTarget(gl, canvas.width, canvas.height)
    trailB = createTarget(gl, canvas.width, canvas.height)
  }

  const render: Renderer["render"] = (sim, options) => {
    if (!auroraTarget || !trailA || !trailB) return
    const { config } = options
    const base = hexToRgb(config.base)

    // --- 1. aurora into its small target ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, auroraTarget.framebuffer)
    gl.viewport(0, 0, auroraSize[0], auroraSize[1])
    gl.disable(gl.BLEND)
    gl.useProgram(aurora.program)
    gl.uniform1f(aurora.uniform("uTime"), sim.time * config.auroraSpeed)
    gl.uniform1f(aurora.uniform("uAspect"), width / height)
    gl.uniform3fv(aurora.uniform("uBase"), base)
    config.palette.forEach((hex, i) =>
      gl.uniform3fv(aurora.uniform(`uColor${i}`), hexToRgb(hex))
    )
    gl.uniform4fv(aurora.uniform("uWeights"), hueWeights(sim.section))
    gl.uniform1f(
      aurora.uniform("uIntensity"),
      config.layers.aurora
        ? config.auroraIntensity * (1 + options.activity * 0.25)
        : 0
    )
    gl.uniform1f(aurora.uniform("uScale"), config.auroraScale)
    gl.uniform1f(aurora.uniform("uScroll"), options.scroll)
    gl.uniform3f(
      aurora.uniform("uPointer"),
      sim.pointerX / width,
      1 - sim.pointerY / height,
      sim.pointerStrength * Math.min(1, config.interactionStrength)
    )
    const ripples = new Float32Array(16)
    const rippleHues = new Float32Array(4)
    sim.ripples.forEach((ripple, i) => {
      const life = 1 - ripple.age / RIPPLE_LIFE
      ripples.set(
        [
          ripple.x / width,
          1 - ripple.y / height,
          (ripple.age * RIPPLE_SPEED) / height,
          ripple.strength * config.rippleStrength * life * life,
        ],
        i * 4
      )
      rippleHues[i] = ripple.hue
    })
    gl.uniform4fv(aurora.uniform("uRipples[0]"), ripples)
    gl.uniform4fv(aurora.uniform("uRippleHues"), rippleHues)
    drawQuad(aurora)

    // --- 2. trails: fade the previous frame, then add this frame's points ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, trailB.framebuffer)
    gl.viewport(0, 0, canvas.width, canvas.height)
    if (options.flow) {
      gl.disable(gl.BLEND)
      gl.useProgram(fade.program)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, trailA.texture)
      gl.uniform1i(fade.uniform("uPrevious"), 0)
      gl.uniform1f(
        fade.uniform("uDecay"),
        Math.exp(-options.dt / Math.max(config.trailLength, 0.05))
      )
      drawQuad(fade)

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      gl.useProgram(pointProgram.program)
      gl.uniform2f(pointProgram.uniform("uResolution"), width, height)
      gl.uniform1f(pointProgram.uniform("uPointSize"), config.particleSize * dpr)
      gl.uniform1f(pointProgram.uniform("uOpacity"), config.particleOpacity)
      gl.uniform1f(
        pointProgram.uniform("uSpeedReference"),
        Math.max(config.flowSpeed, 1)
      )
      setPalette(pointProgram, config.palette)
      gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        sim.points.subarray(0, sim.count * POINT_STRIDE),
        gl.DYNAMIC_DRAW
      )
      const stride = POINT_STRIDE * 4
      const position = pointProgram.attribute("aPosition")
      const velocity = pointProgram.attribute("aVelocity")
      const alpha = pointProgram.attribute("aAlpha")
      gl.enableVertexAttribArray(position)
      gl.enableVertexAttribArray(velocity)
      gl.enableVertexAttribArray(alpha)
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, stride, 0)
      gl.vertexAttribPointer(velocity, 2, gl.FLOAT, false, stride, 8)
      gl.vertexAttribPointer(alpha, 1, gl.FLOAT, false, stride, 16)
      gl.drawArrays(gl.POINTS, 0, sim.count)
      gl.disableVertexAttribArray(position)
      gl.disableVertexAttribArray(velocity)
      gl.disableVertexAttribArray(alpha)
    } else {
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
    const swap = trailA
    trailA = trailB
    trailB = swap

    // --- 3. composite to the screen ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.disable(gl.BLEND)
    gl.useProgram(composite.program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, auroraTarget.texture)
    gl.uniform1i(composite.uniform("uAurora"), 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, trailA.texture)
    gl.uniform1i(composite.uniform("uTrail"), 1)
    gl.uniform3fv(composite.uniform("uBase"), base)
    gl.uniform1f(composite.uniform("uTrailAmount"), options.flow ? 1 : 0)
    gl.uniform1f(composite.uniform("uAdditive"), config.additive ? 1 : 0)
    setDim(composite, config)
    drawQuad(composite)
    gl.activeTexture(gl.TEXTURE0)

    // --- 4. cluster lines and nodes on top ---
    if (options.clusters && sim.nodeCount > 0) {
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, config.additive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA)
      gl.useProgram(shape.program)
      gl.uniform2f(shape.uniform("uResolution"), width, height)
      setPalette(shape, config.palette)
      setDim(shape, config)
      const position = shape.attribute("aPosition")
      const value = shape.attribute("aValue")
      gl.enableVertexAttribArray(position)
      gl.enableVertexAttribArray(value)

      if (sim.lineVertexCount > 0) {
        gl.uniform1f(shape.uniform("uUseHue"), 0)
        gl.uniform1f(shape.uniform("uOpacity"), config.lineOpacity)
        gl.uniform3fv(shape.uniform("uColor"), hexToRgb(config.palette[1]))
        gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer)
        gl.bufferData(
          gl.ARRAY_BUFFER,
          sim.lines.subarray(0, sim.lineVertexCount * LINE_STRIDE),
          gl.DYNAMIC_DRAW
        )
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, LINE_STRIDE * 4, 0)
        gl.vertexAttribPointer(value, 1, gl.FLOAT, false, LINE_STRIDE * 4, 8)
        gl.drawArrays(gl.LINES, 0, sim.lineVertexCount)
      }

      gl.uniform1f(shape.uniform("uUseHue"), 1)
      gl.uniform1f(shape.uniform("uOpacity"), config.nodeOpacity)
      gl.uniform1f(shape.uniform("uPointSize"), 4 * dpr)
      gl.bindBuffer(gl.ARRAY_BUFFER, nodeBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, sim.nodes, gl.DYNAMIC_DRAW)
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, NODE_STRIDE * 4, 0)
      gl.vertexAttribPointer(value, 1, gl.FLOAT, false, NODE_STRIDE * 4, 8)
      gl.drawArrays(gl.POINTS, 0, sim.nodeCount)

      gl.disableVertexAttribArray(position)
      gl.disableVertexAttribArray(value)
    }
  }

  const dispose: Renderer["dispose"] = () => {
    deleteTarget(gl, auroraTarget)
    deleteTarget(gl, trailA)
    deleteTarget(gl, trailB)
    gl.deleteBuffer(quad)
    gl.deleteBuffer(pointBuffer)
    gl.deleteBuffer(nodeBuffer)
    gl.deleteBuffer(lineBuffer)
    for (const item of [aurora, fade, pointProgram, composite, shape]) {
      gl.deleteProgram(item.program)
    }
  }

  return { resize, render, dispose }
}
