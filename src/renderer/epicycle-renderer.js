/**
 * 轮圆渲染器 - 绘制傅里叶级数的轮圆动画
 *
 * 负责将傅里叶系数渲染为可视化的轮圆动画帧
 */

/**
 * 准备渲染参数
 * 计算缩放比例和偏移量，使得图形居中且充分利用Canvas空间
 *
 * @param {Object} coeffs - 傅里叶系数 {a, b, c, d} 或 {a, b}
 * @param {number} canvasWidth - Canvas宽度
 * @param {number} canvasHeight - Canvas高度
 * @returns {Object} 渲染参数 {scale, offsetX, offsetY}
 */
export function prepareRenderer(coeffs, canvasWidth, canvasHeight) {
  // 支持 {a,b,c,d} 格式（推荐）和 {a,b} 格式（兼容）
  const { a, b, c = a, d = b } = coeffs;
  const N = a.length;

  // 采样傅里叶曲线以确定边界
  const sampleCount = 360; // 采样360个点
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (let i = 0; i < sampleCount; i++) {
    const t = (i / sampleCount) * 2 * Math.PI;
    let x = 0, y = 0;

    // 使用正确的傅里叶级数重建公式（独立x,y展开）
    // x(t) = Σ [a_k*cos(k*t) - b_k*sin(k*t)]
    // y(t) = Σ [c_k*cos(k*t) - d_k*sin(k*t)]
    for (let k = 0; k < N; k++) {
      const cos_kt = Math.cos(k * t);
      const sin_kt = Math.sin(k * t);
      x += a[k] * cos_kt - b[k] * sin_kt;
      y += c[k] * cos_kt - d[k] * sin_kt;
    }

    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  const contourWidth = maxX - minX;
  const contourHeight = maxY - minY;

  // 处理边界情况：如果轮廓尺寸为0，使用默认缩放
  if (contourWidth === 0 || contourHeight === 0) {
    const scale = Math.min(canvasWidth, canvasHeight) * 0.4;
    const offsetX = canvasWidth / 2;
    const offsetY = canvasHeight / 2;
    return { scale, offsetX, offsetY };
  }

  // 使用与预览相同的动态缩放策略（留出10%边距）
  const padding = 0.05; // 5%边距
  const scaleX = (canvasWidth * (1 - 2 * padding)) / contourWidth;
  const scaleY = (canvasHeight * (1 - 2 * padding)) / contourHeight;
  const scale = Math.min(scaleX, scaleY);

  // Canvas中心作为偏移起点
  const offsetX = canvasWidth / 2;
  const offsetY = canvasHeight / 2;

  return { scale, offsetX, offsetY };
}

/**
 * 渲染单帧轮圆动画
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D上下文
 * @param {number} canvasWidth - Canvas宽度
 * @param {number} canvasHeight - Canvas高度
 * @param {Object} coeffs - 傅里叶系数 {a, b, c, d}，其中c和d应该与a和b相同
 * @param {number} t - 时间参数（弧度）
 * @param {Array} trajectory - 轨迹点数组（会被修改）
 * @returns {undefined}
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

  // 支持 {a,b,c,d} 格式（推荐）和 {a,b} 格式（兼容旧代码）
  // a,b = x方向的余弦/正弦系数
  // c,d = y方向的余弦/正弦系数
  const { a, b, c = a, d = b } = coeffs;
  const N = a.length;

  // 准备渲染参数
  const { scale, offsetX, offsetY } = prepareRenderer(coeffs, canvasWidth, canvasHeight);

  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 初始化圆心位置（归一化坐标）
  let cx = 0;
  let cy = 0;

  // 绘制每个轮圆
  // x(t) = Σ [a_k*cos(k*t) - b_k*sin(k*t)]
  // y(t) = Σ [c_k*cos(k*t) - d_k*sin(k*t)]
  for (let k = 0; k < N; k++) {
    const cos_kt = Math.cos(k * t);
    const sin_kt = Math.sin(k * t);

    // 当前圆心位置的Canvas坐标
    const canvasCx = offsetX + cx * scale;
    const canvasCy = offsetY + cy * scale;

    // 计算x方向的分量：vx = a_k*cos(kt) - b_k*sin(kt)
    const vx = a[k] * cos_kt - b[k] * sin_kt;
    // 计算y方向的分量：vy = c_k*cos(kt) - d_k*sin(kt)
    const vy = c[k] * cos_kt - d[k] * sin_kt;

    // 计算x方向轮圆（用于可视化x分量）
    const rx = Math.sqrt(a[k] ** 2 + b[k] ** 2);
    if (rx > 0.001) {
      // 绘制x方向轮圆（蓝色）
      ctx.beginPath();
      ctx.arc(canvasCx, canvasCy, rx * scale, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.15)';
      ctx.stroke();
    }

    // 计算y方向轮圆（用于可视化y分量）
    const ry = Math.sqrt(c[k] ** 2 + d[k] ** 2);
    if (ry > 0.001) {
      // y方向的轮圆以(cx, cy+vy)为中心
      ctx.beginPath();
      ctx.arc(canvasCx, canvasCy + vy * scale, ry * scale, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(100, 237, 149, 0.15)';
      ctx.stroke();
    }

    // 计算下一个位置（累加x和y分量）
    const px = cx + vx;
    const py = cy + vy;

    // 绘制从当前位置到新位置的向量
    ctx.beginPath();
    ctx.moveTo(canvasCx, canvasCy);
    ctx.lineTo(offsetX + px * scale, offsetY + py * scale);
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 更新圆心位置
    cx = px;
    cy = py;
  }

  // 最终笔尖位置的Canvas坐标
  const penX = offsetX + cx * scale;
  const penY = offsetY + cy * scale;

  // 绘制红色笔尖
  ctx.beginPath();
  ctx.arc(penX, penY, 5, 0, 2 * Math.PI);
  ctx.fillStyle = 'red';
  ctx.fill();

  // 累积轨迹点（Canvas坐标）
  trajectory.push({ x: penX, y: penY });

  // 绘制轨迹（亮青色曲线）
  if (trajectory.length > 1) {
    ctx.beginPath();
    ctx.moveTo(trajectory[0].x, trajectory[0].y);
    for (let i = 1; i < trajectory.length; i++) {
      ctx.lineTo(trajectory[i].x, trajectory[i].y);
    }
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 返回笔尖位置（供外部使用）
  return { penX, penY };
}
