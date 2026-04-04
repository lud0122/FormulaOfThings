/**
 * Discrete Fourier Transform (DFT) implementation - Real signal sine-cosine expansion
 */

/**
 * Create a complex number
 * @param {number} re - Real part
 * @param {number} im - Imaginary part
 * @returns {{re: number, im: number}}
 */
export function complex(re = 0, im = 0) {
  return { re, im };
}

/**
 * Perform DFT on real signal
 * Returns sine-cosine expansion coefficients {a, b}
 * Expansion: f(t) = Σ [a_k*cos(k*t) + b_k*sin(k*t)]
 * Where: a_k = (2/N) * Σ f[n]*cos(2πkn/N) (k>0), a_0 = (1/N)*Σ f[n]
 * b_k = (2/N) * Σ f[n]*sin(2πkn/N)
 * Reconstruction: f(t) = a_0/2 + Σ_{k=1}^{N/2} [a_k*cos(k*t) + b_k*sin(k*t)]
 *
 * @param {number[]} signal - Real signal array
 * @returns {{a: number[], b: number[]}} Expansion coefficients
 */
export function realDft(signal) {
  const N = signal.length
  if (N === 0) return { a: [], b: [] }

  const a = new Array(N).fill(0)
  const b = new Array(N).fill(0)

  for (let k = 0; k < N; k++) {
    let sumCos = 0
    let sumSin = 0
    for (let n = 0; n < N; n++) {
      const angle = 2 * Math.PI * k * n / N
      sumCos += signal[n] * Math.cos(angle)
      sumSin += signal[n] * Math.sin(angle)
    }

    // Non-zero frequencies use 2/N normalization, zero frequency uses 1/N
    if (k === 0 || (N % 2 === 0 && k === N / 2)) {
      a[k] = sumCos / N
    } else {
      a[k] = (2 * sumCos) / N
    }
    b[k] = (2 * sumSin) / N
  }

  return { a, b }
}

/**
 * Reconstruct point position using expansion coefficients
 * Formula: f(t) = Σ [a_k*cos(k*t) + b_k*sin(k*t)]
 * @param {number[]} a - Cosine coefficients
 * @param {number[]} b - Sine coefficients (includes sign)
 * @param {number[]} c - Cosine coefficients for y
 * @param {number[]} d - Sine coefficients for y
 * @param {number} t - Time parameter
 * @returns {{x: number, y: number}} Reconstructed coordinates
 */
export function reconstructPoint(a, b, c, d, t) {
  const N = a.length
  let x = 0, y = 0

  // DC component (k=0) and Nyquist (k=N/2) only have cosine
  // For realDft output with 1/N for DC and 2/N for others, divide DC by 2
  x += a[0] / 2
  y += c[0] / 2

  // Sum for k=1 to N-1 using symmetry property for real signals
  for (let k = 1; k < N; k++) {
    const cos_kt = Math.cos(k * t)
    const sin_kt = Math.sin(k * t)
    x += a[k] * cos_kt + b[k] * sin_kt
    y += c[k] * cos_kt + d[k] * sin_kt
  }

  return { x, y }
}

/**
 * Convert contour points to complex sequence
 * @param {Array<{x: number, y: number}>} points
 * @returns {Array<{re: number, im: number}>}
 */
export function pointsToComplex(points) {
  return points.map(p => ({ re: p.x, im: -p.y })) // Y-axis flip
}

/**
 * Convert complex array back to points
 * @param {Array<{re: number, im: number}>} complex
 * @returns {Array<{x: number, y: number}>}
 */
export function complexToPoints(complex) {
  return complex.map(c => ({ x: c.re, y: -c.im })) // Y-axis flip back
}

/**
 * Complex addition
 */
export function add(a, b) {
  return { re: a.re + b.re, im: a.im + b.im }
}

/**
 * Complex multiplication
 */
export function mul(a, b) {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  }
}

/**
 * Inverse Discrete Fourier Transform (IDFT)
 * @param {Array<{re: number, im: number}>} coefficients
 * @returns {Array<{re: number, im: number}>}
 */
export function idft(coefficients) {
  const N = coefficients.length;
  const signal = new Array(N);

  for (let n = 0; n < N; n++) {
    let sum = { re: 0, im: 0 };
    for (let k = 0; k < N; k++) {
      const angle = 2 * Math.PI * k * n / N;
      const twiddle = { re: Math.cos(angle), im: Math.sin(angle) };
      sum = add(sum, mul(coefficients[k], twiddle));
    }
    signal[n] = sum;
  }

  return signal;
}

/**
 * Standard complex DFT
 */
export function dft(signal) {
  const N = signal.length
  const coeffs = new Array(N)

  for (let k = 0; k < N; k++) {
    let sum = { re: 0, im: 0 }
    for (let n = 0; n < N; n++) {
      const angle = -2 * Math.PI * k * n / N
      const twiddle = { re: Math.cos(angle), im: Math.sin(angle) }
      sum = add(sum, mul(signal[n], twiddle))
    }
    coeffs[k] = { re: sum.re / N, im: sum.im / N }
  }

  return coeffs
}

/**
 * Complex subtraction
 * @param {{re: number, im: number}} a
 * @param {{re: number, im: number}} b
 * @returns {{re: number, im: number}}
 */
export function sub(a, b) {
  return { re: a.re - b.re, im: a.im - b.im };
}

/**
 * Complex magnitude
 * @param {{re: number, im: number}} z
 * @returns {number}
 */
export function magnitude(z) {
  return Math.sqrt(z.re * z.re + z.im * z.im);
}

/**
 * Complex phase
 * @param {{re: number, im: number}} z
 * @returns {number}
 */
export function phase(z) {
  return Math.atan2(z.im, z.re);
}

/**
 * Magnitude spectrum
 */
export function magnitudeSpectrum(coefficients) {
  return coefficients.map(c =>
    Math.sqrt(c.re * c.re + c.im * c.im)
  )
}

/**
 * Phase spectrum
 */
export function phaseSpectrum(coefficients) {
  return coefficients.map(c => Math.atan2(c.im, c.re))
}

/**
 * Get coefficients sorted by magnitude
 */
export function getSortedCoefficients(coefficients) {
  return coefficients
    .map((c, index) => ({
      index,
      magnitude: Math.sqrt(c.re * c.re + c.im * c.im)
    }))
    .sort((a, b) => b.magnitude - a.magnitude)
}

/**
 * Calculate energy ratio
 */
export function calculateEnergyRatio(coefficients, n) {
  const sorted = getSortedCoefficients(coefficients)
  const totalEnergy = sorted.reduce((sum, c) => sum + c.magnitude * c.magnitude, 0)
  if (totalEnergy === 0) return 0
  const topNEnergy = sorted.slice(0, n).reduce((sum, c) => sum + c.magnitude * c.magnitude, 0)
  return topNEnergy / totalEnergy
}

/**
 * Analyze symmetry
 */
export function analyzeSymmetry(coefficients) {
  const N = coefficients.length
  if (N < 2) return { hasSymmetry: false, symmetryScore: 0 }

  let symmetryMatches = 0
  const half = Math.floor(N / 2)

  for (let k = 1; k < half; k++) {
    const negK = N - k
    const forward = coefficients[k]
    const backward = coefficients[negK]
    const reDiff = Math.abs(forward.re - backward.re)
    const imDiff = Math.abs(forward.im + backward.im)
    if (reDiff < 1e-6 && imDiff < 1e-6) symmetryMatches++
  }

  return {
    hasSymmetry: symmetryMatches / (half - 1) > 0.9,
    symmetryScore: symmetryMatches / (half - 1)
  }
}

/**
 * Reconstruct contour using specified number of coefficients
 */
export function reconstructWithTerms(coefficients, termCount, sampleCount = 200) {
  const N = coefficients.length
  const usedTerms = Math.min(termCount, N)
  const sorted = getSortedCoefficients(coefficients)
  const selectedIndices = new Set(sorted.slice(0, usedTerms).map(c => c.index))
  const truncated = coefficients.map((c, i) => selectedIndices.has(i) ? c : { re: 0, im: 0 })

  const reconstructed = []
  for (let t = 0; t < sampleCount; t++) {
    const angle = 2 * Math.PI * t / sampleCount
    let sum = { re: 0, im: 0 }
    for (let k = 0; k < N; k++) {
      const phase = angle * k
      const twiddle = { re: Math.cos(phase), im: Math.sin(phase) }
      sum = add(sum, mul(truncated[k], twiddle))
    }
    reconstructed.push(sum)
  }

  return complexToPoints(reconstructed)
}
