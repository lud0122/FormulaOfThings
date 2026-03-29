/**
 * 形态学图像处理模块
 * 用于修复断裂的轮廓线
 */

/**
 * 创建结构元素（5x5十字形，更强的连接能力）
 * @returns {Array<Array<number>>} 5x5结构元素矩阵
 */
function createCrossKernel() {
  return [
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0]
  ]
}

/**
 * 膨胀操作 - 扩展黑色区域（轮廓线），连接断裂的轮廓
 * @param {ImageData} image - 二值图像
 * @param {Array<Array<number>>} kernel - 结构元素
 * @returns {ImageData} 膨胀后的图像
 */
export function dilate(image, kernel = createCrossKernel()) {
  const { width, height, data } = image
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const output = ctx.createImageData(width, height)

  const kSize = kernel.length
  const kHalf = Math.floor(kSize / 2)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      let isBlack = false

      // 检查邻域内是否有黑色像素
      for (let ky = 0; ky < kSize && !isBlack; ky++) {
        for (let kx = 0; kx < kSize && !isBlack; kx++) {
          if (kernel[ky][kx] === 0) continue

          const nx = x + kx - kHalf
          const ny = y + ky - kHalf

          // 边界检查
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue

          const ni = (ny * width + nx) * 4
          // 如果邻域内有黑色像素（值 <= 128），则当前像素变黑
          if (data[ni] <= 128) {
            isBlack = true
          }
        }
      }

      // 设置输出像素：黑色轮廓，白色背景
      const val = isBlack ? 0 : 255
      output.data[i] = val
      output.data[i + 1] = val
      output.data[i + 2] = val
      output.data[i + 3] = 255
    }
  }

  return output
}

/**
 * 腐蚀操作 - 收缩黑色区域（轮廓线），去除细小噪点
 * @param {ImageData} image - 二值图像
 * @param {Array<Array<number>>} kernel - 结构元素
 * @returns {ImageData} 腐蚀后的图像
 */
export function erode(image, kernel = createCrossKernel()) {
  const { width, height, data } = image
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const output = ctx.createImageData(width, height)

  const kSize = kernel.length
  const kHalf = Math.floor(kSize / 2)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      let allBlack = true

      // 检查邻域内是否全是黑色像素
      for (let ky = 0; ky < kSize && allBlack; ky++) {
        for (let kx = 0; kx < kSize && allBlack; kx++) {
          if (kernel[ky][kx] === 0) continue

          const nx = x + kx - kHalf
          const ny = y + ky - kHalf

          // 边界检查
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
            allBlack = false
            break
          }

          const ni = (ny * width + nx) * 4
          // 如果邻域内有白色像素（值 > 128），则当前像素变白
          if (data[ni] > 128) {
            allBlack = false
          }
        }
      }

      // 设置输出像素：黑色轮廓，白色背景
      const val = allBlack ? 0 : 255
      output.data[i] = val
      output.data[i + 1] = val
      output.data[i + 2] = val
      output.data[i + 3] = 255
    }
  }

  return output
}

/**
 * 闭运算（先膨胀后腐蚀）- 连接断裂的轮廓，同时保持轮廓形状
 * @param {ImageData} image - 二值图像
 * @param {number} iterations - 迭代次数（默认2次）
 * @returns {ImageData} 闭运算后的图像
 */
export function close(image, iterations = 2) {
  let result = image

  // 多次膨胀
  for (let i = 0; i < iterations; i++) {
    result = dilate(result)
  }

  // 多次腐蚀
  for (let i = 0; i < iterations; i++) {
    result = erode(result)
  }

  return result
}

/**
 * 修复断裂的轮廓 - 使用自适应形态学操作
 * @param {ImageData} binaryImage - 二值图像
 * @returns {ImageData} 修复后的图像
 */
export function repairBrokenContour(binaryImage) {
  const { width, height, data } = binaryImage

  // 统计白色像素比例（背景）
  let whiteCount = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 128) whiteCount++
  }
  const whiteRatio = whiteCount / (data.length / 4)
  console.log(`[形态学修复] 图像尺寸=${width}x${height}, 白色像素比例=${(whiteRatio * 100).toFixed(2)}%`)

  // 如果背景像素很少（轮廓像素很多），说明轮廓密集，需要较弱修复
  // 如果背景像素很多（轮廓像素很少），说明轮廓稀疏断裂，需要更强修复
  let iterations
  if (whiteRatio > 0.9) {
    // 白色背景占90%以上，轮廓非常稀疏（如ideal_1.PNG），需要强力修复
    iterations = 5
  } else if (whiteRatio > 0.7) {
    // 白色背景占70-90%，轮廓稀疏，需要较强修复
    iterations = 4
  } else if (whiteRatio > 0.5) {
    // 白色背景占50-70%，轮廓中等密度
    iterations = 3
  } else {
    // 白色背景占50%以下，轮廓密集
    iterations = 2
  }

  console.log(`[形态学修复] 使用闭运算（5x5结构元素），迭代次数=${iterations}`)
  const repaired = close(binaryImage, iterations)

  // 统计修复后的像素变化
  let newWhiteCount = 0
  for (let i = 0; i < repaired.data.length; i += 4) {
    if (repaired.data[i] > 128) newWhiteCount++
  }
  const blackCount = data.length / 4 - whiteCount
  const newBlackCount = repaired.data.length / 4 - newWhiteCount
  console.log(`[形态学修复] 修复前：白色=${whiteCount}, 黑色=${blackCount}`)
  console.log(`[形态学修复] 修复后：白色=${newWhiteCount}, 黑色=${newBlackCount}, 增加=${newBlackCount - blackCount}`)

  return repaired
}
