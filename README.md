# FormulaOfThings - 傅里叶轮圆动画系统

> 基于Canvas2D的傅里叶级数动画生成器 - 从任意轮廓图像生成经典轮圆动画

## 功能特性

- **图像类型自动检测** - 智能识别轮廓图或复杂图形
- **Canny边缘检测** - 完整的边缘检测流程（高斯模糊 → 梯度计算 → 非极大值抑制 → 双阈值检测）
- **边界追踪** - 8方向边界追踪算法，提取闭合轮廓
- **离散傅里叶变换** (DFT) - 将轮廓点转换为傅里叶级数系数
- **自适应项数选择** - 基于能量占比自动选择最优项数
- **经典轮圆动画** - 复现傅里叶级数的几何可视化
- **数学公式显示** - 实时显示傅里叶级数公式和参数表
- **JSON/PNG导出** - 支持参数导出和动画截图

## 演示

### 轮圆动画示例
从用户上传的图像（如鸟、人等）→ 提取轮廓 → 拟合傅里叶级数 → 播放经典轮圆动画

## 快速开始

### 本地运行

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 启动开发服务器
npm run serve

# 打开浏览器访问 http://localhost:5173（或4173，取决于配置）
```

### 使用步骤

1. **上传图像** - 支持 JPG、PNG、WebP 格式，建议分辨率不超过2048x2048
2. **轮廓提取** - 系统自动检测图像类型并提取轮廓（复杂图形可调节阈值）
3. **傅里叶分析** - 计算傅里叶级数，自适应选择最优项数
4. **播放动画** - 观看经典轮圆动画，观察圆的旋转和轨迹绘制
5. **查看公式** - 查看傅里叶级数公式和详细参数表
6. **导出数据** - 导出JSON参数或动画截图

## 技术架构

### 模块结构

```
src/
├── image-processor/     # 图像处理模块
│   ├── detector.js      # 图像类型检测（轮廓图 vs 复杂图）
│   ├── edge-detector.js # Canny边缘检测实现
│   ├── contour-tracer.js # 8方向边界追踪算法
│   └── threshold-ui.js  # 阈值调节UI逻辑
├── fourier-analyzer/    # 傅里叶分析模块
│   ├── dft.js           # 离散傅里叶变换实现
│   ├── adaptive-selector.js # 自适应项数选择
│   └── formula-generator.js # 数学公式生成
├── renderer/            # 动画渲染模块
│   ├── epicycle-renderer.js # 轮圆动画渲染核心
│   └── animation-controls.js # 动画播放控制
├── ui/                  # UI模块
│   ├── formula-display.js   # 数学公式HTML渲染
│   ├── parameter-table.js    # 参数表格渲染
│   └── export-panel.js       # 导出面板
├── fit/                 # 拟合模块（原公式拟合管线）
│   ├── extractFeatures.js   # 特征提取
│   ├── optimizer.js         # 参数优化
│   └── score.js             # 相似度评分
└── app/
    └── main.js          # 主控制与应用流程编排
```

### 核心算法

1. **Canny边缘检测** - 完整流程包括高斯模糊、Sobel梯度计算、非极大值抑制、双阈值检测和边缘跟踪
2. **离散傅里叶变换 (DFT)** - 将时域轮廓点转换为频域系数，复杂度 O(N²)
3. **自适应项数选择** - 按能量降序排序，累加至95%能量阈值，自动确定最优项数
4. **轮圆动画渲染** - 根据傅里叶系数逐帧渲染轮圆和轨迹

## API文档

### Image Processor模块

#### 图像类型检测
```javascript
import { detectImageType } from './src/image-processor/detector.js'

const result = detectImageType(imageData)
// result: { type: 'contour' | 'complex', confidence: number }
```

#### Canny边缘检测
```javascript
import { cannyEdgeDetection } from './src/image-processor/edge-detector.js'

const edges = cannyEdgeDetection(image, {
  lowThreshold: 50,
  highThreshold: 150
})
```

#### 边界追踪
```javascript
import { traceContour } from './src/image-processor/contour-tracer.js'

const contour = traceContour(binaryImage, maxSize = 10000)
// contour: Array<{x: number, y: number}>
```

### Fourier Analyzer模块

#### 离散傅里叶变换
```javascript
import { dft, idft, pointsToComplex } from './src/fourier-analyzer/dft.js'

// 将轮廓点转换为复数序列
const complexPoints = pointsToComplex(contourPoints)

// 计算DFT
const coefficients = dft(complexPoints)

// 逆变换
const reconstructed = idft(coefficients)
```

#### 自适应项数选择
```javascript
import { selectTermCount } from './src/fourier-analyzer/adaptive-selector.js'

const selection = selectTermCount(coefficients, energyThreshold = 0.95)
// selection: { termCount: number, energyRatio: number, selectedIndices: number[] }
```

### Renderer模块

#### 轮圆动画
```javascript
import { EpicycleRenderer } from './src/renderer/epicycle-renderer.js'

const renderer = new EpicycleRenderer(canvas)
renderer.setCoefficients(coefficients, termCount)
renderer.setCallback(onRenderProgress)

// 渲染一帧
renderer.render(t)  // t: 0 ~ 2π
```

#### 动画控制
```javascript
import { AnimationController } from './src/renderer/animation-controls.js'

const controller = new AnimationController()
controller.setRenderer(renderer)
controller.play()
controller.pause()
controller.reset()
controller.setSpeed(1.0)
```

## 文件结构

```
FormulaOfThings/
├── src/                    # 源代码
├── tests/                  # 测试文件
├── docs/                   # 设计文档
│   ├── superpowers/
│   │   ├── specs/          # 设计规格书
│   │   └── plans/          # 实施计划
│   └── api/               # API文档（待完善）
├── ideal/                  # 参考图像
├── index.html             # 主页面
├── styles/
│   └── main.css           # 样式文件
├── README.md              # 本文件
└── package.json           # 项目配置
```

## 设计文档

- [傅里叶轮圆动画系统设计说明](./docs/superpowers/specs/2026-03-25-fourier-epicycle-design.md) - 详细系统架构设计
- [实施计划](./docs/superpowers/plans/2026-03-26-fourier-epicycle-implementation.md) - 开发计划文档

## 测试

```bash
# 运行所有测试
npm test

# 运行单个测试文件
node --test tests/image-processor/detector.test.js

# 运行特定目录的测试
node --test tests/fourier-analyzer/*.test.js
```

### 测试覆盖

- ✅ 图像处理模块 - 检测器、边缘检测、边界追踪
- ✅ 傅里叶分析模块 - DFT、自适应选择器、公式生成
- ✅ 渲染模块 - 轮圆渲染、动画控制
- ✅ UI模块 - 公式显示、参数表、导出面板
- ✅ 拟合模块 - 特征提取、优化器、评分

## 浏览器兼容性

- Chrome 90+ ✓
- Firefox 88+ ✓
- Safari 14+ ✓
- Edge 90+ ✓

## 部署

### GitHub Pages

项目已配置GitHub Actions工作流，推送到`main`分支自动部署：

```bash
# 推送后即自动部署
git push origin main
```

访问地址：`https://<your-username>.github.io/FormulaOfThings/`

### 手动部署

```bash
# 构建（如需要）
npm run build

# 部署到任意静态服务器
# 将项目根目录作为静态资源部署即可
```

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License
