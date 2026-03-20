const l1 = (a, b) => {
  const len = Math.max(a.length, b.length)
  if (len === 0) return 0
  let sum = 0
  for (let i = 0; i < len; i += 1) {
    sum += Math.abs((a[i] ?? 0) - (b[i] ?? 0))
  }
  return sum / len
}

const relDiff = (a, b) => {
  const denom = Math.max(1e-6, Math.abs(a) + Math.abs(b))
  return Math.abs(a - b) / denom
}

export const scoreFeatures = (target, cand) => {
  const wHist = 0.35
  const wRadial = 0.35
  const wOrient = 0.2
  const wEdge = 0.1

  const d =
    wHist * l1(target.hist, cand.hist) +
    wRadial * l1(target.radialProfile, cand.radialProfile) +
    wOrient * l1(target.orientationBins, cand.orientationBins) +
    wEdge * relDiff(target.edgeEnergy, cand.edgeEnergy)

  return Math.max(0, Math.min(1, 1 - d))
}
