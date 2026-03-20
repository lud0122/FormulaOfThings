import test from 'node:test'
import assert from 'node:assert/strict'
import { clampBySchema } from '../../src/ui/controlPanel.js'

test('clampBySchema keeps param in allowed range', () => {
  const schema = { radialFreq: { min: 1, max: 20 } }
  assert.equal(clampBySchema(schema, 'radialFreq', 99), 20)
})
