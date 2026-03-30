/**
 * 轮圆渲染器 - 绘制傅里叶级数的轮圆动画
 *
 * 负责将傅里叶系数渲染为可视化的轮圆动画帧
 */

/**
 * 准备渲染参数
 * 计算缩放比例和偏移量，使得图形居中且充分利用Canvas空间
 *
 * @param {Object} coeffs - 傅里叶系数 {a, b}
 * @param {number} canvasWidth - Canvas宽度
 * @param {number} canvasHeight - Canvas高度
 * @returns {Object} 渲染参数 {scale, offsetX, offsetY}
 */
export function prepareRenderer(coeffs, canvasWidth, canvasHeight) {
  const { a, b } = coeffs;
  const N = a.length;

  // 采样傅里叶曲线以确定边界
  const sampleCount = 360; // 采样360个点
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (let i = 0; i < sampleCount; i++) {
    const t = (i / sampleCount) * 2 * Math.PI;
    let x = 0, y = 0;

    // 使用正确的傅里叶级数重建公式（笛卡尔形式）
    // z(t) = Σ c_n * e^(i*n*t)，其中 c_n = a_n + i*b_n
    // x(t) = Σ [a_n * cos(n*t) - b_n * sin(n*t)]
    // y(t) = Σ [a_n * sin(n*t) + b_n * cos(n*t)]
    for (let n = 0; n < N; n++) {
      const cos_nt = Math.cos(n * t);
      const sin_nt = Math.sin(n * t);
      // z_n(t) = c_n * e^(i*n*t) = (a_n + i*b_n) * (cos(n*t) + i*sin(n*t))
      // 实部: a_n*cos - b_n*sin
      // 虚部: a_n*sin + b_n*cos
      x += a[n] * cos_nt - b[n] * sin_nt;
      y += a[n] * sin_nt + b[n] * cos_nt;
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

  const { a, b } = coeffs;
  const N = a.length;

  // 准备渲染参数
  const { scale, offsetX, offsetY } = prepareRenderer(coeffs, canvasWidth, canvasHeight);

  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 初始化圆心位置（归一化坐标）
  let cx = 0;
  let cy = 0;

  // 绘制每个轮圆
  for (let n = 0; n < N; n++) {
    // 计算复数系数 c_n = a_n + i*b_n
    // |c_n| = sqrt(a_n^2 + b_n^2) 是轮圆的半径
    const r = Math.sqrt(a[n] ** 2 + b[n] ** 2);

    // 计算当前圆的相位角
    const phase = Math.atan2(b[n], a[n]);

    // 计算旋转后的角度（傅里叶级数：每个频率分量旋转 n*t）
    const angle = phase + n * t;

    // 转换为Canvas坐标
    const canvasCx = offsetX + cx * scale;
    const canvasCy = offsetY + cy * scale;

    // 绘制轮圆（淡蓝色半透明）
    ctx.beginPath();
    ctx.arc(canvasCx, canvasCy, r * scale, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(100, 149, 237, 0.3)';
    ctx.stroke();

    // 计算下一个圆心位置（圆周上的点）
    // c_n * e^(i*n*t) = (a_n + i*b_n) * (cos(n*t) + i*sin(n*t))
    // 实部: a_n*cos - b_n*sin
    // 虚部: a_n*sin + b_n*cos
    const cos_nt = Math.cos(n * t);
    const sin_nt = Math.sin(n * t);
    const dx = a[n] * cos_nt - b[n] * sin_nt;
    const dy = a[n] * sin_nt + b[n] * cos_nt;
    const px = cx + dx;
    const py = cy + dy;

    // 绘制半径线（从圆心到圆周）
    ctx.beginPath();
    ctx.moveTo(canvasCx, canvasCy);
    ctx.lineTo(offsetX + px * scale, offsetY + py * scale);
    ctx.strokeStyle = 'rgba(100, 149, 237, 0.6)';
    ctx.stroke();

    // 绘制圆心点
    ctx.beginPath();
    ctx.arc(canvasCx, canvasCy, 3, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(100, 149, 237, 0.8)';
    ctx.fill();

    // 更新圆心位置（累积）
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
