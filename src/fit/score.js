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
  const dHist = l1(target.hist, cand.hist)
  const dRadial = l1(target.radialProfile, cand.radialProfile)
  const dOrient = l1(target.orientationBins, cand.orientationBins)
  const dEdge = relDiff(target.edgeEnergy, cand.edgeEnergy)
  const dGrid = l1(target.coarseGridProfile ?? [], cand.coarseGridProfile ?? [])

  const d = 0.2 * dHist + 0.2 * dRadial + 0.15 * dOrient + 0.15 * dEdge + 0.3 * dGrid

  return Math.max(0, Math.min(1, 1 - d))
}
