# 傅里叶轮圆动画系统设计说明

## 背景

用户原始需求：给定一张图形（可能是鸟、人等轮廓图），系统能够：
1. 提取图形的轮廓
2. 拟合出傅里叶级数公式
3. 点击公式后，通过经典傅里叶轮圆动画一步步重绘该图形

当前项目已偏离初衷，实现了参数化像素拟合而非傅里叶轮圆动画。本设计旨在回归原始目标。

## 需求确认结论

经过多轮确认，明确以下关键决策：

1. **输入类型**：支持纯轮廓图和复杂图形（如照片）
2. **傅里叶项数**：自适应选择项数（基于能量占比）
3. **动画方式**：经典轮圆动画（显示每个圆的旋转累积）
4. **公式显示**：数学公式 + 参数表 + JSON导出
5. **轮廓提取**：全自动 + 预览调整（用户可调阈值）

## 系统架构

### 总体架构

```
用户上传图像
    ↓
图像类型检测（轮廓图 vs 复杂图）
    ↓
轮廓提取（自动 + 用户可调阈值）
    ↓
傅里叶级数拟合（自适应项数）
    ↓
轮圆动画渲染（经典Epicycles）
    ↓
用户交互（播放/暂停/调速/导出）
```

### 核心模块划分

系统分为五大模块：

1. **图像处理模块** (`src/image-processor/`)
   - 图像类型自动检测
   - 边缘检测（Canny算法）
   - 轮廓提取与边界追踪
   - 阈值调节 + 实时预览

2. **傅里叶分析模块** (`src/fourier-analyzer/`)
   - 离散傅里叶变换（DFT）
   - 自适应项数选择
   - 傅里叶级数公式生成

3. **动画渲染模块** (`src/renderer/`)
   - 经典轮圆动画绘制
   - 轨迹逐帧渲染
   - 动画控制（播放/暂停/速度）

4. **公式显示模块** (`src/ui/formula-display/`)
   - 数学公式渲染
   - 参数表展示
   - JSON导出功能

5. **主控制模块** (`src/app/`)
   - 流程编排
   - 状态管理
   - 事件协调

## 模块详细设计

### 1. 图像处理模块

#### 功能描述

从用户上传的图像中提取轮廓边界点序列。

#### 输入输出

- **输入**：`File` 对象（用户上传的图片）
- **输出**：边界点序列 `Array<{x: number, y: number}>`

#### 子模块

**1.1 图像类型检测器** (`detector.js`)

**功能：** 自动判断图像是纯轮廓图还是复杂图形

**算法：**
```javascript
function detectImageType(imageData) {
  // 分析像素直方图
  const histogram = calculateHistogram(imageData);

  // 检测是否为双峰分布（典型的轮廓图特征）
  const peaks = findPeaks(histogram);
  const isBimodal = peaks.length === 2;

  // 检测黑白像素占比
  const blackRatio = countBlackPixels(imageData) / totalPixels;
  const isMostlyBlackWhite = blackRatio > 0.05 && blackRatio < 0.95;

  return {
    type: isBimodal && isMostlyBlackWhite ? 'contour' : 'complex',
    confidence: calculateConfidence(histogram, peaks)
  };
}
```

**1.2 边缘检测器** (`edge-detector.js`)

**功能：** 对复杂图形进行边缘检测

**算法：** Canny边缘检测
1. 高斯模糊（降噪）
2. Sobel梯度计算
3. 非极大值抑制
4. 双阈值检测
5. 边缘连接

**关键参数：**
- `lowThreshold`: 低阈值（默认50）
- `highThreshold`: 高阈值（默认150）
- `gaussianKernelSize`: 高斯核大小（默认3）

**1.3 边界追踪器** (`contour-tracer.js`)

**功能：** 从二值图像追踪轮廓边界点

**算法：** 8方向追踪算法
1. 扫描找到起始点（第一个黑色像素）
2. 从起始点开始，沿8个方向（N, NE, E, SE, S, SW, W, NW）搜索下一个边界点
3. 重复直到回到起点（闭合轮廓）或达到最大迭代次数

**输入验证：**
- 图像尺寸：不超过2048x2048
- 最大迭代次数：`maxIterations = width * height`

**伪代码：**
```javascript
function traceContour(binaryImage, maxSize = 10000) {
  // 输入验证
  if (binaryImage.width > 2048 || binaryImage.height > 2048) {
    throw new Error('IMAGE_TOO_LARGE: 图像尺寸超过2048x2048');
  }

  const startPoint = findFirstBlackPixel(binaryImage);
  if (!startPoint) {
    throw new Error('NO_CONTOUR_FOUND: 未找到黑色像素');
  }

  const contour = [startPoint];
  let current = startPoint;
  let direction = 0; // 从北方开始
  const maxIterations = binaryImage.width * binaryImage.height;
  let iterations = 0;

  do {
    const next = findNextBoundaryPoint(current, direction);
    if (!next) {
      throw new Error('CONTOUR_TRACE_FAILED: 边界追踪中断，无法找到下一点');
    }

    contour.push(next);
    current = next;
    direction = (direction + 5) % 8; // 调整搜索方向
    iterations++;

    // 安全检查：防止无限循环
    if (iterations > maxIterations) {
      console.warn('CONTOUR_TRACE_TIMEOUT: 边界追踪超时，可能未闭合');
      break;
    }

    // 点数量限制：避免内存溢出
    if (contour.length > maxSize) {
      console.warn('CONTOUR_TOO_LARGE: 轮廓点过多，自动降采样');
      break;
    }
  } while (current !== startPoint);

  // 确保轮廓闭合：如果起点终点不重合，手动连接
  const firstPoint = contour[0];
  const lastPoint = contour[contour.length - 1];
  if (firstPoint.x !== lastPoint.x || firstPoint.y !== lastPoint.y) {
    contour.push(firstPoint);
  }

  // 验证最小点数
  if (contour.length < 3) {
    throw new Error('CONTOUR_TOO_FEW_POINTS: 轮廓点少于3个，无法拟合');
  }

  return contour;
}
```

**错误码定义：**
- `IMAGE_TOO_LARGE`: 图像尺寸超限
- `NO_CONTOUR_FOUND`: 未找到可追踪的轮廓
- `CONTOUR_TRACE_FAILED`: 边界追踪中断
- `CONTOUR_TRACE_TIMEOUT`: 超时未闭合
- `CONTOUR_TOO_LARGE`: 轮廓点过多
- `CONTOUR_TOO_FEW_POINTS`: 轮廓点过少（<3个）

**输出格式：**
```typescript
interface Point {
  x: number;      // 像素坐标，0 <= x < width
  y: number;      // 像素坐标，0 <= y < height
}

type Contour = Point[];  // 长度范围：[3, 10000]
```

**1.4 阈值调节UI** (`threshold-ui.js`)

**功能：** 提供阈值滑块，实时预览轮廓提取效果

**交互元素：**
- 边缘敏感度滑块（调整Canny阈值）
- 轮廓预览Canvas（实时显示提取结果）
- "确认轮廓"按钮

**实时更新策略：**
- 使用防抖（debounce）避免频繁计算
- 低分辨率预览（200x200）提升响应速度

### 2. 傅里叶分析模块

#### 功能描述

将轮廓点序列转换为傅里叶级数系数，用于后续的轮圆动画。

#### 输入输出

- **输入**：边界点序列 `Array<{x, y}>`
- **输出**：傅里叶系数对象
  ```javascript
  {
    xCoeffs: { a: number[], b: number[] }, // x(t)的cos和sin系数
    yCoeffs: { c: number[], d: number[] }, // y(t)的cos和sin系数
    termCount: number, // 自适应项数
    energyRatio: number // 能量占比
  }
  ```

#### 子模块

**2.1 离散傅里叶变换** (`dft.js`)

**功能：** 对轮廓的X和Y坐标分别进行DFT

**核心算法：**
```javascript
function computeDFT(points) {
  const N = points.length;
  const coeffs = { a: [], b: [], c: [], d: [] };

  for (let k = 0; k < N; k++) {
    coeffs.a[k] = 0;
    coeffs.b[k] = 0;
    coeffs.c[k] = 0;
    coeffs.d[k] = 0;

    for (let t = 0; t < N; t++) {
      const angle = 2 * Math.PI * k * t / N;
      coeffs.a[k] += points[t].x * Math.cos(angle);
      coeffs.b[k] += points[t].x * Math.sin(angle);
      coeffs.c[k] += points[t].y * Math.cos(angle);
      coeffs.d[k] += points[t].y * Math.sin(angle);
    }

    // 归一化
    coeffs.a[k] /= N;
    coeffs.b[k] /= N;
    coeffs.c[k] /= N;
    coeffs.d[k] /= N;
  }

  return coeffs;
}
```

**性能优化：**
- 使用快速傅里叶变换（FFT）库（如`fft.js`）加速
- 复杂度从O(N²)降低到O(N log N)

**2.2 自适应项数选择器** (`adaptive-selector.js`)

**功能：** 根据能量占比自动选择最优项数

**算法：**
1. 计算每个频率分量的能量
2. 按能量从大到小排序
3. 从最大能量开始累加，直到达到阈值
4. 返回选中的项数和对应的频率索引

**核心修正：** 必须按能量降序选择，不能按频率索引顺序选择

**正确算法：**
```javascript
function selectTermCount(coeffs, energyThreshold = 0.95) {
  const N = coeffs.a.length;

  // 输入验证
  if (!coeffs.a || !coeffs.b || !coeffs.c || !coeffs.d) {
    throw new Error('INVALID_COEFFICIENTS: 傅里叶系数不完整');
  }
  if (N === 0) {
    throw new Error('EMPTY_COEFFICIENTS: 傅里叶系数为空');
  }
  if (N < 3) {
    throw new Error('INSUFFICIENT_COEFFICIENTS: 傅里叶系数数量不足（<3）');
  }

  // 计算每个频率分量的能量
  const energies = [];
  for (let k = 0; k < N; k++) {
    // 验证系数有效性
    if (!Number.isFinite(coeffs.a[k]) || !Number.isFinite(coeffs.b[k]) ||
        !Number.isFinite(coeffs.c[k]) || !Number.isFinite(coeffs.d[k])) {
      throw new Error(`INVALID_COEFFICIENT: 索引${k}存在NaN或Infinity`);
    }

    const energyX = coeffs.a[k] ** 2 + coeffs.b[k] ** 2;
    const energyY = coeffs.c[k] ** 2 + coeffs.d[k] ** 2;
    energies.push({ k, energy: energyX + energyY });
  }

  // 按能量降序排序（关键修正！）
  energies.sort((a, b) => b.energy - a.energy);

  // 计算累积能量占比
  const totalEnergy = energies.reduce((sum, e) => sum + e.energy, 0);
  if (totalEnergy === 0) {
    throw new Error('ZERO_TOTAL_ENERGY: 总能量为零');
  }

  let cumulativeEnergy = 0;
  const selectedIndices = [];

  for (const item of energies) {
    cumulativeEnergy += item.energy;
    selectedIndices.push(item.k);
    const ratio = cumulativeEnergy / totalEnergy;

    if (ratio >= energyThreshold) {
      // 按频率索引排序，保持低频在前
      selectedIndices.sort((a, b) => a - b);
      return {
        termCount: selectedIndices.length,
        energyRatio: ratio,
        selectedIndices,
        energies: energies.slice(0, selectedIndices.length).map(e => ({
          index: e.k,
          energy: e.energy,
          energyRatio: e.energy / totalEnergy
        }))
      };
    }
  }

  // 达到最大项数仍未满足阈值
  return {
    termCount: N,
    energyRatio: 1.0,
    selectedIndices: Array.from({length: N}, (_, i) => i),
    energies: energies.map(e => ({
      index: e.k,
      energy: e.energy,
      energyRatio: e.energy / totalEnergy
    }))
  };
}
```

**输入验证：**
- 系数必须存在且不为空
- 系数必须有效（不是NaN/Infinity）
- 至少3个系数点

**输出格式：**
```typescript
interface EnergyItem {
  index: number;          // 频率索引
  energy: number;         // 该频率的能量
  energyRatio: number;    // 占总能量的比例
}

interface SelectionResult {
  termCount: number;      // 选中的项数
  energyRatio: number;    // 累计能量占比
  selectedIndices: number[];  // 选中的频率索引（已排序）
  energies: EnergyItem[]; // 每个选中项的能量信息
}
```

**错误码定义：**
- `INVALID_COEFFICIENTS`: 傅里叶系数不完整
- `EMPTY_COEFFICIENTS`: 傅里叶系数为空
- `INSUFFICIENT_COEFFICIENTS`: 系数数量不足
- `INVALID_COEFFICIENT`: 存在无效系数（NaN或Infinity）
- `ZERO_TOTAL_ENERGY`: 总能量为零

**参数：**
- `energyThreshold`: 能量阈值（默认0.95，即保留95%的能量）

**输出范围：**
- 简单轮廓（圆形、椭圆）：10-20项
- 中等复杂度（鸟、鱼）：30-50项
- 高复杂度（人物、建筑）：50-100项

**2.3 公式生成器** (`formula-generator.js`)

**功能：** 生成可读的傅里叶级数公式字符串

**输出格式：**
```
傅里叶级数公式：

x(t) = a₀ + Σ[aₙcos(nt) + bₙsin(nt)]
y(t) = c₀ + Σ[cₙcos(nt) + dₙsin(nt)]

参数表：
n  | 半径rₙ  | 角速度ωₙ | 相位φₙ  | 能量占比
---|---------|----------|---------|--------
0  | 120.5   | 0        | 0       | 45.2%
1  | 85.3    | 1        | 0.32    | 28.7%
2  | 45.2    | 2        | 1.57    | 15.1%
3  | 22.8    | 3        | 2.94    | 7.6%
...
```

**计算逻辑：**
- 半径：`rₙ = sqrt(aₙ² + bₙ²)`
- 相位：`φₙ = atan2(bₙ, aₙ)`
- 角速度：`ωₙ = n`

### 3. 动画渲染模块

#### 功能描述

渲染经典傅里叶轮圆动画，展示圆的旋转和轨迹绘制过程。

#### 输入输出

- **输入**：傅里叶系数 + Canvas上下文
- **输出**：实时动画帧

#### 子模块

**3.1 轮圆渲染器** (`epicycle-renderer.js`)

**功能：** 绘制单个动画帧

**坐标系统说明：**
1. **轮廓点坐标**：图像像素坐标（左上角原点，范围[0, width-1] × [0, height-1]）
2. **归一化坐标**：以中心为原点，范围[-1, 1] × [-1, 1]
3. **Canvas坐标**：以Canvas中心为原点，放大到可视区域

**坐标变换流程：**
```javascript
// 1. 轮廓点归一化（在傅里叶分析前）
function normalizeContour(points) {
  const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  const scale = Math.max(...points.map(p =>
    Math.max(Math.abs(p.x - centerX), Math.abs(p.y - centerY))
  ));

  if (scale === 0) {
    throw new Error('DEGENERATE_CONTOUR: 轮廓退化为点');
  }

  return points.map(p => ({
    x: (p.x - centerX) / scale,
    y: (p.y - centerY) / scale
  }));
}

// 2. 傅里叶系数预缩放（在渲染前）
function prepareRenderer(coeffs, canvasWidth, canvasHeight) {
  const scale = Math.min(canvasWidth, canvasHeight) * 0.4; // 80%利用率
  const offsetX = canvasWidth / 2;
  const offsetY = canvasHeight / 2;

  return { scale, offsetX, offsetY };
}
```

**核心渲染流程：**
```javascript
function renderEpicycles(ctx, canvasWidth, canvasHeight, coeffs, t, trajectory) {
  // 参数验证
  if (!coeffs || !coeffs.a || !coeffs.b || !coeffs.c || !coeffs.d) {
    console.error('Invalid coefficients');
    return;
  }

  const { a, b, c, d } = coeffs;
  let cx = 0, cy = 0; // 当前圆心位置（归一化坐标）
  const N = coeffs.a.length;

  // 准备渲染参数
  const { scale, offsetX, offsetY } = prepareRenderer(coeffs, canvasWidth, canvasHeight);

  // 验证Canvas有效性
  if (!ctx || typeof ctx.clearRect !== 'function') {
    console.error('Invalid Canvas context');
    return;
  }

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 绘制每个轮圆
  for (let n = 0; n < N; n++) {
    // 计算当前圆的半径和角度
    const r = Math.sqrt(a[n] ** 2 + b[n] ** 2);
    const angle = n * t + Math.atan2(b[n], a[n]);

    // 绘制圆（淡蓝色）
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(100, 149, 237, 0.3)';
    ctx.stroke();

    // 绘制半径线（从圆心到圆周）
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.strokeStyle = 'rgba(100, 149, 237, 0.6)';
    ctx.stroke();

    // 绘制圆心点
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(100, 149, 237, 0.8)';
    ctx.fill();

    // 更新圆心位置（累积）
    cx = px;
    cy = py;
  }

  // 绘制最终笔尖位置（红色点）
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
  ctx.fillStyle = 'red';
  ctx.fill();

  // 绘制轨迹（黑色曲线）
  trajectory.push({ x: cx, y: cy });
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
}
```

**视觉效果：**
- 轮圆：淡蓝色半透明圆环
- 半径线：淡蓝色半透明线条
- 圆心点：淡蓝色小点
- 笔尖：红色实心点
- 轨迹：黑色粗线条

**3.2 动画控制器** (`animation-controls.js`)

**功能：** 控制动画播放、暂停、速度

**控制参数：**
- `isPlaying`: 播放状态
- `speed`: 播放速度（0.5x, 1x, 2x）
- `currentFrame`: 当前帧索引
- `totalFrames`: 总帧数（默认360帧，对应t从0到2π）

**动画循环：**
```javascript
function animationLoop() {
  if (!isPlaying) return;

  const dt = (2 * Math.PI) / totalFrames;
  const t = currentFrame * dt;

  renderEpicycles(ctx, coeffs, t, trajectory);
  currentFrame++;

  if (currentFrame >= totalFrames) {
    currentFrame = 0; // 循环播放
    trajectory = [];  // 清空轨迹
  }

  requestAnimationFrame(animationLoop);
}
```

**用户交互：**
- 播放/暂停按钮
- 重置按钮（清空轨迹，回到t=0）
- 速度选择器（下拉菜单）
- 进度条（可拖动到任意帧）

### 4. 公式显示模块

#### 功能描述

渲染数学公式和参数表，支持导出JSON。

#### 子模块

**4.1 公式渲染器** (`formula-display.js`)

**功能：** 在页面上显示傅里叶级数公式

**渲染方式：**
- 使用HTML + CSS渲染（不依赖MathJax等库）
- 使用Unicode下标和希腊字母
- 支持复制到剪贴板

**示例HTML：**
```html
<div class="formula-container">
  <h3>傅里叶级数公式</h3>
  <div class="formula">
    <p>x(t) = a₀ + Σ[aₙcos(nt) + bₙsin(nt)]</p>
    <p>y(t) = c₀ + Σ[cₙcos(nt) + dₙsin(nt)]</p>
  </div>
  <button onclick="copyFormula()">复制公式</button>
</div>
```

**4.2 参数表渲染器** (`parameter-table.js`)

**功能：** 显示详细的参数表格

**表格结构：**
| n | 半径rₙ | 角速度ωₙ | 相位φₙ | 能量占比 |
|---|--------|----------|--------|----------|
| 0 | 120.5  | 0        | 0      | 45.2%    |
| 1 | 85.3   | 1        | 0.32   | 28.7%    |
...

**交互功能：**
- 点击表头排序
- 导出为CSV
- 高亮重要项（能量占比>10%）

**4.3 导出面板** (`export-panel.js`)

**功能：** 导出公式参数和动画截图

**导出格式：**
- JSON格式（完整参数）
- PNG格式（当前帧截图）
- CSV格式（参数表）

**JSON结构：**
```json
{
  "metadata": {
    "termCount": 20,
    "energyRatio": 0.95,
    "contourPoints": 256
  },
  "coefficients": {
    "a": [120.5, 85.3, ...],
    "b": [0, 0.32, ...],
    "c": [100.2, 60.1, ...],
    "d": [0, 1.57, ...]
  },
  "parameters": [
    {
      "n": 0,
      "radius": 120.5,
      "angularVelocity": 0,
      "phase": 0,
      "energyRatio": 0.452
    },
    ...
  ]
}
```

### 5. 主控制模块

#### 功能描述

协调所有模块，管理应用状态和用户交互。

#### 核心状态

```javascript
const appState = {
  // 图像处理
  currentImage: null,          // 用户上传的图像
  imageType: null,             // 'contour' 或 'complex'
  contourPoints: [],           // 提取的轮廓点
  thresholdSettings: {         // 阈值设置
    low: 50,
    high: 150
  },

  // 傅里叶分析
  fourierCoeffs: null,         // 傅里叶系数
  termCount: 0,                // 自适应项数
  energyRatio: 0,              // 能量占比

  // 动画控制
  isPlaying: false,            // 播放状态
  speed: 1.0,                  // 播放速度
  currentFrame: 0,             // 当前帧
  trajectory: [],              // 轨迹点序列

  // UI状态
  status: 'idle'               // 'idle', 'processing', 'ready', 'playing'
};
```

#### 主要函数

**5.1 主流程编排**

```javascript
async function main() {
  // 1. 初始化UI
  initUI();

  // 2. 监听文件上传
  document.getElementById('upload-input').addEventListener('change', handleImageUpload);

  // 3. 监听控制按钮
  document.getElementById('play-btn').addEventListener('click', toggleAnimation);
  document.getElementById('reset-btn').addEventListener('click', resetAnimation);
  document.getElementById('export-btn').addEventListener('click', exportData);
}
```

**5.2 图像上传处理**

```javascript
async function handleImageUpload(event) {
  try {
    const file = event.target.files[0];
    if (!file) return;

    // 输入文件验证
    // 1. 文件大小限制（10MB）
    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      showError('FILE_TOO_LARGE', `文件过大，请上传小于${maxSizeMB}MB的图片`);
      return;
    }

    // 2. 文件类型白名单
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      showError('UNSUPPORTED_FORMAT', `不支持${file.type}格式，请上传JPG、PNG、WebP或BMP`);
      return;
    }

    // 3. 文件名安全检查（防止路径遍历）
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      showError('INVALID_FILENAME', '文件名包含非法字符');
      return;
    }

    appState.status = 'processing';

    // 1. 加载图像
    const image = await loadImage(file);

    // 2. 图像尺寸验证
    if (image.width > 2048 || image.height > 2048) {
      showError('IMAGE_TOO_LARGE', '图像尺寸过大，请压缩至2048x2048以下');
      appState.status = 'idle';
      return;
    }

    appState.currentImage = image;
    const imageData = getImageData(image);

    // 3. 检测图像类型
    const detection = detectImageType(imageData);
    appState.imageType = detection.type;

    // 4. 提取轮廓（根据类型选择策略）
    if (appState.imageType === 'contour') {
      // 轮廓图：直接使用默认阈值
      appState.thresholdSettings = { low: 128, high: 128 };
      appState.contourPoints = traceContour(binaryize(imageData));
    } else {
      // 复杂图：显示阈值调节UI
      // 使用Otsu算法自动推荐阈值
      const autoThreshold = computeOtsuThreshold(imageData);
      appState.thresholdSettings = { low: autoThreshold * 0.5, high: autoThreshold };

      // 显示阈值调节UI，使用自动推荐的阈值作为预览
      const preview = await runEdgeDetection(imageData, appState.thresholdSettings);
      showThresholdUI(imageData, preview); // 显示预览

      // 等待用户确认，60秒超时
      const confirmed = await waitForUserConfirmation(60000);
      if (!confirmed) {
        showError('TIMEOUT', '操作超时，请重新上传');
        appState.status = 'idle';
        return;
      }

      // 使用用户调整后的阈值重新提取
      appState.contourPoints = traceContourFromEdges(
        runEdgeDetection(imageData, appState.thresholdSettings)
      );
    }

    // 5. 傅里叶分析
    try {
      appState.fourierCoeffs = computeDFT(appState.contourPoints);

      // 坐标归一化：确保缩放合理
      appState.fourierCoeffs = normalizeFourierCoeffs(appState.fourierCoeffs);

      const selection = selectTermCount(appState.fourierCoeffs);
      appState.termCount = selection.termCount;
      appState.energyRatio = selection.energyRatio;

      // 6. 显示公式
      displayFormula(appState.fourierCoeffs, appState.termCount, selection.energies);

      appState.status = 'ready';
    } catch (fourierError) {
      // 傅里叶分析失败
      if (fourierError.code === 'ZERO_TOTAL_ENERGY') {
        showError('INVALID_CONTOUR', '轮廓能量为零，请尝试其他图片');
      } else if (fourierError.code === 'INVALID_COEFFICIENTS') {
        showError('COMPUTATION_ERROR', '计算错误，请降低图像复杂度后重试');
      } else {
        showError('UNKNOWN_ERROR', '未知错误，请刷新后重试');
        console.error(fourierError);
      }
      appState.status = 'idle';
    }

  } catch (error) {
    // 全局错误处理
    handleProcessingError(error);
  }
}

// 错误处理函数
function handleProcessingError(error) {
  console.error('Processing error:', error);

  const errorMap = {
    'IMAGE_LOAD_ERROR': '图像加载失败',
    'IMAGE_TOO_LARGE': '图像尺寸过大',
    'NO_CONTOUR_FOUND': '未找到可识别的轮廓',
    'CONTOUR_TOO_FEW_POINTS': '轮廓点过少，无法拟合',
    'CONTOUR_TOO_LARGE': '轮廓过于复杂，自动降采样'
  };

  const message = errorMap[error.code] || error.message || '处理失败，请重试';
  showError(error.code || 'UNKNOWN', message);
  appState.status = 'idle';
}
```

**5.3 动画控制**

```javascript
function toggleAnimation() {
  if (appState.status !== 'ready') return;

  if (appState.isPlaying) {
    appState.isPlaying = false;
    document.getElementById('play-btn').textContent = '播放';
  } else {
    appState.isPlaying = true;
    document.getElementById('play-btn').textContent = '暂停';
    animationLoop();
  }
}

function resetAnimation() {
  appState.isPlaying = false;
  appState.currentFrame = 0;
  appState.trajectory = [];
  renderEpicycles(ctx, appState.fourierCoeffs, 0, []);
  document.getElementById('play-btn').textContent = '播放';
}
```

## 数据流设计

### 完整数据流

```
用户上传图像 (File)
    ↓
FileReader读取图像
    ↓
Canvas绘制图像 → 提取ImageData
    ↓
图像类型检测
    ├─→ 轮廓图 → 二值化 → 边界追踪
    └─→ 复杂图 → Canny边缘检测 → 边界追踪
    ↓
轮廓点序列 Array<{x, y}>
    ↓
离散傅里叶变换 (DFT)
    ↓
傅里叶系数 {a, b, c, d}
    ↓
自适应项数选择
    ↓
简化傅里叶系数 (前N项)
    ↓
动画循环：
    ├─→ 计算当前角度t
    ├─→ 渲染轮圆
    ├─→ 绘制轨迹
    └─→ 更新帧索引
    ↓
用户交互：
    ├─→ 暂停/播放
    ├─→ 调整速度
    ├─→ 重置
    └─→ 导出JSON/PNG
```

## 错误处理策略

### 图像处理阶段

**错误1：图像加载失败**
- 原因：文件损坏、格式不支持
- 处理：提示"图像加载失败，请重新上传"
- 恢复：清空状态，回到idle

**错误2：轮廓提取失败**
- 原因：图像无明确轮廓、阈值设置不当
- 处理：提示"无法提取轮廓，请调整阈值或更换图片"
- 恢复：提供阈值滑块，允许用户手动调整

### 傅里叶分析阶段

**错误3：轮廓点过少**
- 原因：提取的边界点少于3个
- 处理：提示"轮廓点太少，请调整阈值"
- 恢复：返回阈值调节界面

**错误4：傅里叶计算失败**
- 原因：数值溢出、内存不足
- 处理：减少轮廓点采样（降采样）
- 恢复：自动降采样并重试

### 动画渲染阶段

**错误5：Canvas渲染失败**
- 原因：参数越界、Canvas上下文丢失
- 处理：提示"渲染失败，请重置动画"
- 恢复：调用resetAnimation()

## 性能优化策略

### 轮廓提取优化

- **降采样预览**：阈值调节时使用低分辨率图像（200x200）
- **防抖处理**：滑块调整后延迟300ms再重新计算
- **Web Worker**：边缘检测在Worker线程执行，避免阻塞UI

### 傅里叶计算优化

- **FFT加速**：使用快速傅里叶变换算法（O(N log N)）
- **内存复用**：复用数组，减少GC压力
- **并行计算**：X和Y坐标的DFT可以并行计算（Web Worker）

### 动画渲染优化

- **双缓冲**：使用离屏Canvas，减少闪烁
- **轨迹裁剪**：只保留最近1000个轨迹点，避免内存爆炸
- **帧率控制**：限制最高60fps，降低CPU占用

## 测试策略

### 单元测试

**测试文件结构：**
```
tests/
├── image-processor/
│   ├── detector.test.js        # 图像类型检测测试
│   ├── edge-detector.test.js   # Canny边缘检测测试
│   └── contour-tracer.test.js  # 边界追踪测试
├── fourier-analyzer/
│   ├── dft.test.js             # DFT计算测试
│   └── adaptive-selector.test.js # 自适应项数测试
└── renderer/
    └── epicycle-renderer.test.js # 轮圆渲染测试
```

**关键测试用例：**

1. **图像类型检测测试**
   - 输入：纯黑白轮廓图 → 期望输出：`{type: 'contour'}`
   - 输入：彩色照片 → 期望输出：`{type: 'complex'}`

2. **边缘检测测试**
   - 输入：简单几何图形 → 期望输出：正确边缘
   - 输入：模糊图像 → 期望输出：降噪后边缘

3. **DFT计算测试**
   - 输入：正弦波采样点 → 期望输出：单频傅里叶系数
   - 输入：圆形轮廓 → 期望输出：主导频率为1

4. **自适应项数测试**
   - 输入：简单轮廓系数 → 期望输出：较少项数（<20）
   - 输入：复杂轮廓系数 → 期望输出：较多项数（>50）

### 集成测试

**测试流程：** 完整的"上传 → 轮廓提取 → 傅里叶分析 → 动画渲染"

**测试用例：**
- 使用 `ideal/ideal_1.PNG` 作为标准输入
- 验证轮廓提取正确性
- 验证傅里叶重绘效果与原图一致性
- 验证动画播放流畅性

### 视觉测试

**验证标准：**
- 轮圆动画清晰可见
- 轨迹平滑无抖动
- 重绘轮廓与原图高度一致（主观评分）

## 部署方案

### GitHub Pages部署

**工作流配置：** `.github/workflows/pages.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'

      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

**访问方式：** `https://<username>.github.io/FormulaOfThings/`

### 浏览器兼容性

**支持浏览器：**
- Chrome 90+（推荐）
- Firefox 88+
- Safari 14+
- Edge 90+

**降级处理：**
- 不支持Canvas的浏览器：提示升级浏览器
- 性能较差的设备：降低动画分辨率

## 文件结构

```
/home/ubuntu/task/FormulaOfThings/
├── index.html                    # 主页面
├── styles/
│   └── main.css                  # 样式文件
├── src/
│   ├── app/
│   │   └── main.js               # 主控制逻辑
│   ├── image-processor/
│   │   ├── detector.js           # 图像类型检测
│   │   ├── edge-detector.js      # Canny边缘检测
│   │   ├── contour-tracer.js     # 边界追踪
│   │   └── threshold-ui.js       # 阈值调节UI
│   ├── fourier-analyzer/
│   │   ├── dft.js                # 离散傅里叶变换
│   │   ├── adaptive-selector.js  # 自适应项数选择
│   │   └── formula-generator.js  # 公式生成
│   ├── renderer/
│   │   ├── epicycle-renderer.js  # 轮圆动画渲染
│   │   └── animation-controls.js # 动画控制
│   ├── ui/
│   │   ├── formula-display.js    # 公式显示
│   │   └── export-panel.js       # 导出面板
│   └── utils/
│       ├── math-helpers.js       # 数学工具函数
│       └── canvas-helpers.js     # Canvas工具函数
├── tests/
│   ├── image-processor/
│   │   ├── detector.test.js
│   │   └── edge-detector.test.js
│   ├── fourier-analyzer/
│   │   └── dft.test.js
│   └── renderer/
│       └── epicycle-renderer.test.js
├── ideal/
│   └── ideal_1.PNG               # 参考轮廓图
└── package.json                  # 项目配置
```

## 用户交互流程

### 完整使用流程

1. **打开页面**
   - 显示欢迎界面
   - 提供文件上传区域

2. **上传图像**
   - 用户选择图像文件
   - 系统自动检测类型并提取轮廓

3. **确认轮廓**（复杂图形）
   - 显示轮廓预览
   - 用户可调整阈值（边缘敏感度滑块）
   - 实时更新预览
   - 点击"确认轮廓"进入下一步

4. **查看傅里叶分析结果**
   - 显示数学公式
   - 显示参数表
   - 显示自适应项数和能量占比

5. **播放动画**
   - 点击"播放"按钮
   - 观看轮圆动画和轨迹绘制
   - 可随时暂停、调速、重置

6. **导出数据**
   - 导出JSON（完整参数）
   - 导出PNG（动画截图）
   - 复制公式文本

### UI布局设计

```
┌─────────────────────────────────────────────────────┐
│                 傅里叶轮圆动画系统                    │
├─────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────────────────────┐│
│  │ 上传图像      │  │ 动画画布                      ││
│  │ [选择文件]    │  │  (Canvas: 800x600)          ││
│  └──────────────┘  │                              ││
│                    │    [轮圆动画渲染区域]         ││
│  ┌──────────────┐  │                              ││
│  │ 轮廓预览      │  │                              ││
│  │ (调整阈值)    │  │                              ││
│  │ [确认]        │  └──────────────────────────────┘│
│  └──────────────┘                                  │
│                    ┌──────────────────────────────┐│
│  ┌──────────────┐  │ 控制面板                      ││
│  │ 公式显示      │  │ [播放] [重置] 速度: [1x ▼]  ││
│  │ x(t)=...     │  │ 进度: [=====>    ] 50%       ││
│  │ y(t)=...     │  └──────────────────────────────┘│
│  └──────────────┘                                  │
│                    ┌──────────────────────────────┐│
│  ┌──────────────┐  │ 参数表                        ││
│  │ 导出面板      │  │ n | rₙ | ωₙ | φₙ | 能量    ││
│  │ [JSON] [PNG] │  │ 0 |120 | 0  | 0  | 45.2%   ││
│  └──────────────┘  │ 1 | 85 | 1  |0.32| 28.7%   ││
│                    └──────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

## 验收标准

### 功能验收

- [ ] 支持纯轮廓图输入，正确提取边界
- [ ] 支持复杂图形输入，提供阈值调节
- [ ] 傅里叶级数计算正确（与理论值误差<5%）
- [ ] 自适应项数合理（能量占比>95%）
- [ ] 轮圆动画流畅（30fps以上）
- [ ] 轨迹绘制准确，与原图高度一致
- [ ] 公式显示清晰，参数表完整
- [ ] 导出功能正常（JSON/PNG）

### 性能验收

- [ ] 轮廓提取耗时<2秒（中等复杂度图像）
- [ ] 傅里叶计算耗时<1秒（轮廓点<1000）
- [ ] 动画渲染流畅（无卡顿）
- [ ] 内存占用<100MB（典型使用场景）

### 视觉验收

- [ ] 轮圆动画清晰可见
- [ ] 轨迹平滑无抖动
- [ ] 重绘效果与原图视觉一致（主观评分）
- [ ] UI布局美观，操作直观

## 风险与缓解

### 风险1：复杂图形轮廓提取效果不佳

**风险描述：** 照片类图像可能无法提取清晰的轮廓

**缓解措施：**
- 提供多种边缘检测算法（Canny、Sobel、Laplacian）
- 允许用户手动调整阈值
- 提供轮廓编辑功能（可选）

### 风险2：傅里叶项数过多导致动画卡顿

**风险描述：** 复杂轮廓可能需要100+项，渲染性能下降

**缓解措施：**
- 分级渲染：先用少量项预览，再逐步增加
- 降低渲染分辨率
- 使用WebGL加速（可选，第二阶段）

### 风险3：轮廓不闭合导致动画异常

**风险描述：** 边界追踪可能无法完美闭合

**缓解措施：**
- 强制闭合：连接起点和终点
- 平滑处理：对连接处做样条插值

### 风险4：浏览器兼容性问题

**风险描述：** 不同浏览器的Canvas渲染存在差异

**缓解措施：**
- 使用标准Canvas API，避免实验性功能
- 提供降级方案（如禁用动画）
- 添加polyfill（如requestAnimationFrame）

## 未来扩展方向

### 短期扩展（1-2周）

1. **轮廓编辑功能**
   - 允许用户手动修改轮廓点
   - 提供笔刷工具绘制轮廓

2. **多种动画模式**
   - 平滑过渡模式（逐步增加项数）
   - 对比模式（原图 vs 重绘）

### 中期扩展（1-2月）

1. **WebGL加速**
   - 使用WebGL渲染轮圆动画
   - 支持1000+项的高精度拟合

2. **3D傅里叶**
   - 支持三维轮廓的傅里叶分析
   - 3D轮圆动画渲染

### 长期扩展（3月+）

1. **实时视频处理**
   - 从视频中提取轮廓
   - 实时傅里叶动画

2. **AI辅助轮廓提取**
   - 使用深度学习模型提取语义轮廓
   - 支持复杂场景（多人、动物）

## 总结

本设计实现了一个完整的傅里叶轮圆动画系统，包括：
- 支持多种输入类型（轮廓图、照片）
- 自适应傅里叶项数选择
- 经典轮圆动画渲染
- 数学公式和参数展示
- 用户友好的交互界面

系统采用模块化设计，各模块职责清晰，易于测试和维护。通过性能优化和错误处理，确保了系统的稳定性和用户体验。
