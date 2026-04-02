/**
 * 离散傅里叶变换（DFT）实现 - 实数信号的正弦余弦展开
 */

/**
 * 创建复数
 * @param {number} re - 实部
 * @param {number} im - 虚部
 * @returns {{re: number, im: number}}
 */
export function complex(re = 0, im = 0) {
  return { re, im };
}

/**
 * 对实数信号做离散傅里叶变换
 * 返回正弦余弦展开系数 {a, b}
 * 展开式: f(t) = Σ [a_k*cos(k*t) + b_k*sin(k*t)]
 * 其中: a_k = (2/N) * Σ f[n]*cos(2πkn/N)  (k>0), a_0 = (1/N)*Σ f[n]
 *       b_k = (2/N) * Σ f[n]*sin(2πkn/N)
 * 重建: f(t) = a_0/2 + Σ_{k=1}^{N/2} [a_k*cos(k*t) + b_k*sin(k*t)]
 *
 * @param {number[]} signal - 实数信号数组
 * @returns {{a: number[], b: number[]}} 展开系数
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

    // 非零频率使用 2/N 归一化，零频率使用 1/N
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
 * 使用展开系数重建点位置
 * 公式: f(t) = Σ [a_k*cos(k*t) + b_k*sin(k*t)]
 * @param {number[]} a - 余弦系数
 * @param {number[]} b - 正弦系数 (已包含符号)
 * @param {number[]} c - y的余弦系数
 * @param {number[]} d - y的正弦系数
 * @param {number} t - 时间参数
 * @returns {{x: number, y: number}} 重建坐标
 */
export function reconstructPoint(a, b, c, d, t) {
  const N = a.length
  let x = 0, y = 0

  // DC分量 (k=0) 和 Nyquist (k=N/2) 只有余弦
  x += a[0] / 2  // DC分量
  y += c[0] / 2

  for (let k = 1; k < N; k++) {
    const cos_kt = Math.cos(k * t)
    const sin_kt = Math.sin(k * t)
    x += a[k] * cos_kt + b[k] * sin_kt
    y += c[k] * cos_kt + d[k] * sin_kt
  }

  return { x, y }
}

/**
 * 将轮廓点转换为复数序列
 * @param {Array<{x: number, y: number}>} points
 * @returns {Array<{re: number, im: number}>}
 */
export function pointsToComplex(points) {
  return points.map(p => ({ re: p.x, im: -p.y }))  // y轴翻转
}

/**
 * 复数数组转换回点
 * @param {Array<{re: number, im: number}>} complex
 * @returns {Array<{x: number, y: number}>}
 */
export function complexToPoints(complex) {
  return complex.map(c => ({ x: c.re, y: -c.im }))  // y轴翻转回来
}

/**
 * 复数加法
 */
export function add(a, b) {
  return { re: a.re + b.re, im: a.im + b.im }
}

/**
 * 复数乘法
 */
export function mul(a, b) {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  }
}

/**
 * 逆离散傅里叶变换（IDFT）
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
 * 标准复数DFT
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
 * 复数减法
 * @param {{re: number, im: number}} a
 * @param {{re: number, im: number}} b
 * @returns {{re: number, im: number}}
 */
export function sub(a, b) {
  return { re: a.re - b.re, im: a.im - b.im };
}

/**
 * 复数的模
 * @param {{re: number, im: number}} z
 * @returns {number}
 */
export function magnitude(z) {
  return Math.sqrt(z.re * z.re + z.im * z.im);
}

/**
 * 复数的相位
 * @param {{re: number, im: number}} z
 * @returns {number}
 */
export function phase(z) {
  return Math.atan2(z.im, z.re);
}

/**
 * 幅度谱
 */
export function magnitudeSpectrum(coefficients) {
  return coefficients.map(c =>
    Math.sqrt(c.re * c.re + c.im * c.im)
  )
}

/**
 * 相位谱
 */
export function phaseSpectrum(coefficients) {
  return coefficients.map(c => Math.atan2(c.im, c.re))
}

/**
 * 获取按幅度排序的系数
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
 * 计算能量占比
 */
export function calculateEnergyRatio(coefficients, n) {
  const sorted = getSortedCoefficients(coefficients)
  const totalEnergy = sorted.reduce((sum, c) => sum + c.magnitude * c.magnitude, 0)
  if (totalEnergy === 0) return 0
  const topNEnergy = sorted.slice(0, n).reduce((sum, c) => sum + c.magnitude * c.magnitude, 0)
  return topNEnergy / totalEnergy
}

/**
 * 分析对称性
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
 * 使用指定数量系数重建轮廓
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
