import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  complex,
  add,
  sub,
  mul,
  magnitude,
  phase,
  pointsToComplex,
  complexToPoints,
  dft,
  idft,
  magnitudeSpectrum,
  phaseSpectrum,
  getSortedCoefficients,
  calculateEnergyRatio,
  analyzeSymmetry
} from '../../src/fourier-analyzer/dft.js'

describe('dft', () => {
  describe('complex arithmetic', () => {
    it('should create complex number', () => {
      const z = complex(3, 4)
      assert.strictEqual(z.re, 3)
      assert.strictEqual(z.im, 4)
    })

    it('should add two complex numbers', () => {
      const result = add(complex(1, 2), complex(3, 4))
      assert.strictEqual(result.re, 4)
      assert.strictEqual(result.im, 6)
    })

    it('should subtract two complex numbers', () => {
      const result = sub(complex(5, 7), complex(3, 4))
      assert.strictEqual(result.re, 2)
      assert.strictEqual(result.im, 3)
    })

    it('should multiply two complex numbers', () => {
      const result = mul(complex(1, 2), complex(3, 4))
      // (1+2i)(3+4i) = 3 + 4i + 6i + 8i² = 3 + 10i - 8 = -5 + 10i
      assert.strictEqual(result.re, -5)
      assert.strictEqual(result.im, 10)
    })

    it('should calculate magnitude', () => {
      assert.strictEqual(magnitude(complex(3, 4)), 5)
    })

    it('should calculate phase', () => {
      const p = phase(complex(1, 1))
      assert.ok(Math.abs(p - Math.PI / 4) < 1e-10)
    })
  })

  describe('points conversion', () => {
    it('should convert points to complex', () => {
      const points = [{ x: 1, y: 2 }, { x: 3, y: 4 }]
      const complexPoints = pointsToComplex(points)
      assert.strictEqual(complexPoints.length, 2)
      assert.strictEqual(complexPoints[0].re, 1)
      assert.strictEqual(complexPoints[0].im, -2) // y flipped
    })

    it('should convert complex to points', () => {
      const complexPoints = [complex(1, -2), complex(3, -4)]
      const points = complexToPoints(complexPoints)
      assert.strictEqual(points.length, 2)
      assert.strictEqual(points[0].x, 1)
      assert.strictEqual(points[0].y, 2) // y flipped back
    })
  })

  describe('dft and idft', () => {
    it('should compute DFT of simple signal', () => {
      const signal = [complex(1, 0), complex(-1, 0)]
      const coeffs = dft(signal)
      assert.strictEqual(coeffs.length, 2)
      // DC component should be near 0
      assert.ok(Math.abs(coeffs[0].re) < 0.01)
    })

    it('should round-trip with IDFT', () => {
      const original = [
        complex(1, 0),
        complex(2, 0),
        complex(3, 0),
        complex(4, 0)
      ]
      const coeffs = dft(original)
      const reconstructed = idft(coeffs)

      assert.strictEqual(reconstructed.length, 4)
      for (let i = 0; i < 4; i++) {
        assert.ok(Math.abs(reconstructed[i].re - original[i].re) < 1e-10)
        assert.ok(Math.abs(reconstructed[i].im - original[i].im) < 1e-10)
      }
    })

    it('should handle constant signal', () => {
      const signal = Array(8).fill(complex(5, 0))
      const coeffs = dft(signal)
      // DC component should be 5
      assert.ok(Math.abs(coeffs[0].re - 5) < 1e-10)
    })
  })

  describe('spectra', () => {
    it('should compute magnitude spectrum', () => {
      const coeffs = [complex(3, 4), complex(0, 0)]
      const spectrum = magnitudeSpectrum(coeffs)
      assert.strictEqual(spectrum.length, 2)
      assert.strictEqual(spectrum[0], 5)
    })

    it('should compute phase spectrum', () => {
      const coeffs = [complex(1, 0), complex(1, 1)]
      const spectrum = phaseSpectrum(coeffs)
      assert.strictEqual(spectrum.length, 2)
      assert.strictEqual(spectrum[0], 0)
    })
  })

  describe('getSortedCoefficients', () => {
    it('should sort coefficients by magnitude', () => {
      const coeffs = [complex(1, 0), complex(3, 4), complex(0, 0)]
      const sorted = getSortedCoefficients(coeffs)
      assert.strictEqual(sorted[0].index, 1) // magnitude 5
      assert.strictEqual(sorted[sorted.length - 1].index, 2) // magnitude 0
    })
  })

  describe('calculateEnergyRatio', () => {
    it('should calculate energy ratio correctly', () => {
      const coeffs = [
        complex(3, 0),
        complex(4, 0),
        complex(0, 0)
      ]
      // Total energy: 9 + 16 = 25
      // Top 1 energy: 16
      const ratio = calculateEnergyRatio(coeffs, 1)
      assert.ok(Math.abs(ratio - 16 / 25) < 1e-10)
    })

    it('should handle all zero coefficients', () => {
      const coeffs = [complex(0, 0), complex(0, 0)]
      const ratio = calculateEnergyRatio(coeffs, 1)
      assert.strictEqual(ratio, 0)
    })
  })

  describe('analyzeSymmetry', () => {
    it('should detect symmetry in real signal', () => {
      // Real signal has conjugate symmetry
      const N = 8
      const signal = []
      for (let i = 0; i < N; i++) {
        signal.push(complex(Math.cos(2 * Math.PI * i / N), 0))
      }
      const coeffs = dft(signal)
      const result = analyzeSymmetry(coeffs)
      // Real signal should have high symmetry
      assert.ok(result.symmetryScore > 0)
    })

    it('should handle short signals', () => {
      const result = analyzeSymmetry([complex(1, 0)])
      assert.strictEqual(result.hasSymmetry, false)
    })
  })
})
