# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

# 启动本地静态服务
npm run serve
```

访问 `http://localhost:4173`

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

### 功能2：Canvas2D 公式拟合管线（Formula Fitting）

“参考图特征 → 公式渲染 → 相似度评分 → 参数搜索 → 实时交互”

**核心模块：**
- `src/formula/*` - 参数schema和数学模型
- `src/render/canvasRenderer.js` - 公式到像素的渲染
- `src/fit/*` - 特征提取、评分、优化器

## 页面与入口

- 页面骨架：`index.html`
- 样式：`styles/main.css`
- 浏览器入口：`<script type="module" src="./src/app/main.js">`

## 测试组织

- **框架**：Node 内置测试框架 `node:test`
- **统计**：当前共 170+ 个测试，全部通过

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