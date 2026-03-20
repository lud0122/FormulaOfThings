export const clamp01 = (v) => Math.max(0, Math.min(1, v))

export const schema = {
  radialFreq: { min: 1, max: 24, step: 0.1, default: 8, group: 'geometry' },
  angularFreq: { min: 0, max: 24, step: 0.1, default: 6, group: 'geometry' },
  radialDecay: { min: 0.1, max: 8, step: 0.05, default: 2.4, group: 'material' },
  phase: { min: -6.28, max: 6.28, step: 0.01, default: 0.6, group: 'geometry' },
  waveMix: { min: 0, max: 1, step: 0.01, default: 0.65, group: 'material' },
  noiseStrength: { min: 0, max: 1, step: 0.01, default: 0.22, group: 'material' },
  noiseScale: { min: 0.2, max: 12, step: 0.1, default: 3.2, group: 'material' },
  hueShift: { min: -1, max: 1, step: 0.01, default: 0.1, group: 'color' },
  saturation: { min: 0, max: 2, step: 0.01, default: 1.1, group: 'color' },
  brightness: { min: 0.2, max: 2.5, step: 0.01, default: 1, group: 'color' },
  speed: { min: 0, max: 3, step: 0.01, default: 0.25, group: 'animation' },
  jitter: { min: 0, max: 1, step: 0.01, default: 0.08, group: 'animation' }
}

export const defaultParams = Object.fromEntries(
  Object.entries(schema).map(([k, v]) => [k, v.default])
)

export const clampParams = (params) =>
  Object.fromEntries(
    Object.entries(schema).map(([k, conf]) => {
      const raw = Number(params[k] ?? conf.default)
      const clipped = Number.isFinite(raw) ? Math.min(conf.max, Math.max(conf.min, raw)) : conf.default
      return [k, clipped]
    })
  )
