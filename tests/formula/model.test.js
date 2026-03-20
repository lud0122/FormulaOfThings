import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultParams } from '../../src/formula/params.js'
import { sampleIntensity } from '../../src/formula/model.js'

test('intensity stays in [0,1]', () => {
  const value = sampleIntensity(0.2, -0.3, 0, defaultParams)
  assert.ok(value >= 0 && value <= 1)
})

test('radial frequency changes pattern', () => {
  const a = sampleIntensity(0.4, 0.1, 0, { ...defaultParams, radialFreq: 3 })
  const b = sampleIntensity(0.4, 0.1, 0, { ...defaultParams, radialFreq: 9 })
  assert.notEqual(a, b)
})
