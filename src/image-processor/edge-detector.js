/**
 * Canny边缘检测器实现
 *
 * 实现5个核心步骤：
 * 1. 高斯模糊（降噪）
 * 2. Sobel梯度计算
 * 3. 非极大值抑制
 * 4. 双阈值检测
 * 5. 边缘跟踪（hysteresis）
 */

/**
 * 将RGBA图像转换为灰度图
 * @param {Object} image - 输入图像 {width, height, data}
 * @returns {Object} 灰度图像 {width, height, data: Uint8ClampedArray}
 */
export function toGrayscale(image) {
  const { width, height, data } = image;

  // 如果已经是灰度图（长度等于width*height），直接返回
  if (data.length === width * height) {
    return { width, height, data: new Uint8ClampedArray(data) };
  }

  // RGBA转灰度：使用标准加权公式
  const grayData = new Uint8ClampedArray(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    // ITU-R BT.601标准
    grayData[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  return { width, height, data: grayData };
}

/**
 * 应用3x3高斯模糊核
 * @param {Object} image - 灰度图像
 * @returns {Object} 模糊后的图像
 */
export function applyGaussianBlur(image) {
  const { width, height, data } = image;

  // 3x3高斯核（近似）
  const kernel = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1]
  ];
  const kernelSum = 16;

  const blurred = new Uint8ClampedArray(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;

      // 应用卷积核
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = Math.min(Math.max(x + kx, 0), width - 1);
          const py = Math.min(Math.max(y + ky, 0), height - 1);
          const idx = py * width + px;
          const weight = kernel[ky + 1][kx + 1];
          sum += data[idx] * weight;
        }
      }

      blurred[y * width + x] = Math.round(sum / kernelSum);
    }
  }

  return { width, height, data: blurred };
}

/**
 * 计算Sobel梯度（幅度和方向）
 * @param {Object} image - 灰度图像
 * @returns {Object} {magnitude: {width, height, data}, direction: {width, height, data}}
 */
export function computeGradient(image) {
  const { width, height, data } = image;

  // Sobel核
  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];

  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];

  const magnitude = new Uint8ClampedArray(width * height);
  const direction = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let gx = 0;
      let gy = 0;

      // 应用Sobel核
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = Math.min(Math.max(x + kx, 0), width - 1);
          const py = Math.min(Math.max(y + ky, 0), height - 1);
          const idx = py * width + px;
          const weightX = sobelX[ky + 1][kx + 1];
          const weightY = sobelY[ky + 1][kx + 1];
          gx += data[idx] * weightX;
          gy += data[idx] * weightY;
        }
      }

      // 计算梯度幅度和方向
      const mag = Math.sqrt(gx * gx + gy * gy);
      magnitude[y * width + x] = Math.min(255, Math.round(mag));

      // 计算梯度方向（弧度）
      direction[y * width + x] = Math.atan2(gy, gx);
    }
  }

  return {
    magnitude: { width, height, data: magnitude },
    direction: { width, height, data: direction }
  };
}

/**
 * 非极大值抑制（边缘细化）
 * @param {Object} magnitude - 梯度幅度图
 * @param {Object} direction - 梯度方向图
 * @returns {Object} 细化后的边缘图
 */
export function nonMaximumSuppression(magnitude, direction) {
  const { width, height, data: magData } = magnitude;
  const { data: dirData } = direction;

  const suppressed = new Uint8ClampedArray(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const angle = dirData[idx];

      // 将角度量化为4个方向（0, 45, 90, 135度）
      const absAngle = Math.abs(angle);
      let neighbor1, neighbor2;

      // 根据梯度方向比较相邻像素
      if (absAngle < Math.PI / 8 || absAngle > 7 * Math.PI / 8) {
        // 水平方向 (0°)
        neighbor1 = magData[y * width + (x - 1)];
        neighbor2 = magData[y * width + (x + 1)];
      } else if (absAngle >= Math.PI / 8 && absAngle < 3 * Math.PI / 8) {
        // 45度方向
        if (angle > 0) {
          neighbor1 = magData[(y - 1) * width + (x + 1)];
          neighbor2 = magData[(y + 1) * width + (x - 1)];
        } else {
          neighbor1 = magData[(y + 1) * width + (x + 1)];
          neighbor2 = magData[(y - 1) * width + (x - 1)];
        }
      } else if (absAngle >= 3 * Math.PI / 8 && absAngle < 5 * Math.PI / 8) {
        // 垂直方向 (90°)
        neighbor1 = magData[(y - 1) * width + x];
        neighbor2 = magData[(y + 1) * width + x];
      } else {
        // 135度方向
        if (angle > 0) {
          neighbor1 = magData[(y - 1) * width + (x - 1)];
          neighbor2 = magData[(y + 1) * width + (x + 1)];
        } else {
          neighbor1 = magData[(y + 1) * width + (x - 1)];
          neighbor2 = magData[(y - 1) * width + (x + 1)];
        }
      }

      // 如果当前像素是局部极大值，保留；否则抑制为0
      if (magData[idx] >= neighbor1 && magData[idx] >= neighbor2) {
        suppressed[idx] = magData[idx];
      } else {
        suppressed[idx] = 0;
      }
    }
  }

  return { width, height, data: suppressed };
}

/**
 * 双阈值检测
 * @param {Object} image - 抑制后的图像
 * @param {number} lowThreshold - 低阈值
 * @param {number} highThreshold - 高阈值
 * @returns {Object} 阈值化后的图像（强边缘=255，弱边缘=75，非边缘=0）
 */
export function doubleThreshold(image, lowThreshold = 50, highThreshold = 150) {
  const { width, height, data } = image;
  const thresholded = new Uint8ClampedArray(width * height);

  for (let i = 0; i < data.length; i++) {
    if (data[i] >= highThreshold) {
      thresholded[i] = 255; // 强边缘
    } else if (data[i] >= lowThreshold) {
      thresholded[i] = 75; // 弱边缘
    } else {
      thresholded[i] = 0; // 非边缘
    }
  }

  return { width, height, data: thresholded };
}

/**
 * 边缘跟踪（Hysteresis）
 * 通过8连通性连接弱边缘到强边缘
 * 使用广度优先搜索算法优化性能
 * @param {Object} image - 双阈值处理后的图像
 * @returns {Object} 最终的边缘图（二值图）
 */
export function edgeTracking(image) {
  const { width, height, data } = image;
  const tracked = new Uint8ClampedArray(width * height);
  const visited = new Uint8ClampedArray(width * height);

  // 使用队列进行BFS
  const queue = [];

  // 首先将所有强边缘加入队列
  for (let i = 0; i < data.length; i++) {
    if (data[i] === 255) {
      tracked[i] = 255;
      visited[i] = 1;
      queue.push(i);
    }
  }

  // BFS遍历，连接相邻的弱边缘
  while (queue.length > 0) {
    const idx = queue.shift();
    const y = Math.floor(idx / width);
    const x = idx % width;

    // 检查8邻域
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        // 边界检查
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

        const neighborIdx = ny * width + nx;

        // 如果是弱边缘且未被访问
        if (!visited[neighborIdx] && data[neighborIdx] === 75) {
          tracked[neighborIdx] = 255;
          visited[neighborIdx] = 1;
          queue.push(neighborIdx);
        }
      }
    }
  }

  return { width, height, data: tracked };
}

/**
 * 完整的Canny边缘检测流程
 * @param {Object} image - 输入图像（RGBA或灰度）
 * @param {Object} options - 配置选项
 * @param {number} options.lowThreshold - 低阈值（默认50）
 * @param {number} options.highThreshold - 高阈值（默认150）
 * @returns {Object} 边缘图（二值图）
 */
export function cannyEdgeDetection(image, options = {}) {
  const {
    lowThreshold = 50,
    highThreshold = 150
  } = options;

  // Step 1: 转换为灰度图
  const gray = toGrayscale(image);

  // Step 2: 高斯模糊（降噪）
  const blurred = applyGaussianBlur(gray);

  // Step 3: 计算梯度
  const { magnitude, direction } = computeGradient(blurred);

  // Step 4: 非极大值抑制
  const suppressed = nonMaximumSuppression(magnitude, direction);

  // Step 5: 双阈值检测
  const thresholded = doubleThreshold(suppressed, lowThreshold, highThreshold);

  // Step 6: 边缘跟踪
  const edges = edgeTracking(thresholded);

  return edges;
}
