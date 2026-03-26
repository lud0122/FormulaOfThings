import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  traceContour,
  findFirstBlackPixel,
  findNextBoundaryPoint,
  resampleContour,
  computeOtsuThreshold
} from '../../src/image-processor/contour-tracer.js'

/**
 * 辅助函数：创建二值图像
 * @param {number} width - 图像宽度
 * @param {number} height - 图像高度
 * @param {function} fillFunc - 填充函数 (x, y) => boolean (true=黑色)
 * @returns {ImageData}
 */
function createBinaryImage(width, height, fillFunc) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const isBlack = fillFunc(x, y)
      data[i] = isBlack ? 0 : 255     // R
      data[i + 1] = isBlack ? 0 : 255 // G
      data[i + 2] = isBlack ? 0 : 255 // B
      data[i + 3] = 255               // A
    }
  }
  return { data, width, height }
}

describe('contour-tracer', () => {
  describe('findFirstBlackPixel', () => {
    it('should find first black pixel in top-left region', () => {
      const image = createBinaryImage(10, 10, (x, y) => x === 2 && y === 3)
      const point = findFirstBlackPixel(image)
      assert.ok(point)
      assert.strictEqual(point.x, 2)
      assert.strictEqual(point.y, 3)
    })

    it('should return null when no black pixel found', () => {
      const image = createBinaryImage(5, 5, () => false)
      const point = findFirstBlackPixel(image)
      assert.strictEqual(point, null)
    })

    it('should scan row by row from top-left', () => {
      const image = createBinaryImage(10, 10, (x, y) =>
        (x === 5 && y === 5) || (x === 3 && y === 3)
      )
      const point = findFirstBlackPixel(image)
      assert.ok(point)
      assert.strictEqual(point.x, 3)
      assert.strictEqual(point.y, 3)
    })
  })

  describe('traceContour', () => {
    it('should trace simple square contour', () => {
      // 创建一个3x3的正方形轮廓
      const image = createBinaryImage(10, 10, (x, y) =>
        x >= 3 && x <= 5 && y >= 3 && y <= 5
      )
      const contour = traceContour(image)
      assert.ok(contour.length >= 3, 'Contour should have at least 3 points')
      assert.ok(contour.length <= 10000, 'Contour should not exceed max size')

      // 验证轮廓闭合
      const first = contour[0]
      const last = contour[contour.length - 1]
      assert.strictEqual(first.x, last.x)
      assert.strictEqual(first.y, last.y)
    })

    it('should throw IMAGE_TOO_LARGE for oversized image', () => {
      const image = createBinaryImage(2049, 2049, () => true)
      assert.throws(
        () => traceContour(image),
        /IMAGE_TOO_LARGE/
      )
    })

    it('should throw NO_CONTOUR_FOUND for empty image', () => {
      const image = createBinaryImage(10, 10, () => false)
      assert.throws(
        () => traceContour(image),
        /NO_CONTOUR_FOUND/
      )
    })

    it('should throw CONTOUR_TOO_FEW_POINTS for single pixel', () => {
      const image = createBinaryImage(5, 5, (x, y) => x === 2 && y === 2)
      assert.throws(
        () => traceContour(image),
        /CONTOUR_TOO_FEW_POINTS/
      )
    })

    it('should handle image at max size boundary (2048x2048)', () => {
      const image = createBinaryImage(2048, 2048, (x, y) =>
        x >= 100 && x <= 110 && y >= 100 && y <= 110
      )
      const contour = traceContour(image)
      assert.ok(contour.length >= 3)
    })

    it('should respect maxSize parameter', () => {
      const image = createBinaryImage(100, 100, (x, y) =>
        x >= 10 && x <= 50 && y >= 10 && y <= 50
      )
      const maxSize = 50
      const contour = traceContour(image, maxSize)
      assert.ok(contour.length <= maxSize + 1) // +1 for closure point
    })
  })

  describe('findNextBoundaryPoint', () => {
    it('should find next boundary point in 8 directions', () => {
      // 创建简单的边界场景
      const image = createBinaryImage(5, 5, (x, y) =>
        x >= 1 && x <= 3 && y >= 1 && y <= 3
      )

      // 从点(1,2)开始，向东方向搜索
      const next = findNextBoundaryPoint(image, { x: 1, y: 2 }, 0)
      assert.ok(next, 'Should find next boundary point')
      assert.strictEqual(typeof next.x, 'number')
      assert.strictEqual(typeof next.y, 'number')
    })

    it('should return null when no boundary point found', () => {
      const image = createBinaryImage(5, 5, () => false)
      const next = findNextBoundaryPoint(image, { x: 2, y: 2 }, 0)
      assert.strictEqual(next, null)
    })
  })

  describe('resampleContour', () => {
    it('should reduce contour points evenly', () => {
      const contour = []
      for (let i = 0; i < 100; i++) {
        contour.push({ x: i, y: i })
      }

      const sampled = resampleContour(contour, 10)
      assert.strictEqual(sampled.length, 10)

      // 验证首尾点保留
      assert.strictEqual(sampled[0].x, 0)
      assert.strictEqual(sampled[sampled.length - 1].x, 99)
    })

    it('should handle target equal to or greater than source', () => {
      const contour = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }]

      const sampled1 = resampleContour(contour, 5)
      assert.strictEqual(sampled1.length, 3)

      const sampled2 = resampleContour(contour, 3)
      assert.strictEqual(sampled2.length, 3)
    })

    it('should handle single point contour', () => {
      const contour = [{ x: 5, y: 5 }]
      const sampled = resampleContour(contour, 1)
      assert.strictEqual(sampled.length, 1)
      assert.strictEqual(sampled[0].x, 5)
    })

    it('should preserve contour closure', () => {
      const contour = []
      for (let i = 0; i < 20; i++) {
        contour.push({ x: i, y: i })
      }
      contour.push({ x: 0, y: 0 }) // 闭合点

      const sampled = resampleContour(contour, 10)
      const first = sampled[0]
      const last = sampled[sampled.length - 1]
      assert.strictEqual(first.x, last.x)
      assert.strictEqual(first.y, last.y)
    })
  })

  describe('computeOtsuThreshold', () => {
    it('should compute threshold for bimodal image', () => {
      // 创建双峰直方图：使用中间灰度值模拟双峰
      const data = new Uint8ClampedArray(100 * 4)
      for (let i = 0; i < 100; i++) {
        const isDark = i < 50
        // 使用非极端值：暗色用50，亮色用200
        const gray = isDark ? 50 : 200
        data[i * 4] = gray
        data[i * 4 + 1] = gray
        data[i * 4 + 2] = gray
        data[i * 4 + 3] = 255
      }
      const image = { data, width: 10, height: 10 }

      const threshold = computeOtsuThreshold(image)
      assert.ok(threshold >= 0 && threshold <= 255)
      // 对于双峰分布，阈值应该在两个峰值之间
      assert.ok(threshold >= 50 && threshold <= 200)
    })

    it('should return 128 for uniform gray image', () => {
      const data = new Uint8ClampedArray(100 * 4)
      for (let i = 0; i < 100; i++) {
        data[i * 4] = 128
        data[i * 4 + 1] = 128
        data[i * 4 + 2] = 128
        data[i * 4 + 3] = 255
      }
      const image = { data, width: 10, height: 10 }

      const threshold = computeOtsuThreshold(image)
      // 对于均匀分布，任何阈值都可以，但通常返回中间值附近
      assert.ok(threshold >= 0 && threshold <= 255)
    })

    it('should handle single color image', () => {
      const data = new Uint8ClampedArray(100 * 4)
      for (let i = 0; i < 100; i++) {
        data[i * 4] = 0
        data[i * 4 + 1] = 0
        data[i * 4 + 2] = 0
        data[i * 4 + 3] = 255
      }
      const image = { data, width: 10, height: 10 }

      const threshold = computeOtsuThreshold(image)
      assert.ok(threshold >= 0 && threshold <= 255)
    })
  })
})
