export const extractFeaturesFromGray = (gray, width, height) => {
  const total = width * height
  const histBins = 16
  const hist = Array.from({ length: histBins }, () => 0)

  for (let i = 0; i < total; i += 1) {
    const v = Math.max(0, Math.min(1, gray[i]))
    const bin = Math.min(histBins - 1, Math.floor(v * histBins))
    hist[bin] += 1
  }

  for (let i = 0; i < hist.length; i += 1) hist[i] /= total

  const radialBins = 32
  const radialSum = Array.from({ length: radialBins }, () => 0)
  const radialCount = Array.from({ length: radialBins }, () => 0)
  const orientBins = Array.from({ length: 8 }, () => 0)

  let edgeEnergy = 0
  const cx = (width - 1) / 2
  const cy = (height - 1) / 2
  const maxR = Math.sqrt(cx * cx + cy * cy) || 1

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = y * width + x
      const gx = gray[idx + 1] - gray[idx - 1]
      const gy = gray[idx + width] - gray[idx - width]
      const mag = Math.sqrt(gx * gx + gy * gy)
      edgeEnergy += mag

      const angle = Math.atan2(gy, gx)
      const norm = (angle + Math.PI) / (2 * Math.PI)
      const ob = Math.min(7, Math.floor(norm * 8))
      orientBins[ob] += mag

      const dx = x - cx
      const dy = y - cy
      const rb = Math.min(radialBins - 1, Math.floor((Math.sqrt(dx * dx + dy * dy) / maxR) * radialBins))
      radialSum[rb] += gray[idx]
      radialCount[rb] += 1
    }
  }

  const radialProfile = radialSum.map((sum, i) => (radialCount[i] ? sum / radialCount[i] : 0))
  const orientTotal = orientBins.reduce((a, b) => a + b, 0) || 1
  const orientationBins = orientBins.map((v) => v / orientTotal)

  return {
    hist,
    radialProfile,
    orientationBins,
    edgeEnergy: edgeEnergy / total
  }
}
