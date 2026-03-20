import { clamp01 } from './params.js'

const fract = (v) => v - Math.floor(v)
const hash2 = (x, y, seed) => fract(Math.sin(x * 127.1 + y * 311.7 + seed * 17.13) * 43758.5453123)

const smoothNoise = (x, y, seed) => {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = x0 + 1
  const y1 = y0 + 1

  const tx = x - x0
  const ty = y - y0

  const a = hash2(x0, y0, seed)
  const b = hash2(x1, y0, seed)
  const c = hash2(x0, y1, seed)
  const d = hash2(x1, y1, seed)

  const sx = tx * tx * (3 - 2 * tx)
  const sy = ty * ty * (3 - 2 * ty)

  const ab = a + (b - a) * sx
  const cd = c + (d - c) * sx
  return ab + (cd - ab) * sy
}

export const sampleIntensity = (x, y, t, p) => {
  const r = Math.sqrt(x * x + y * y)
  const theta = Math.atan2(y, x)

  const radialBase = Math.exp(-p.radialDecay * r * r)
  const polarWave = 0.5 + 0.5 * Math.cos(p.radialFreq * r + p.angularFreq * theta + p.phase + t * p.speed)

  const nx = x * p.noiseScale + t * 0.21
  const ny = y * p.noiseScale - t * 0.17
  const noiseTerm = smoothNoise(nx, ny, 1.234)

  const mixed = (1 - p.waveMix) * radialBase + p.waveMix * polarWave
  const jitterTerm = 1 + p.jitter * (noiseTerm - 0.5)
  const noisy = mixed * (1 - p.noiseStrength + p.noiseStrength * noiseTerm) * jitterTerm

  return clamp01(noisy)
}

const hslToRgb = (h, s, l) => {
  const hue2rgb = (p, q, t) => {
    let v = t
    if (v < 0) v += 1
    if (v > 1) v -= 1
    if (v < 1 / 6) return p + (q - p) * 6 * v
    if (v < 1 / 2) return q
    if (v < 2 / 3) return p + (q - p) * (2 / 3 - v) * 6
    return p
  }

  if (s === 0) {
    const c = Math.round(l * 255)
    return [c, c, c]
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const r = hue2rgb(p, q, h + 1 / 3)
  const g = hue2rgb(p, q, h)
  const b = hue2rgb(p, q, h - 1 / 3)
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

export const toneMap = (intensity, p) => {
  const lit = clamp01(Math.pow(intensity, 0.9) * p.brightness)
  const h = (0.58 + p.hueShift * 0.25 + intensity * 0.15) % 1
  const s = clamp01(0.6 * p.saturation)
  const l = clamp01(0.1 + lit * 0.85)
  const [r, g, b] = hslToRgb(h < 0 ? h + 1 : h, s, l)
  return [r, g, b, 255]
}
