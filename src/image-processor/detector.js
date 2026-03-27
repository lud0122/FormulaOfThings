/**
 * 计算灰度直方图
 * @param {ImageData} imageData - Canvas ImageData
 * @returns {number[]} 长度为256的直方图数组
 */
export function calculateHistogram(imageData) {
  const hist = new Array(256).fill(0)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    hist[gray]++
  }

  return hist
}

/**
 * 在直方图中寻找峰值
 * @param {number[]} hist - 直方图数组
 * @param {number} minValue - 忽略低于此值的bin
 * @returns {number[]} 峰值索引数组
 */
export function findPeaks(hist, minValue = 50) {
  const peaks = []
  const n = hist.length

  // 检查边界点
  if (hist[0] > minValue && hist[0] > hist[1]) {
    peaks.push(0)
  }

  // 检查中间点
  for (let i = 1; i < n - 1; i++) {
    if (hist[i] > minValue && hist[i] > hist[i - 1] && hist[i] > hist[i + 1]) {
      if (!peaks.includes(i)) {
        peaks.push(i)
      }
    }
  }

  // 检查右边界点
  if (hist[n - 1] > minValue && hist[n - 1] > hist[n - 2]) {
    if (!peaks.includes(n - 1)) {
      peaks.push(n - 1)
    }
  }

  return peaks.sort((a, b) => hist[b] - hist[a])
}

/**
 * 检测图像类型（轮廓图或复杂图）
 * @param {ImageData} imageData - Canvas ImageData
 * @returns {{type: 'contour'|'complex', confidence: number}}
 */
export function detectImageType(imageData) {
  const hist = calculateHistogram(imageData)
  const peaks = findPeaks(hist)
  const totalPixels = imageData.width * imageData.height

  // 统计黑白像素占比
  let blackCount = 0
  let whiteCount = 0
  for (let i = 0; i < 64; i++) blackCount += hist[i]
  for (let i = 192; i < 256; i++) whiteCount += hist[i]

  const blackRatio = blackCount / totalPixels
  const whiteRatio = whiteCount / totalPixels
  const bwRatio = blackRatio + whiteRatio

  // 判断是否为轮廓图
  const isBimodal = peaks.length >= 2
  const isMostlyBW = bwRatio > 0.7

  // 计算置信度：基于双峰位置和黑白像素比例
  let confidence = 0
  if (isBimodal && isMostlyBW) {
    // 双峰位置（距离边界0和255越近越好，即dist越小越好）
    const peak1Dist = Math.min(peaks[0], 255 - peaks[0])
    const peak2Dist = Math.min(peaks[1], 255 - peaks[1])
    // 使用指数的倒数来让接近边界的峰值获得高分
    const maxDist = Math.max(peak1Dist, peak2Dist)
    const peakScore = (1 - maxDist / 255)
    confidence = peakScore * bwRatio
  }

  return {
    type: isBimodal && isMostlyBW ? 'contour' : 'complex',
    confidence
  }
}

/**
 * 计算置信度
 * @param {number[]} hist - 直方图
 * @param {number[]} peaks - 峰值
 * @returns {number}
 */
function calculateConfidence(hist, peaks) {
  if (peaks.length < 2) return 0
  const maxVal = Math.max(...hist)
  return peaks.slice(0, 2).reduce((sum, p) => sum + hist[p], 0) / maxVal / 2
}
