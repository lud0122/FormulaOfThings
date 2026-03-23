export const formatParametricFormula = (params) => {
  const p = params
  const lines = []

  lines.push('I(x, y, t) = toneMap(intensity, params)')
  lines.push('')
  lines.push('where:')
  lines.push(`  intensity = clamp01((1 - ${p.waveMix.toFixed(2)}) × radialBase + ${p.waveMix.toFixed(2)} × polarWave) × noiseMod`)
  lines.push('')
  lines.push(`  radialBase = exp(-${p.radialDecay.toFixed(2)} × r²)`)
  lines.push(`  polarWave = 0.5 + 0.5 × cos(${p.radialFreq.toFixed(2)} × r + ${p.angularFreq.toFixed(2)} × θ + ${p.phase.toFixed(2)} + t × ${p.speed.toFixed(2)})`)
  lines.push(`  noiseMod = smoothNoise(${p.noiseScale.toFixed(2)} × x + 0.21t, ${p.noiseScale.toFixed(2)} × y - 0.17t, seed)`)
  lines.push(`           × (1 + ${p.jitter.toFixed(2)} × (noiseTerm - 0.5))`)
  lines.push('')
  lines.push('  r = √(x² + y²),  θ = atan2(y, x)')
  lines.push('')
  lines.push('Parameters:')
  lines.push(`  radialDecay=${p.radialDecay.toFixed(3)}, radialFreq=${p.radialFreq.toFixed(2)}`)
  lines.push(`  angularFreq=${p.angularFreq.toFixed(2)}, waveMix=${p.waveMix.toFixed(3)}`)
  lines.push(`  noiseScale=${p.noiseScale.toFixed(2)}, noiseStrength=${p.noiseStrength.toFixed(3)}`)
  lines.push(`  hueShift=${p.hueShift.toFixed(2)}, saturation=${p.saturation.toFixed(2)}`)
  lines.push(`  brightness=${p.brightness.toFixed(2)}, speed=${p.speed.toFixed(3)}`)

  return lines.join('\n')
}

export const renderFormulaToElement = (container, formula) => {
  if (!container) return
  container.textContent = formula
  container.style.fontFamily = 'monospace'
  container.style.fontSize = '12px'
  container.style.lineHeight = '1.6'
  container.style.whiteSpace = 'pre-wrap'
  container.style.background = '#1a1a2e'
  container.style.color = '#eee'
  container.style.padding = '16px'
  container.style.borderRadius = '8px'
  container.style.overflow = 'auto'
  container.style.maxHeight = '400px'
}
