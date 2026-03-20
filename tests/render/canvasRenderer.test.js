import test from 'node:test'
import assert from 'node:assert/strict'
import { renderToBuffer } from '../../src/render/canvasRenderer.js'

test('renderer returns rgba buffer with expected size', () => {
  const out = renderToBuffer({
    width: 16,
    height: 16,
    t: 0,
    params: {},
    sampleIntensity: () => 0.5,
    toneMap: () => [127, 127, 127, 255]
  })
  assert.equal(out.length, 16 * 16 * 4)
})
