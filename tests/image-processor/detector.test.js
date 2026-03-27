import { describe, it } from 'node:test'
import assert from 'node:assert'
import { detectImageType, calculateHistogram, findPeaks } from '../../src/image-processor/detector.js'

describe('detector', () => {
  describe('calculateHistogram', () => {
    it('should calculate histogram for grayscale image', () => {
      const imageData = {
        data: new Uint8ClampedArray([
          0, 0, 0, 255, 128, 128, 128, 255,
          255, 255, 255, 255, 0, 0, 0, 255
        ]),
        width: 2,
        height: 2
      }
      const hist = calculateHistogram(imageData)
      assert.strictEqual(hist[0], 2) // 2 black pixels
      assert.strictEqual(hist[128], 1) // 1 gray pixel
      assert.strictEqual(hist[255], 1) // 1 white pixel
    })
  })

  describe('findPeaks', () => {
    it('should find peaks in bimodal distribution', () => {
      const hist = new Array(256).fill(0)
      hist[0] = 500 // black peak
      hist[128] = 10
      hist[255] = 500 // white peak
      const peaks = findPeaks(hist)
      assert.strictEqual(peaks.length, 2)
      assert.deepStrictEqual(peaks, [0, 255])
    })
  })

  describe('detectImageType', () => {
    it('should detect contour image (bimodal)', () => {
      const imageData = {
        data: new Uint8ClampedArray(400 * 4),
        width: 20,
        height: 20
      }
      // Fill with deterministic black and white pixels for consistent test
      let whiteCount = 0
      let blackCount = 0
      for (let i = 0; i < imageData.data.length; i += 4) {
        const isBlack = (i / 4) % 3 !== 0
        const value = isBlack ? 0 : 255
        imageData.data[i] = value
        imageData.data[i + 1] = value
        imageData.data[i + 2] = value
        imageData.data[i + 3] = 255
        if (isBlack) {
          blackCount++
        } else {
          whiteCount++
        }
      }
      const result = detectImageType(imageData)
      assert.strictEqual(result.type, 'contour')
      assert.ok(result.confidence > 0)
    })

    it('should detect complex image (non-bimodal)', () => {
      const imageData = {
        data: new Uint8ClampedArray(400 * 4),
        width: 20,
        height: 20
      }
      // Fill with various gray values
      for (let i = 0; i < imageData.data.length; i += 4) {
        const gray = Math.floor(Math.random() * 256)
        imageData.data[i] = gray
        imageData.data[i + 1] = gray
        imageData.data[i + 2] = gray
        imageData.data[i + 3] = 255
      }
      const result = detectImageType(imageData)
      assert.strictEqual(result.type, 'complex')
    })
  })
})
