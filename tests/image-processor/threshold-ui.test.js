import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  thresholdSchema,
  clampThreshold,
  validateThresholds,
  suggestThresholds,
  applyThresholds
} from '../../src/image-processor/threshold-ui.js'

describe('threshold-ui', () => {
  describe('thresholdSchema', () => {
    it('should define lowThreshold config', () => {
      assert.strictEqual(thresholdSchema.lowThreshold.min, 0)
      assert.strictEqual(thresholdSchema.lowThreshold.max, 255)
      assert.strictEqual(thresholdSchema.lowThreshold.default, 50)
    })

    it('should define highThreshold config', () => {
      assert.strictEqual(thresholdSchema.highThreshold.min, 0)
      assert.strictEqual(thresholdSchema.highThreshold.max, 255)
      assert.strictEqual(thresholdSchema.highThreshold.default, 150)
    })
  })

  describe('clampThreshold', () => {
    it('should clamp value within range', () => {
      assert.strictEqual(clampThreshold(100, 'lowThreshold'), 100)
    })

    it('should clamp value below minimum', () => {
      assert.strictEqual(clampThreshold(-10, 'lowThreshold'), 0)
    })

    it('should clamp value above maximum', () => {
      assert.strictEqual(clampThreshold(300, 'lowThreshold'), 255)
    })

    it('should handle float values', () => {
      assert.strictEqual(clampThreshold(50.7, 'lowThreshold'), 51)
    })
  })

  describe('validateThresholds', () => {
    it('should return valid thresholds', () => {
      const result = validateThresholds({ lowThreshold: 50, highThreshold: 150 })
      assert.strictEqual(result.lowThreshold, 50)
      assert.strictEqual(result.highThreshold, 150)
    })

    it('should ensure low <= high when low > high', () => {
      const result = validateThresholds({ lowThreshold: 200, highThreshold: 100 })
      assert.ok(result.lowThreshold <= result.highThreshold)
    })

    it('should clamp thresholds to valid range', () => {
      const result = validateThresholds({ lowThreshold: -50, highThreshold: 400 })
      assert.strictEqual(result.lowThreshold, 0)
      assert.strictEqual(result.highThreshold, 255)
    })
  })

  describe('suggestThresholds', () => {
    it('should return suggested thresholds based on histogram', () => {
      // 创建一个测试图像（灰度图）
      const width = 10
      const height = 10
      const data = new Uint8ClampedArray(width * height)

      // 填充一些示例数据
      for (let i = 0; i < data.length; i++) {
        data[i] = (i % 256)
      }

      const image = { width, height, data }
      const result = suggestThresholds(image)

      assert.ok(result.lowThreshold >= 0)
      assert.ok(result.highThreshold <= 255)
      assert.ok(result.lowThreshold <= result.highThreshold)
    })

    it('should handle uniform image', () => {
      const width = 10
      const height = 10
      const data = new Uint8ClampedArray(width * height).fill(128)

      const image = { width, height, data }
      const result = suggestThresholds(image)

      assert.ok(Number.isFinite(result.lowThreshold))
      assert.ok(Number.isFinite(result.highThreshold))
    })
  })

  describe('applyThresholds', () => {
    it('should apply and validate thresholds', () => {
      const result = applyThresholds(60, 180)
      assert.strictEqual(result.lowThreshold, 60)
      assert.strictEqual(result.highThreshold, 180)
    })

    it('should fix invalid threshold order', () => {
      const result = applyThresholds(200, 100)
      assert.ok(result.lowThreshold <= result.highThreshold)
    })
  })
})
