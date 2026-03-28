# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **当前日期：2026-03-28**
> 项目目标：提供从轮廓图像生成傅里叶轮圆动画（Epicycles）的完整解决方案

## 仓库现状

- `main` 分支已包含双功能实现：
  - **傅里叶轮圆动画系统**（新增）- 详见 `docs/superpowers/specs/2026-03-25-fourier-epicycle-design.md`
  - **Canvas2D 公式拟合管线**（原功能）- 详见 `docs/superpowers/specs/2026-03-20-formula-image-design.md`
- 参考图：`ideal/ideal_1.PNG`
- 工作树（旧）：`.worktrees/feat-formula-canvas-generator/`（仅文档参考）

## 快速命令

在实现目录（项目根）执行：

```bash
# 安装依赖
npm install

# 运行全部测试
npm test

# 运行单个测试文件
node --test tests/fit/score.test.js
node --test tests/image-processor/detector.test.js
node --test tests/fourier-analyzer/dft.test.js
node --test tests/integration.fourier-epicycle.test.js

# 启动本地静态服务
npm run serve
```

访问 `http://localhost:4173` 打开 index.html（傅里叶轮圆动画系统）

**注意：** 文档中提到的 `fourier.html` 文件实际不存在于当前仓库。当前只有一个 HTML 入口文件 `index.html`，它直接加载傅里叶轮圆动画系统。

## 双功能架构总览

### 功能1：傅里叶轮圆动画系统（Fourier Epicycles）

从用户上传的图像 → 提取轮廓 → 傅里叶分析 → 轮圆动画

```
用户上传图像
    ↓
图像类型检测（detector.js）
    ↓
轮廓提取：
  ├─ 轮廓图：直接二值化 → 边界追踪
  └─ 复杂图：Canny边缘检测 → 边界追踪
    ↓
傅里叶级数拟合（dft.js + adaptive-selector.js）
    ↓
轮圆动画渲染（epicycle-renderer.js）
    ↓
交互控制（animation-controls.js）
```

**核心模块：**
- `src/image-processor/*` - 图像处理（检测器、边缘检测、边界追踪、阈值UI）
- `src/fourier-analyzer/*` - 傅里叶分析（DFT、自适应选择、公式生成）
- `src/renderer/*` - 动画渲染（轮圆渲染、动画控制）

**模块导出模式：**
所有模块使用 ES6 `export` 导出函数，不使用类。主要函数：
- `fourier-main.js`: `createAppState()`, `handleImageUpload()`, `toggleAnimation()`, `resetAnimation()`, `setAnimationSpeed()`, `initApp()`
- `epicycle-renderer.js`: `prepareRenderer()`, `renderEpicycles()` - 纯函数，无状态
- `dft.js`: `dft()`, `idft()`, `pointsToComplex()`, `complexToPoints()`, `magnitudeSpectrum()`
- `adaptive-selector.js`: `selectTermCount()` - 自适应选择傅里叶项数

**关键数据结构：**
- 傅里叶系数：`{ a: number[], b: number[], c: number[], d: number[] }` - 四个数组长度相同
- 应用状态：`createAppState()` 返回的状态对象，包含图像处理、傅里叶分析、动画控制等状态
- 轮廓点：`Array<{x: number, y: number}>` - 归一化坐标系

**渲染器颜色方案：**
- 轮圆圆圈：`rgba(100, 149, 237, 0.3)` - 淡蓝色半透明
- 轮圆半径线：`rgba(100, 149, 237, 0.6)` - 淡蓝色半透明
- 笔尖点：`red` - 红色
- 轨迹线：`#00d4ff` - 亮青色（适配深色背景 #0f1115）

### 功能2：Canvas2D 公式拟合管线（Formula Fitting）

“参考图特征 → 公式渲染 → 相似度评分 → 参数搜索 → 实时交互”

**主入口：** `src/app/main.js`

**核心模块：**
- `src/formula/*` - 参数schema和数学模型
- `src/render/canvasRenderer.js` - 公式到像素的渲染
- `src/fit/*` - 特征提取、评分、优化器
- `src/analysis/*` - 傅里叶分析、频谱渲染、公式显示

**数据流**（功能2）：
```
参考图(ideal_1.PNG) → loadReferenceImageData → extractFeaturesFromGray
                                                      ↓
[UI参数变更] → renderToBuffer → extractFeaturesFromGray → scoreFeatures
                                                      ↑
                                                    optimizer
```

## 页面与入口

**当前入口：** `index.html` → `src/app/fourier-main.js` （傅里叶轮圆动画系统）

**历史功能：** `src/app/main.js` 是原 Canvas2D 公式拟合管线的入口，但对应的 HTML 文件已不存在。

**共享样式：** `styles/main.css`、`styles/fourier.css`

**参考图像：** `ideal/ideal_1.PNG`

## 测试组织

- **框架**：Node 内置测试框架 `node:test`
- **统计**：当前共 170+ 个测试（有3个已知失败，与功能无关）
- **运行方式**：`npm test`（通配符模式 `tests/**/*.test.js`）

**注意：**
- 测试使用 ES modules (`"type": "module"`)，可直接运行，无需转译
- 3个失败的测试在 `tests/renderer/epicycle-renderer.test.js`，是测试本身的问题（期望返回 `undefined` 但实际返回 `{penX: 0, penY: 0}`），不影响功能

### 测试目录结构
```
tests/
├── image-processor/    # 图像处理测试
│   ├── detector.test.js
│   ├── edge-detector.test.js
│   ├── contour-tracer.test.js
│   └── threshold-ui.test.js
├── fourier-analyzer/   # 傅里叶分析测试
│   ├── dft.test.js
│   ├── adaptive-selector.test.js
│   └── formula-generator.test.js
├── renderer/          # 渲染测试
│   ├── epicycle-renderer.test.js
│   └── animation-controls.test.js
├── formula/           # 公式层测试
│   └── model.test.js
├── fit/               # 拟合层测试
│   ├── extractFeatures.test.js
│   ├── optimizer.test.js
│   └── score.test.js
├── ui/                # UI测试
│   ├── controlPanel.test.js
│   └── export-panel.test.js
└── integration.pipeline.test.js  # 集成测试
```

## 文档索引

### 设计文档
- [傅里叶轮圆动画系统设计说明](./docs/superpowers/specs/2026-03-25-fourier-epicycle-design.md)
- [Canvas2D公式拟合设计说明](./docs/superpowers/specs/2026-03-20-formula-image-design.md)

### 实施计划
- [傅里叶轮圆动画实施计划](./docs/superpowers/plans/2026-03-26-fourier-epicycle-implementation.md)
- [公式拟合实施计划](./docs/superpowers/plans/2026-03-20-formula-image-implementation.md)

### 使用文档
- [项目README](./README.md) - 用户指南和API文档

## 部署

- **GitHub Pages 工作流**：`.github/workflows/pages.yml`
- **触发条件**：push 到 `main` 或手动 `workflow_dispatch`
- **访问地址**：`https://<username>.github.io/FormulaOfThings/`
- **当前状态**：自动部署已启用，只需 `git push origin main`
- **静态服务器**：项目无需构建步骤，直接作为静态资源部署

# currentDate Today's date is 2026-03-28. IMPORTANT: this context may or may not be relevant to your tasks. Please verify relevance before using.