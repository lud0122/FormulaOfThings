/**
 * 边界追踪器 - 从二值图像提取轮廓
 * 使用8方向追踪算法
 */

/**
 * 8方向搜索向量（N, NE, E, SE, S, SW, W, NW）
 * 方向索引: 0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW
 */
const DIRECTIONS = [
  { dx: 0, dy: -1 },  // 0: N (北)
  { dx: 1, dy: -1 },  // 1: NE (东北)
  { dx: 1, dy: 0 },   // 2: E (东)
  { dx: 1, dy: 1 },   // 3: SE (东南)
  { dx: 0, dy: 1 },   // 4: S (南)
  { dx: -1, dy: 1 },  // 5: SW (西南)
  { dx: -1, dy: 0 },  // 6: W (西)
  { dx: -1, dy: -1 }  // 7: NW (西北)
]

/**
 * 检查像素是否为边界像素（至少有一个相邻白色像素的黑色像素）
 * @param {ImageData} image - 二值图像
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @returns {boolean} 是否为边界像素
 */
function isBoundaryPixel(image, x, y) {
  const { width, height, data } = image

  // 检查当前像素是否为黑色
  const i = (y * width + x) * 4
  if (data[i] > 128 || data[i + 1] > 128 || data[i + 2] > 128) {
    return false // 不是黑色像素
  }

  // 检查8个相邻像素，如果有一个是白色，则当前像素是边界像素
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue // 跳过自身

      const nx = x + dx
      const ny = y + dy

      // 边界检查
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
        return true // 图像边缘的黑色像素视为边界
      }

      const ni = (ny * width + nx) * 4
      // 如果相邻像素是白色（背景）
      if (data[ni] > 128 || data[ni + 1] > 128 || data[ni + 2] > 128) {
        return true
      }
    }
  }

  return false // 所有相邻像素都是黑色，说明是内部像素
}

/**
 * 从二值图像提取边界像素（跳过内部填充区域）
 * 关键：只提取有白色邻居的边界像素，避免提取闭合轮廓内部的填充区域
 * @param {ImageData} binaryImage - 二值图像
 * @param {number} sampleStep - 采样步长（每隔N个像素取一个点）
 * @returns {Array<{x: number, y: number}>} 轮廓点数组
 */
export function extractAllBlackPixels(binaryImage, sampleStep = 5) {
  const { width, height, data } = binaryImage
  const points = []

  // 统计黑色像素和边界像素数量
  let blackPixelCount = 0
  let boundaryPixelCount = 0

  for (let i = 0; i < data.length; i += 4) {
    if (data[i] <= 128 && data[i + 1] <= 128 && data[i + 2] <= 128) {
      blackPixelCount++
    }
  }

  // 先收集所有边界像素
  const boundaryPixels = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isBoundaryPixel(binaryImage, x, y)) {
        boundaryPixels.push({ x, y })
        boundaryPixelCount++
      }
    }
  }

  // 根据边界像素数量动态调整步长
  // 目标：提取500-2000个点，既能准确描绘轮廓，又不会过度拟合
  const targetPoints = Math.min(Math.max(boundaryPixelCount * 0.2, 500), 2000)
  const dynamicStep = Math.max(1, Math.floor(boundaryPixelCount / targetPoints))

  console.log(`[extractAllBlackPixels] 黑色像素=${blackPixelCount}, 边界像素=${boundaryPixelCount}, 动态步长=${dynamicStep}, 目标点数=${targetPoints}`)

  // 从边界像素中采样
  for (let i = 0; i < boundaryPixels.length; i += dynamicStep) {
    points.push(boundaryPixels[i])
  }

  console.log(`[extractAllBlackPixels] 实际提取点数=${points.length}`)
  return points
}

/**
 * 寻找第一个黑色像素（从左上角开始扫描）
 * @param {ImageData} image - 二值图像
 * @returns {{x: number, y: number} | null} 第一个黑色像素坐标，如果未找到返回null
 */
export function findFirstBlackPixel(image) {
  const { width, height, data } = image
  
  // 统计黑白像素
  let blackCount = 0, whiteCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < 128) blackCount++;
    else whiteCount++;
  }
  console.log(`[findFirstBlackPixel] 图像尺寸=${width}x${height}, 黑色像素=${blackCount}, 白色像素=${whiteCount}`);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      // 检查是否为黑色像素（RGB都接近0）
      if (data[i] < 128 && data[i + 1] < 128 && data[i + 2] < 128) {
        return { x, y }
      }
    }
  }

  return null
}

/**
 * 检查像素是否为黑色
 * @param {ImageData} image - 图像数据
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @returns {boolean}
 */
function isBlack(image, x, y) {
  const { width, height, data } = image

  // 边界检查
  if (x < 0 || x >= width || y < 0 || y >= height) {
    return false
  }

  const i = (y * width + x) * 4
  return data[i] < 128 && data[i + 1] < 128 && data[i + 2] < 128
}

/**
 * 查找下一个边界点（8方向搜索）
 * @param {ImageData} image - 二值图像
 * @param {{x: number, y: number}} current - 当前点
 * @param {number} startDirection - 起始搜索方向（0-7）
 * @returns {{x: number, y: number} | null} 下一个边界点，如果未找到返回null
 */
export function findNextBoundaryPoint(image, current, startDirection) {
  // 从起始方向开始，顺时针搜索8个方向
  for (let i = 0; i < 8; i++) {
    const dir = (startDirection + i) % 8
    const { dx, dy } = DIRECTIONS[dir]
    const nx = current.x + dx
    const ny = current.y + dy

    // 检查候选点是否为黑色（边界点）
    if (isBlack(image, nx, ny)) {
      return { x: nx, y: ny }
    }
  }

  return null
}

/**
 * 追踪轮廓边界（主算法）
 * @param {ImageData} binaryImage - 二值图像
 * @param {number} maxSize - 最大轮廓点数（默认10000）
 * @returns {Array<{x: number, y: number}>} 轮廓点数组
 * @throws {Error} IMAGE_TOO_LARGE - 图像尺寸超过2048x2048
 * @throws {Error} NO_CONTOUR_FOUND - 未找到黑色像素
 * @throws {Error} CONTOUR_TRACE_FAILED - 边界追踪中断
 * @throws {Error} CONTOUR_TOO_FEW_POINTS - 轮廓点少于3个
 */
export function traceContour(binaryImage, maxSize = 10000) {
  // 输入验证：图像尺寸限制
  if (binaryImage.width > 2048 || binaryImage.height > 2048) {
    throw new Error('IMAGE_TOO_LARGE: 图像尺寸超过2048x2048')
  }

  // 查找起始点
  const startPoint = findFirstBlackPixel(binaryImage)
  if (!startPoint) {
    throw new Error('NO_CONTOUR_FOUND: 未找到黑色像素')
  }

  // 初始化轮廓追踪
  const contour = [startPoint]
  let current = startPoint
  let direction = 0 // 从北方开始搜索
  const maxIterations = binaryImage.width * binaryImage.height
  let iterations = 0

  // 追踪边界
  do {
    const next = findNextBoundaryPoint(binaryImage, current, direction)

    // 如果找不到下一个点
    if (!next) {
      // 如果只有一个点（单像素），抛出CONTOUR_TOO_FEW_POINTS
      if (contour.length === 1) {
        throw new Error('CONTOUR_TOO_FEW_POINTS: 轮廓点少于3个，无法拟合')
      }
      throw new Error('CONTOUR_TRACE_FAILED: 边界追踪中断，无法找到下一点')
    }

    contour.push(next)
    current = next

    // 调整搜索方向：回退5个方向（逆时针转90度）
    direction = (direction + 5) % 8
    iterations++

    // 安全检查：防止无限循环
    if (iterations > maxIterations) {
      console.warn('CONTOUR_TRACE_TIMEOUT: 边界追踪超时，可能未闭合')
      break
    }

    // 点数量限制：避免内存溢出
    if (contour.length > maxSize) {
      console.warn('CONTOUR_TOO_LARGE: 轮廓点过多，自动降采样')
      break
    }

    // 检查是否回到起点（闭合）
  } while (!(current.x === startPoint.x && current.y === startPoint.y))

  // 确保轮廓闭合：如果起点终点不重合，手动连接
  const firstPoint = contour[0]
  const lastPoint = contour[contour.length - 1]
  if (firstPoint.x !== lastPoint.x || firstPoint.y !== lastPoint.y) {
    contour.push({ x: firstPoint.x, y: firstPoint.y })
  }

  // 验证最小点数
  if (contour.length < 3) {
    throw new Error('CONTOUR_TOO_FEW_POINTS: 轮廓点少于3个，无法拟合')
  }

  return contour
}

/**
 * 轮廓降采样（均匀采样）
 * @param {Array<{x: number, y: number}>} contour - 原始轮廓
 * @param {number} targetCount - 目标点数
 * @returns {Array<{x: number, y: number}>} 降采样后的轮廓
 */
export function resampleContour(contour, targetCount) {
  if (!contour || contour.length === 0) {
    return []
  }

  // 如果目标数大于等于原轮廓点数，返回原轮廓
  if (targetCount >= contour.length) {
    return [...contour]
  }

  // 单点轮廓特殊处理
  if (contour.length === 1) {
    return [{ ...contour[0] }]
  }

  const sampled = []
  const step = (contour.length - 1) / (targetCount - 1)

  for (let i = 0; i < targetCount; i++) {
    const index = Math.min(Math.round(i * step), contour.length - 1)
    sampled.push({ x: contour[index].x, y: contour[index].y })
  }

  return sampled
}

/**
 * Otsu自动阈值计算（类间方差最大化）
 * @param {ImageData} image - 灰度图像
 * @returns {number} 最佳阈值（0-255）
 */
export function computeOtsuThreshold(image) {
  const { data } = image
  const pixelCount = data.length / 4

  // 构建灰度直方图
  const histogram = new Array(256).fill(0)
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.floor(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    histogram[gray]++
  }

  // 计算总平均灰度
  let sumTotal = 0
  for (let i = 0; i < 256; i++) {
    sumTotal += i * histogram[i]
  }

  // 遍历所有可能的阈值，寻找最大类间方差
  let bestThreshold = 128 // 默认值
  let maxVariance = -1
  let sumBackground = 0
  let weightBackground = 0

  for (let threshold = 0; threshold < 256; threshold++) {
    weightBackground += histogram[threshold]
    if (weightBackground === 0) continue

    const weightForeground = pixelCount - weightBackground
    if (weightForeground === 0) break

    sumBackground += threshold * histogram[threshold]

    const meanBackground = sumBackground / weightBackground
    const meanForeground = (sumTotal - sumBackground) / weightForeground

    // 类间方差
    const variance = weightBackground * weightForeground * Math.pow(meanBackground - meanForeground, 2)

    // 更新最佳阈值（严格大于以获得两个峰值之间的值）
    if (variance > maxVariance) {
      maxVariance = variance
      bestThreshold = threshold
    }
  }

  return bestThreshold
}

/**
 * 从轮廓线框图提取边界（专用算法，避免内部填充问题）
 * 直接从原始图像中提取深色边缘像素
 * @param {ImageData} imageData - 原始图像数据
 * @returns {Array<{x: number, y: number}>} 轮廓点数组
 */
/**
 * 从轮廓线框图提取边界（专用算法，避免内部填充问题）
 * 使用Zhang-Suen骨架细化算法提取单像素宽度轮廓
 * @param {ImageData} imageData - 原始图像数据
 * @returns {Array<{x: number, y: number}>} 轮廓点数组
 */
export function extractContourFromLineArt(imageData) {
  const { width, height, data } = imageData
  const points = []

  // 步骤1：计算自适应阈值
  const histogram = new Array(256).fill(0)
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.floor(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    histogram[gray]++
  }

  let peaks = []
  for (let i = 1; i < 255; i++) {
    if (histogram[i] > histogram[i-1] && histogram[i] > histogram[i+1] && histogram[i] > 50) {
      peaks.push({ value: i, count: histogram[i] })
    }
  }
  peaks.sort((a, b) => b.count - a.count)

  let threshold = 100
  if (peaks.length >= 1) {
    const darkPeak = peaks.reduce((min, p) => p.value < min.value ? p : min, peaks[0])
    if (darkPeak.value < 150) {
      threshold = Math.min(darkPeak.value + 40, 140)
    }
  }

  console.log(`[extractContourFromLineArt] 阈值=${threshold}`)

  // 步骤2：二值化
  const binary = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      if (gray < threshold) binary[y * width + x] = 1
    }
  }

  // 步骤3：Zhang-Suen骨架细化
  let skeleton = new Uint8Array(binary)
  let changed = true
  let iterations = 0

  const getNeighbors = (s, x, y, w) => {
    return [
      s[(y-1) * w + x], s[(y-1) * w + (x+1)],
      s[y * w + (x+1)], s[(y+1) * w + (x+1)],
      s[(y+1) * w + x], s[(y+1) * w + (x-1)],
      s[y * w + (x-1)], s[(y-1) * w + (x-1)]
    ]
  }

  while (changed && iterations < 100) {
    changed = false
    iterations++
    const toRemove = []

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (skeleton[y * width + x] === 0) continue
        const n = getNeighbors(skeleton, x, y, width)
        const A = n.reduce((a, b) => a + b, 0)
        if (A < 2 || A > 6) continue
        let B = 0
        for (let i = 0; i < 8; i++) if (n[i] === 0 && n[(i + 1) % 8] === 1) B++
        if (B !== 1) continue
        if (n[0] * n[2] * n[4] === 0 && n[2] * n[4] * n[6] === 0) {
          toRemove.push(y * width + x)
          changed = true
        }
      }
    }
    for (const idx of toRemove) skeleton[idx] = 0
    toRemove.length = 0

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (skeleton[y * width + x] === 0) continue
        const n = getNeighbors(skeleton, x, y, width)
        const A = n.reduce((a, b) => a + b, 0)
        if (A < 2 || A > 6) continue
        let B = 0
        for (let i = 0; i < 8; i++) if (n[i] === 0 && n[(i + 1) % 8] === 1) B++
        if (B !== 1) continue
        if (n[0] * n[2] * n[6] === 0 && n[0] * n[4] * n[6] === 0) {
          toRemove.push(y * width + x)
          changed = true
        }
      }
    }
    for (const idx of toRemove) skeleton[idx] = 0
  }

  let count = 0
  for (let i = 0; i < skeleton.length; i++) if (skeleton[i] === 1) count++
  console.log(`[extractContourFromLineArt] 骨架迭代=${iterations}, 像素=${count}`)

  // 步骤4：收集点
  const skeletonPoints = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (skeleton[y * width + x] === 1) skeletonPoints.push({ x, y })
    }
  }

  if (skeletonPoints.length === 0) return []

  const step = Math.max(1, Math.floor(skeletonPoints.length / 1500))
  console.log(`[extractContourFromLineArt] 采样步长=${step}`)

  for (let i = 0; i < skeletonPoints.length; i += step) {
    points.push({ x: skeletonPoints[i].x, y: skeletonPoints[i].y })
  }

  console.log(`[extractContourFromLineArt] 最终点数=${points.length}`)
  return points
}
