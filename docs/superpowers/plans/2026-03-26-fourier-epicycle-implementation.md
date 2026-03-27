# 傅里叶轮圆动画系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个完整的傅里叶轮圆动画系统，支持从图像提取轮廓、拟合傅里叶级数、经典轮圆动画渲染和交互控制。

**Architecture:** 系统采用模块化设计，分为图像处理、傅里叶分析、动画渲染、公式显示和主控制五大模块。使用纯Canvas2D渲染，无需外部依赖。

**Tech Stack:** JavaScript (ES6+), Canvas2D, Node.js内置测试框架

---

## 文件结构总览

```
src/
├── image-processor/
│ ├── detector.js          # 图像类型检测（轮廓图 vs 复杂图）- ✅ 已完成
│ ├── edge-detector.js     # Canny边缘检测实现 - ✅ 已完成
│ ├── contour-tracer.js    # 8方向边界追踪算法 - ✅ 已完成
│ └── threshold-ui.js      # 阈值调节UI逻辑 - ✅ 已完成
├── fourier-analyzer/
│ ├── dft.js               # 离散傅里叶变换实现 - ✅ 已完成
│ ├── adaptive-selector.js # 自适应项数选择（能量占比）- ✅ 已完成
│ └── formula-generator.js # 数学公式生成 - ✅ 已完成
├── renderer/
│ ├── epicycle-renderer.js # 轮圆动画渲染核心 - ✅ 已完成
│ └── animation-controls.js # 动画播放控制 - ✅ 已完成
├── ui/
│ ├── formula-display.js   # 数学公式HTML渲染 - ✅ 已完成
│ ├── parameter-table.js # 参数表格渲染 - ✅ 已完成
│ └── export-panel.js      # 导出面板 - ✅ 已完成
└── app/
    └── main.js            # 主控制与应用流程编排 - ⚠️ 待检查

tests/
├── image-processor/
│ ├── detector.test.js     - ✅ 已完成
│ ├── edge-detector.test.js - ✅ 已完成
│ └── contour-tracer.test.js - ✅ 已完成
├── fourier-analyzer/
│ ├── dft.test.js         - ✅ 已完成
│ ├── adaptive-selector.test.js - ✅ 已完成
│ └── formula-generator.test.js - ✅ 已完成
├── renderer/
│ ├── epicycle-renderer.test.js - ✅ 已完成
│ └── animation-controls.test.js - ✅ 已完成
└── ui/
    ├── formula-display.test.js - ✅ 已完成
    └── export-panel.test.js   - ✅ 已完成

index.html    # 主页面（修改添加新模块）
styles/main.css # 样式（修改添加新组件）
```

---

## 实施状态总览

| 模块 | 状态 | 文件数 |
|------|------|--------|
| 图像处理模块 (image-processor) | ✅ 已完成 | 4/4 |
| 傅里叶分析模块 (fourier-analyzer) | ✅ 已完成 | 3/3 |
| 动画渲染模块 (renderer) | ✅ 已完成 | 2/2 |
| 公式显示模块 (ui) | ✅ 已完成 | 3/3 |
| 主控制模块 (app) | ⚠️ 待检查 | 0/1 |
| **总计** | **90%** | **12/13** |

---

## Task 1: 图像处理模块 - 图像类型检测器 ✅

**状态:** 已完成并已提交

**Files:**
- ✅ `src/image-processor/detector.js`
- ✅ `tests/image-processor/detector.test.js`

**提交记录:** `feat: add image type detector for contour vs complex images`

---

## Task 2: 图像处理模块 - Canny边缘检测器 ✅

**状态:** 已完成

**Files:**
- ✅ `src/image-processor/edge-detector.js`
- ✅ `tests/image-processor/edge-detector.test.js`

**实现功能:**
- 高斯模糊降噪
- Sobel梯度计算
- 非极大值抑制
- 双阈值检测
- 边缘跟踪（Hysteresis）

---

## Task 3: 图像处理模块 - 边界追踪器 ✅

**状态:** 已完成

**Files:**
- ✅ `src/image-processor/contour-tracer.js`
- ✅ `tests/image-processor/contour-tracer.test.js`

**实现功能:**
- 8方向边界追踪算法
- 轮廓闭合检查
- Otsu自动阈值计算
- 轮廓降采样

**错误码支持:**
- `IMAGE_TOO_LARGE`
- `NO_CONTOUR_FOUND`
- `CONTOUR_TRACE_FAILED`
- `CONTOUR_TOO_FEW_POINTS`

---

## Task 4: 图像处理模块 - 阈值调节UI ✅

**状态:** 已完成

**Files:**
- ✅ `src/image-processor/threshold-ui.js`
- ✅ `tests/image-processor/threshold-ui.test.js`

**实现功能:**
- 阈值滑块组件
- 实时预览功能
- 防抖处理
- 低分辨率预览优化

---

## Task 5: 傅里叶分析模块 - 离散傅里叶变换 ✅

**状态:** 已完成

**Files:**
- ✅ `src/fourier-analyzer/dft.js`
- ✅ `tests/fourier-analyzer/dft.test.js`

**实现功能:**
- 复数运算（加减乘除）
- DFT正变换
- IDFT逆变换
- 幅度谱和相位谱计算
- 能量分布计算
- 轮廓重建
- 对称性分析

---

## Task 6: 傅里叶分析模块 - 自适应项数选择器 ✅

**状态:** 已完成

**Files:**
- ✅ `src/fourier-analyzer/adaptive-selector.js`
- ✅ `tests/fourier-analyzer/adaptive-selector.test.js`

**实现功能:**
- 按能量排序选择频率
- 能量占比阈值控制（默认95%）
- 输入验证和错误处理

**错误码支持:**
- `INVALID_COEFFICIENTS`
- `EMPTY_COEFFICIENTS`
- `INSUFFICIENT_COEFFICIENTS`
- `INVALID_COEFFICIENT`
- `ZERO_TOTAL_ENERGY`

---

## Task 7: 傅里叶分析模块 - 公式生成器 ✅

**状态:** 已完成

**Files:**
- ✅ `src/fourier-analyzer/formula-generator.js`
- ✅ `tests/fourier-analyzer/formula-generator.test.js`

**实现功能:**
- 傅里叶级数公式字符串生成
- 参数表生成（半径、角速度、相位、能量占比）
- CSV导出功能

---

## Task 8: 动画渲染模块 - 轮圆渲染器 ✅

**状态:** 已完成

**Files:**
- ✅ `src/renderer/epicycle-renderer.js`
- ✅ `tests/renderer/epicycle-renderer.test.js`

**实现功能:**
- 经典轮圆动画绘制
- 淡蓝色半透明圆环和半径线
- 红色笔尖点
- 黑色轨迹线
- 坐标变换（归一化 → Canvas坐标）

---

## Task 9: 动画渲染模块 - 动画控制器 ✅

**状态:** 已完成

**Files:**
- ✅ `src/renderer/animation-controls.js`
- ✅ `tests/renderer/animation-controls.test.js`

**实现功能:**
- 播放/暂停控制
- 速度调节（0.5x, 1x, 2x）
- 重置功能
- 进度条控制
- requestAnimationFrame动画循环

---

## Task 10: 公式显示模块 - 公式渲染器 ✅

**状态:** 已完成

**Files:**
- ✅ `src/ui/formula-display.js`
- ✅ `tests/ui/formula-display.test.js`

**实现功能:**
- HTML + CSS渲染数学公式（无外部依赖）
- Unicode下标和希腊字母支持
- 复制到剪贴板功能

---

## Task 11: 公式显示模块 - 参数表渲染器 ✅

**状态:** 已完成

**Files:**
- ✅ `src/ui/parameter-table.js`
- ✅ `tests/ui/parameter-table.test.js`

**实现功能:**
- 参数表格渲染（n, 半径, 角速度, 相位, 能量占比）
- 表头排序功能
- 高亮重要项（能量占比>10%）

---

## Task 12: 公式显示模块 - 导出面板 ✅

**状态:** 已完成

**Files:**
- ✅ `src/ui/export-panel.js`
- ✅ `tests/ui/export-panel.test.js`

**实现功能:**
- JSON格式导出（完整参数）
- PNG格式导出（动画截图）
- CSV格式导出（参数表）

---

## Task 13: 主控制模块 - 主应用逻辑 ⚠️

**状态:** 需要新建 - 现有main.js是旧的公式拟合实现

**分析:**
现有 `src/app/main.js` 实现的是旧的"Canvas2D公式拟合管线"功能（`../formula/params.js`, `../fit/optimizer.js`等），并非新的傅里叶轮圆动画系统。

需要创建新的主控制模块来集成傅里叶轮圆动画流程。

**需要新建的文件:**
- ⚠️ `src/app/fourier-main.js` - 傅里叶轮圆动画系统的主入口

**功能需求:**
- [ ] 完整的应用状态管理（参考设计文档中的`appState`）
- [ ] 文件上传处理（含验证：大小、格式、文件名安全）
- [ ] 图像类型检测流程（contour vs complex）
- [ ] 轮廓提取流程（自动 + 阈值调节UI）
- [ ] 傅里叶分析流程（DFT → 自适应项数选择）
- [ ] 公式显示流程（公式 + 参数表）
- [ ] 动画控制流程（播放/暂停/重置/调速）
- [ ] 错误处理机制（错误码映射和用户提示）
- [ ] Event监听器绑定

---

## Task 14: 集成测试 ⚠️

**状态:** 已存在旧集成测试 - 需要新建傅里叶专用集成测试

**分析:**
现有 `tests/integration.pipeline.test.js` 测试的是旧的公式拟合管线（`runPipelineOnce`），使用模拟的`referenceFeatures`。

需要新建傅里叶轮圆动画系统的集成测试。

**Files:**
- ⚠️ `tests/integration.fourier-epicycle.test.js` - 新建傅里叶专用集成测试

**测试内容:**
- [ ] 图像加载 → ImageData提取
- [ ] 图像类型检测（contour vs complex）
- [ ] 轮廓提取（边界追踪）
- [ ] DFT傅里叶变换
- [ ] 自适应项数选择
- [ ] 轮圆渲染（单帧验证）
- [ ] 使用 `ideal/ideal_1.PNG` 作为标准输入
- [ ] 验证轮廓提取正确性（点数量、闭合性）
- [ ] 验证傅里叶重建能量占比>95%

---

## Task 15: 主页面集成 ⚠️

**状态:** 需要修改 - 现有index.html是旧的公式拟合UI

**分析:**
现有 `index.html` 是"Canvas2D公式拟合管线"的UI，包含：
- 公式生成结果Canvas
- 参考图对比
- 参数面板（滑块控制）
- 自动拟合按钮

需要修改为傅里叶轮圆动画系统的UI布局。

**需要修改的文件:**
- ⚠️ `index.html` - 修改或新建`fourier.html`作为傅里叶系统入口
- ⚠️ `styles/main.css` - 添加傅里叶系统专用样式

**新UI布局设计（来自设计文档）:**
```
┌─────────────────────────────────────────────────────┐
│ 傅里叶轮圆动画系统                                    │
├─────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────────────────────┐    │
│ │ 上传图像      │ │ 动画画布                    │    │
│ │ [选择文件]    │ │ (Canvas: 800x600)          │    │
│ └──────────────┘ │                             │    │
│                  │ [轮圆动画渲染区域]             │    │
│ ┌──────────────┐ │                             │    │
│ │ 轮廓预览      │ │                             │    │
│ │ (调整阈值)    │ │                             │    │
│ │ [确认]       │ └──────────────────────────────┘    │
│ └──────────────┘                                    │
│ ┌──────────────────────────────┐                   │
│ ┌──────────────┐ │ 控制面板                        │    │
│ │ 公式显示      │ │ [播放] [重置] 速度: [1x ▼]     │    │
│ │ x(t)=...     │ │ 进度: [=====> ] 50%            │    │
│ │ y(t)=...     │ └──────────────────────────────┘    │
│ └──────────────┘                                    │
│ ┌──────────────────────────────┐                   │
│ ┌──────────────┐ │ 参数表                          │    │
│ │ 导出面板      │ │ n | rₙ | ωₙ | φₙ | 能量        │    │
│ │ [JSON] [PNG]  │ │ 0 |120 | 0 | 0 | 45.2%        │    │
│ └──────────────┘ │ 1 | 85 | 1 |0.32| 28.7%        │    │
│                  └──────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**需要包含的UI组件:**
- [ ] 文件上传区域（支持拖拽）
- [ ] 轮廓预览Canvas（阈值调节时显示）
- [ ] 动画渲染Canvas（主Canvas: 800x600）
- [ ] 阈值调节UI（滑块 + 实时预览）
- [ ] 公式显示区域（x(t), y(t)公式）
- [ ] 参数表区域（n, rₙ, ωₙ, φₙ, 能量占比）
- [ ] 控制面板（播放/暂停/重置/速度选择/进度条）
- [ ] 导出按钮（JSON/PNG/CSV）
- [ ] 状态显示（处理中/就绪/播放中）

---

## 下一步行动建议

### 优先级1: 创建主控制模块 (`src/app/fourier-main.js`)

需要新建主控制模块，实现傅里叶轮圆动画系统的完整流程：

1. 导入所有子模块
2. 定义应用状态管理
3. 实现图像上传处理流程
4. 实现轮廓提取流程
5. 实现傅里叶分析流程
6. 实现动画控制流程
7. 实现错误处理机制
8. 绑定事件监听器

参考设计文档中的示例代码实现。

### 优先级2: 创建傅里叶系统专用页面 (`fourier.html` 或修改 `index.html`)

创建新的HTML页面作为傅里叶轮圆动画系统的入口：
1. 上传区域（文件选择器）
2. 双Canvas布局（轮廓预览 + 动画渲染）
3. 阈值调节UI容器
4. 公式显示容器
5. 参数表容器
6. 控制面板（播放/暂停/重置/速度/进度）
7. 导出按钮组

### 优先级3: 更新CSS样式 (`styles/main.css` 或新建 `styles/fourier.css`)

添加傅里叶轮圆动画系统专用样式：
1. 上传区域样式
2. 轮廓预览区域样式
3. 动画Canvas样式
4. 公式显示样式
5. 参数表样式
6. 控制面板样式

### 优先级4: 创建傅里叶专用集成测试

创建 `tests/integration.fourier-epicycle.test.js`，测试：
1. 图像加载 → ImageData
2. 类型检测
3. 轮廓提取
4. DFT变换
5. 自适应选择
6. 轮圆渲染（单帧验证）

### 优先级5: 运行全部测试

```bash
npm test
```

---

## 附录A: 主控制模块实现参考

### 模块依赖关系

```javascript
// src/app/fourier-main.js 需要导入的模块:
import { detectImageType } from '../image-processor/detector.js'
import { cannyEdgeDetection } from '../image-processor/edge-detector.js'
import { traceContour, computeOtsuThreshold } from '../image-processor/contour-tracer.js'
import { mountThresholdUI } from '../image-processor/threshold-ui.js'
import { dft, pointsToComplex, magnitudeSpectrum } from '../fourier-analyzer/dft.js'
import { selectTermCount } from '../fourier-analyzer/adaptive-selector.js'
import { generateParameterTable, formatFormulaText } from '../fourier-analyzer/formula-generator.js'
import { renderEpicycles } from '../renderer/epicycle-renderer.js'
import { createAnimationController } from '../renderer/animation-controls.js'
import { renderFormulaDisplay } from '../ui/formula-display.js'
import { renderParameterTable } from '../ui/parameter-table.js'
import { createExportPanel } from '../ui/export-panel.js'
```

### 应用状态结构

```javascript
const appState = {
  // 图像处理
  currentImage: null,
  imageType: null, // 'contour' | 'complex'
  contourPoints: [],
  thresholdSettings: { low: 50, high: 150 },

  // 傅里叶分析
  fourierCoeffs: null,
  termCount: 0,
  energyRatio: 0,

  // 动画控制
  isPlaying: false,
  speed: 1.0,
  currentFrame: 0,
  trajectory: [],

  // UI状态
  status: 'idle' // 'idle' | 'processing' | 'ready' | 'playing'
}
```

### 主流程函数

```javascript
async function handleImageUpload(file) {
  // 1. 文件验证
  // 2. 加载图像
  // 3. 检测图像类型
  // 4. 提取轮廓
  // 5. 傅里叶分析
  // 6. 显示结果
}

function toggleAnimation() {
  // 播放/暂停切换
}

function resetAnimation() {
  // 重置动画状态
}

async function exportData(format) {
  // JSON/PNG/CSV导出
}
```

---

## 设计文档引用

- [傅里叶轮圆动画系统设计说明](../specs/2026-03-25-fourier-epicycle-design.md)

---

*Last Updated: 2026-03-27*
