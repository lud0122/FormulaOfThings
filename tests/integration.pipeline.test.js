import test from 'node:test'
import assert from 'node:assert/strict'
import { runPipelineOnce } from '../src/app/main.js'

test('pipeline returns best params and frame stats', async () => {
  const referenceFeatures = {
    hist: Array.from({ length: 16 }, () => 1 / 16),
    radialProfile: Array.from({ length: 32 }, () => 0.5),
    orientationBins: Array.from({ length: 8 }, () => 1 / 8),
    edgeEnergy: 0.2
  }
  const result = await runPipelineOnce({ iterations: 1, width: 32, height: 32, referenceFeatures })
  assert.ok(result.bestParams)
  assert.ok(result.bestScore >= 0)
})
