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
  // 使用Canvas较小边的40%作为缩放基准（80%利用率）
  const scale = Math.min(canvasWidth, canvasHeight) * 0.4;

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
 * @param {Object} coeffs - 傅里叶系数 {a, b, c, d}
 * @param {number} t - 时间参数（弧度）
 * @param {Array} trajectory - 轨迹点数组（会被修改）
 * @returns {undefined}
 */
export function renderEpicycles(ctx, canvasWidth, canvasHeight, coeffs, t, trajectory) {
  // 参数验证：检查系数完整性
  if (!coeffs || !coeffs.a || !coeffs.b || !coeffs.c || !coeffs.d) {
    console.error('Invalid coefficients');
    return { penX: 0, penY: 0 };
  }

  // 参数验证：检查Canvas上下文有效性
  if (!ctx || typeof ctx.clearRect !== 'function') {
    console.error('Invalid Canvas context');
    return { penX: 0, penY: 0 };
  }

  const { a, b, c, d } = coeffs;
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
    // 计算当前圆的半径（使用x和y分量的欧几里得距离）
    const r = Math.sqrt(a[n] ** 2 + b[n] ** 2);

    // 计算当前圆的旋转角度
    const angle = n * t + Math.atan2(b[n], a[n]);

    // 转换为Canvas坐标
    const canvasCx = offsetX + cx * scale;
    const canvasCy = offsetY + cy * scale;

    // 绘制轮圆（淡蓝色半透明）
    ctx.beginPath();
    ctx.arc(canvasCx, canvasCy, r * scale, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(100, 149, 237, 0.3)';
    ctx.stroke();

    // 计算下一个圆心位置（圆周上的点）
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);

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

  // 绘制轨迹（黑色曲线）
  if (trajectory.length > 1) {
    ctx.beginPath();
    ctx.moveTo(trajectory[0].x, trajectory[0].y);
    for (let i = 1; i < trajectory.length; i++) {
      ctx.lineTo(trajectory[i].x, trajectory[i].y);
    }
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 返回笔尖位置（供外部使用）
  return { penX, penY };
}
