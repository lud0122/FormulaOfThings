import test from 'node:test'
import assert from 'node:assert/strict'
import { extractFeaturesFromGray } from '../../src/fit/extractFeatures.js'

test('extractFeaturesFromGray returns stable feature vector', () => {
  const gray = new Float32Array([0, 0.5, 1, 0.5])
  const out = extractFeaturesFromGray(gray, 2, 2)
  assert.equal(Array.isArray(out.hist), true)
  assert.equal(out.hist.length, 16)
  assert.ok(out.edgeEnergy >= 0)
})
