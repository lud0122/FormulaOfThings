/**
 * 离散傅里叶变换（DFT）实现
 * 支持复数运算和轮廓点的傅里叶级数展开
 */

/**
 * 复数表示 { re: 实部, im: 虚部 }
 * @typedef {Object} Complex
 * @property {number} re - 实部
 * @property {number} im - 虚部
 */

/**
 * 创建复数
 * @param {number} re - 实部
 * @param {number} im - 虚部
 * @returns {Complex}
 */
export function complex(re = 0, im = 0) {
  return { re, im }
}

/**
 * 复数加法
 * @param {Complex} a
 * @param {Complex} b
 * @returns {Complex}
 */
export function add(a, b) {
  return { re: a.re + b.re, im: a.im + b.im }
}

/**
 * 复数减法
 * @param {Complex} a
 * @param {Complex} b
 * @returns {Complex}
 */
export function sub(a, b) {
  return { re: a.re - b.re, im: a.im - b.im }
}

/**
 * 复数乘法
 * @param {Complex} a
 * @param {Complex} b
 * @returns {Complex}
 */
export function mul(a, b) {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  }
}

/**
 * 复数的模（幅度）
 * @param {Complex} z
 * @returns {number}
 */
export function magnitude(z) {
  return Math.sqrt(z.re * z.re + z.im * z.im)
}

/**
 * 复数的相位（角度，-π到π）
 * @param {Complex} z
 * @returns {number}
 */
export function phase(z) {
  return Math.atan2(z.im, z.re)
}

/**
 * 将轮廓点转换为复数序列
 * @param {Array<{x: number, y: number}>} points - 轮廓点数组
 * @returns {Complex[]}
 */
export function pointsToComplex(points) {
  return points.map(p => complex(p.x, -p.y)) // y轴翻转，符合图像坐标系
}

/**
 * 离散傅里叶变换（DFT）
 * @param {Complex[]} signal - 输入信号（复数数组）
 * @returns {Complex[]} 频率系数
 */
export function dft(signal) {
  const N = signal.length
  const coefficients = new Array(N)

  for (let k = 0; k < N; k++) {
    let sum = complex(0, 0)
    for (let n = 0; n < N; n++) {
      const angle = -2 * Math.PI * k * n / N
      const twiddle = complex(Math.cos(angle), Math.sin(angle))
      sum = add(sum, mul(signal[n], twiddle))
    }
    coefficients[k] = complex(sum.re / N, sum.im / N)
  }

  return coefficients
}

/**
 * 逆离散傅里叶变换（IDFT）
 * @param {Complex[]} coefficients - 频率系数
 * @returns {Complex[]} 时域信号
 */
export function idft(coefficients) {
  const N = coefficients.length
  const signal = new Array(N)

  for (let n = 0; n < N; n++) {
    let sum = complex(0, 0)
    for (let k = 0; k < N; k++) {
      const angle = 2 * Math.PI * k * n / N
      const twiddle = complex(Math.cos(angle), Math.sin(angle))
      sum = add(sum, mul(coefficients[k], twiddle))
    }
    signal[n] = sum
  }

  return signal
}

/**
 * 将复数转换回点坐标
 * @param {Complex[]} complexPoints
 * @returns {Array<{x: number, y: number}>}
 */
export function complexToPoints(complexPoints) {
  return complexPoints.map(z => ({
    x: z.re,
    y: -z.im // y轴翻转回来
  }))
}

/**
 * 计算傅里叶系数的幅度谱
 * @param {Complex[]} coefficients
 * @returns {number[]}
 */
export function magnitudeSpectrum(coefficients) {
  return coefficients.map(c => magnitude(c))
}

/**
 * 计算傅里叶系数的相位谱
 * @param {Complex[]} coefficients
 * @returns {number[]}
 */
export function phaseSpectrum(coefficients) {
  return coefficients.map(c => phase(c))
}

/**
 * 获取按幅度排序的系数索引（用于自适应选择）
 * @param {Complex[]} coefficients
 * @returns {Array<{index: number, magnitude: number}>}
 */
export function getSortedCoefficients(coefficients) {
  return coefficients
    .map((c, index) => ({ index, magnitude: magnitude(c) }))
    .sort((a, b) => b.magnitude - a.magnitude)
}

/**
 * 计算能量分布（前N个系数的能量占比）
 * @param {Complex[]} coefficients
 * @param {number} n - 前N个系数
 * @returns {number} 能量占比 (0-1)
 */
export function calculateEnergyRatio(coefficients, n) {
  const sorted = getSortedCoefficients(coefficients)
  const totalEnergy = sorted.reduce((sum, c) => sum + c.magnitude * c.magnitude, 0)

  if (totalEnergy === 0) return 0

  const topNEnergy = sorted.slice(0, n).reduce((sum, c) => sum + c.magnitude * c.magnitude, 0)
  return topNEnergy / totalEnergy
}

/**
 * 使用指定数量的系数重建轮廓
 * @param {Complex[]} coefficients - 完整的傅里叶系数
 * @param {number} termCount - 使用的项数
 * @param {number} sampleCount - 重采样点数
 * @returns {Array<{x: number, y: number}>}
 */
export function reconstructWithTerms(coefficients, termCount, sampleCount = 200) {
  const N = coefficients.length
  const usedTerms = Math.min(termCount, N)

  // 按幅度排序并选择前usedTerms个系数
  const sorted = getSortedCoefficients(coefficients)
  const selectedIndices = new Set(sorted.slice(0, usedTerms).map(c => c.index))

  // 保留选中的系数，其他置为0
  const truncated = coefficients.map((c, i) => selectedIndices.has(i) ? c : complex(0, 0))

  // 重建信号
  const reconstructed = []
  for (let t = 0; t < sampleCount; t++) {
    const angle = 2 * Math.PI * t / sampleCount
    let sum = complex(0, 0)
    for (let k = 0; k < N; k++) {
      const phase = angle * k
      const twiddle = complex(Math.cos(phase), Math.sin(phase))
      sum = add(sum, mul(truncated[k], twiddle))
    }
    reconstructed.push(sum)
  }

  return complexToPoints(reconstructed)
}

/**
 * 分析轮廓的对称性
 * @param {Complex[]} coefficients
 * @returns {{hasSymmetry: boolean, symmetryScore: number}}
 */
export function analyzeSymmetry(coefficients) {
  const N = coefficients.length
  if (N < 2) return { hasSymmetry: false, symmetryScore: 0 }

  // 检查共轭对称性（实信号的傅里叶变换性质）
  let symmetryMatches = 0
  const half = Math.floor(N / 2)

  for (let k = 1; k < half; k++) {
    const negK = N - k
    const forward = coefficients[k]
    const backward = coefficients[negK]

    // 检查是否近似共轭对称
    const reDiff = Math.abs(forward.re - backward.re)
    const imDiff = Math.abs(forward.im + backward.im)

    if (reDiff < 1e-6 && imDiff < 1e-6) {
      symmetryMatches++
    }
  }

  const symmetryScore = symmetryMatches / (half - 1)
  return {
    hasSymmetry: symmetryScore > 0.9,
    symmetryScore
  }
}
