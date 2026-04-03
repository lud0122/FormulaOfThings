/**
 * 轮圆渲染器 - 绘制傅里叶级数的轮圆动画
 *
 * 负责将傅里叶系数渲染为可视化的轮圆动画帧
 */

/**
 * 准备渲染参数
 * 计算缩放比例和偏移量，使得图形居中且充分利用Canvas空间
 *
 * 使用原始轮廓点的min/max作为边界，确保与轮廓预览完全一致
 *
 * @param {Object} coeffs - 傅里叶系数 {a, b, c, d}
 * @param {number} canvasWidth - Canvas宽度
 * @param {number} canvasHeight - Canvas高度
 * @param {Array<{x: number, y: number}>} contourPoints - 原始轮廓点（可选，用于精确边界计算）
 * @returns {Object} 渲染参数 {scale, offsetX, offsetY, minX, maxX, minY, maxY}
 */
export function prepareRenderer(coeffs, canvasWidth, canvasHeight, contourPoints = null) {
  const { a, b, c = a, d = b } = coeffs;
  const N = a.length;

  let minX, maxX, minY, maxY;

  if (contourPoints && contourPoints.length > 0) {
    // Use original contour points' min/max for exact boundary matching
    minX = Math.min(...contourPoints.map(p => p.x));
    maxX = Math.max(...contourPoints.map(p => p.x));
    minY = Math.min(...contourPoints.map(p => p.y));
    maxY = Math.max(...contourPoints.map(p => p.y));
  } else {
    // Fallback: sample Fourier curve to determine boundaries
    const sampleCount = 360;
    minX = Infinity; maxX = -Infinity;
    minY = Infinity; maxY = -Infinity;

    for (let i = 0; i < sampleCount; i++) {
      const t = (i / sampleCount) * 2 * Math.PI;
      const dcX = a.length > 0 ? a[0] : 0;
      const dcY = c.length > 0 ? c[0] : 0;
      let x = dcX / 2, y = dcY / 2; // DC component

      // Standard Fourier expansion: f(t) = Σ [a_k*cos(k*t) + b_k*sin(k*t)]
      for (let k = 1; k < N; k++) {
        const cos_kt = Math.cos(k * t);
        const sin_kt = Math.sin(k * t);
        x += a[k] * cos_kt + b[k] * sin_kt;
        y += c[k] * cos_kt + d[k] * sin_kt;
      }

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  const contourWidth = maxX - minX;
  const contourHeight = maxY - minY;

  if (contourWidth === 0 || contourHeight === 0) {
    const scale = Math.min(canvasWidth, canvasHeight) * 0.4;
    const offsetX = canvasWidth / 2;
    const offsetY = canvasHeight / 2;
    return { scale, offsetX, offsetY, minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  const padding = 0.05;
  const scaleX = (canvasWidth * (1 - 2 * padding)) / contourWidth;
  const scaleY = (canvasHeight * (1 - 2 * padding)) / contourHeight;
  const scale = Math.min(scaleX, scaleY);

  // Calculate offsets to center the contour
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const offsetX = canvasWidth / 2 - centerX * scale;
  const offsetY = canvasHeight / 2 - centerY * scale;

  return { scale, offsetX, offsetY, minX, maxX, minY, maxY };
}

/**
 * 计算给定时间t的笔尖位置
 * @param {Object} coeffs - 傅里叶系数 {a, b, c, d}
 * @param {number} t - 时间参数
 * @returns {{x: number, y: number}} 笔尖位置（归一化坐标）
 */
function calculatePenPosition(coeffs, t) {
  const { a, b, c, d } = coeffs;
  const N = a.length;

  // DC component (k=0) only has cosine component
  let x = a[0] / 2;
  let y = c[0] / 2;

  // Standard sine-cosine expansion: f(t) = Σ [a_k*cos(k*t) + b_k*sin(k*t)]
  for (let k = 1; k < N; k++) {
    const cos_kt = Math.cos(k * t);
    const sin_kt = Math.sin(k * t);
    x += a[k] * cos_kt + b[k] * sin_kt;
    y += c[k] * cos_kt + d[k] * sin_kt;
  }

  return { x, y };
}

/**
 * 渲染单帧轮圆动画
 * 只绘制红色笔尖点（当前位置），不再累积轨迹线条
 * 这样只显示单点，与左侧预览的轮廓点风格保持一致
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D上下文
 * @param {number} canvasWidth - Canvas宽度
 * @param {number} canvasHeight - Canvas高度
 * @param {Object} coeffs - 傅里叶系数 {a, b, c, d}
 * @param {number} t - 时间参数（弧度）
 * @param {Array} trajectory - 轨迹点数组（已废弃，不再使用）
 * @param {Object} renderOptions - 渲染选项
 * @param {Array<{x: number, y: number}>} renderOptions.contourPoints - 原始轮廓点（用于精确边界计算）
 * @returns {{penX: number, penY: number}} 笔尖位置
 */
export function renderEpicycles(ctx, canvasWidth, canvasHeight, coeffs, t, trajectory, renderOptions = {}) {
  // Parameter validation: check coefficient integrity
  if (!coeffs || !coeffs.a || !coeffs.b) {
    console.error('Invalid coefficients');
    return { penX: 0, penY: 0 };
  }

  // Parameter validation: check Canvas context validity
  if (!ctx || typeof ctx.clearRect !== 'function') {
    console.error('Invalid Canvas context');
    return { penX: 0, penY: 0 };
  }

  // Prepare rendering parameters with contour points
  const { scale, offsetX, offsetY } = prepareRenderer(
    coeffs,
    canvasWidth,
    canvasHeight,
    renderOptions.contourPoints
  );

  // Clear canvas with background color
  ctx.fillStyle = '#0f1115';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Calculate current pen position
  const { x: px, y: py } = calculatePenPosition(coeffs, t);
  const penX = offsetX + px * scale;
  const penY = offsetY + py * scale;

  // Add current point to trajectory array
  if (trajectory) {
    trajectory.push({ x: penX, y: penY });
  }

  // Draw contour trajectory line with high contrast color
  // Only draw trajectory within current animation cycle
  ctx.beginPath();
  if (trajectory && trajectory.length > 1) {
    ctx.moveTo(trajectory[0].x, trajectory[0].y);
    for (let i = 1; i < trajectory.length; i++) {
      ctx.lineTo(trajectory[i].x, trajectory[i].y);
    }
  }
  ctx.strokeStyle = '#00d4ff'; // Cyan color for high contrast with dark background
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw red pen tip point (indicating current position)
  ctx.beginPath();
  ctx.arc(penX, penY, 3, 0, 2 * Math.PI);
  ctx.fillStyle = 'red';
  ctx.fill();

  // Return pen position (for external use)
  return { penX, penY };
}
