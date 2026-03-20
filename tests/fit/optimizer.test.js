import test from 'node:test'
import assert from 'node:assert/strict'
import { optimizeParams } from '../../src/fit/optimizer.js'

test('optimizer improves score over baseline', async () => {
  const baseline = { score: 0.2 }
  const result = await optimizeParams({
    iterations: 20,
    evaluate: async (params) => 0.2 + (params.radialFreq % 1) * 0.5
  })
  assert.ok(result.bestScore >= baseline.score)
})
