/**
 * 轮圆渲染器 - 绘制傅里叶级数的轮圆动画
 *
 * 负责将傅里叶系数渲染为可视化的轮圆动画帧
 */

/**
 * 准备渲染参数
 * 计算缩放比例和偏移量，使得图形居中且充分利用Canvas空间
 *
 * @param {Object} coeffs - 傅里叶系数 {a, b, c, d}
 * @param {number} canvasWidth - Canvas宽度
 * @param {number} canvasHeight - Canvas高度
 * @returns {Object} 渲染参数 {scale, offsetX, offsetY}
 */
export function prepareRenderer(coeffs, canvasWidth, canvasHeight) {
  const { a, b, c, d } = coeffs;
  const N = a.length;

  // 采样傅里叶曲线以确定边界
  const sampleCount = 360;
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (let i = 0; i < sampleCount; i++) {
    const t = (i / sampleCount) * 2 * Math.PI;
    let x = a[0] / 2, y = c[0] / 2;  // DC分量

    // 标准傅里叶展开: f(t) = Σ [a_k*cos(k*t) + b_k*sin(k*t)]
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

  const contourWidth = maxX - minX;
  const contourHeight = maxY - minY;

  if (contourWidth === 0 || contourHeight === 0) {
    const scale = Math.min(canvasWidth, canvasHeight) * 0.4;
    const offsetX = canvasWidth / 2;
    const offsetY = canvasHeight / 2;
    return { scale, offsetX, offsetY };
  }

  const padding = 0.05;
  const scaleX = (canvasWidth * (1 - 2 * padding)) / contourWidth;
  const scaleY = (canvasHeight * (1 - 2 * padding)) / contourHeight;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = canvasWidth / 2;
  const offsetY = canvasHeight / 2;

  return { scale, offsetX, offsetY };
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

  // DC分量 (k=0) 只有余弦分量
  let x = a[0] / 2;
  let y = c[0] / 2;

  // 标准正弦余弦展开: f(t) = Σ [a_k*cos(k*t) + b_k*sin(k*t)]
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
 * @returns {{penX: number, penY: number}} 笔尖位置
 */
export function renderEpicycles(ctx, canvasWidth, canvasHeight, coeffs, t, trajectory) {
  // 参数验证：检查系数完整性
  if (!coeffs || !coeffs.a || !coeffs.b) {
    console.error('Invalid coefficients');
    return { penX: 0, penY: 0 };
  }

  // 参数验证：检查Canvas上下文有效性
  if (!ctx || typeof ctx.clearRect !== 'function') {
    console.error('Invalid Canvas context');
    return { penX: 0, penY: 0 };
  }

  // 准备渲染参数
  const { scale, offsetX, offsetY } = prepareRenderer(coeffs, canvasWidth, canvasHeight);

  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 计算当前笔尖位置
  const { x: px, y: py } = calculatePenPosition(coeffs, t);
  const penX = offsetX + px * scale;
  const penY = offsetY + py * scale;

  // 将当前点添加到轨迹数组
  if (trajectory) {
    trajectory.push({ x: penX, y: penY });
  }

  // 绘制轮廓轨迹线，使用与背景对比度高的颜色
  // 只绘制本次动画周期内的轨迹，不累积
  ctx.beginPath();
  if (trajectory && trajectory.length > 1) {
    ctx.moveTo(trajectory[0].x, trajectory[0].y);
    for (let i = 1; i < trajectory.length; i++) {
      ctx.lineTo(trajectory[i].x, trajectory[i].y);
    }
  }
  ctx.strokeStyle = '#00d4ff'; // 青色，与深色背景对比度高
  ctx.lineWidth = 2;
  ctx.stroke();

  // 绘制红色笔尖点（表示当前位置）
  ctx.beginPath();
  ctx.arc(penX, penY, 3, 0, 2 * Math.PI);
  ctx.fillStyle = 'red';
  ctx.fill();

  // 返回笔尖位置（供外部使用）
  return { penX, penY };
}
