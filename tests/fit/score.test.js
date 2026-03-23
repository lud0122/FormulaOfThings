import test from 'node:test'
import assert from 'node:assert/strict'
import { extractFeaturesFromGray } from '../../src/fit/extractFeatures.js'
import { scoreFeatures } from '../../src/fit/score.js'

test('identical features score best', () => {
  const f = { hist: [1], radialProfile: [1], orientationBins: [1], edgeEnergy: 1 }
  const s0 = scoreFeatures(f, f)
  const s1 = scoreFeatures(f, { ...f, edgeEnergy: 2 })
  assert.ok(s0 > s1)
})

test('translated bright blob should have lower similarity than identical', () => {
  const width = 64
  const height = 64
  const makeGray = (centerX, centerY, radius) => {
    const gray = new Float32Array(width * height)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const dx = x - centerX
        const dy = y - centerY
        gray[y * width + x] = Math.sqrt(dx * dx + dy * dy) <= radius ? 1 : 0
      }
    }
    return gray
  }

  const centerBlob = makeGray(32, 32, 14)
  const cornerBlob = makeGray(10, 10, 14)

  const centerFeatures = extractFeaturesFromGray(centerBlob, width, height)
  const cornerFeatures = extractFeaturesFromGray(cornerBlob, width, height)

  const identicalScore = scoreFeatures(centerFeatures, centerFeatures)
  const translatedScore = scoreFeatures(centerFeatures, cornerFeatures)

  assert.equal(identicalScore, 1)
  assert.ok(translatedScore < identicalScore)
  assert.ok(translatedScore < 0.8)
})
