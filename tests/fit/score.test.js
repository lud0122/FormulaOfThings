import test from 'node:test'
import assert from 'node:assert/strict'
import { scoreFeatures } from '../../src/fit/score.js'

test('identical features score best', () => {
  const f = { hist: [1], radialProfile: [1], orientationBins: [1], edgeEnergy: 1 }
  const s0 = scoreFeatures(f, f)
  const s1 = scoreFeatures(f, { ...f, edgeEnergy: 2 })
  assert.ok(s0 > s1)
})
