# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库现状

- `main` 分支当前主要保存设计与实现文档：
  - `docs/superpowers/specs/2026-03-20-formula-image-design.md`
  - `docs/superpowers/plans/2026-03-20-formula-image-implementation.md`
  - `ideal/ideal_1.PNG`（参考图）
- 可运行实现目前在工作树 `feat-formula-canvas-generator` 中（路径：`.worktrees/feat-formula-canvas-generator/`）。后续如果切到该分支，代码结构与命令按下文执行。

## 常用命令（基于实现分支）

在实现目录（项目根）执行：

- 安装依赖：
  - `npm install`
- 运行全部测试：
  - `npm test`
  - 等价：`node --test tests/**/*.test.js`
- 运行单个测试文件：
  - `node --test tests/fit/score.test.js`
  - `node --test tests/integration.pipeline.test.js`
- 启动本地静态服务：
  - `npm run serve`
  - 打开 `http://localhost:4173`
- 备用测试入口脚本：
  - `node scripts/run-tests.mjs`

## 架构总览（Canvas2D 公式拟合管线）

整体是“参考图特征 → 公式渲染 → 相似度评分 → 参数搜索 → 实时交互”的闭环：

1. **应用编排层**（`src/app/main.js`）
   - 负责启动流程、状态管理、事件绑定与拟合主循环。
   - 组织 `loadReferenceImageData → extractFeaturesFromGray → optimizeParams → renderToBuffer` 的执行链。

2. **公式层**（`src/formula/*`）
   - `params.js`：参数 schema（范围、步进、默认值、分组）与 `clampParams`。
   - `model.js`：核心可解释公式：`sampleIntensity`（径向基 + 极坐标波 + 噪声）与 `toneMap`（强度到 RGBA 映射）。

3. **渲染层**（`src/render/canvasRenderer.js`）
   - 纯函数 `renderToBuffer`，将参数化公式采样成 `Uint8ClampedArray`，由 app 层写入 Canvas。

4. **拟合层**（`src/fit/*`）
   - `extractFeatures.js`：从灰度图提取直方图、径向分布、方向分布、边缘能量。
   - `score.js`：按加权距离计算候选与目标相似度（0~1）。
   - `optimizer.js`：随机重启 + 局部扰动搜索最优参数。

5. **I/O 与交互层**
   - `src/io/referenceLoader.js`：加载参考图并转灰度。
   - `src/io/exporter.js`：导出 PNG、导出/导入参数 JSON。
   - `src/ui/controlPanel.js`：基于 schema 动态生成参数面板并回调更新。

## 页面与入口

- 页面骨架：`index.html`
- 样式：`styles/main.css`
- 浏览器入口：`<script type="module" src="./src/app/main.js">`

## 测试组织

- 使用 Node 内置测试框架 `node:test`。
- 测试目录按模块分层：
  - `tests/formula/*.test.js`
  - `tests/fit/*.test.js`
  - `tests/render/*.test.js`
  - `tests/ui/*.test.js`
  - `tests/integration.pipeline.test.js`

## 部署

- GitHub Pages 工作流：`.github/workflows/pages.yml`
- 触发条件：push 到 `main` 或手动 `workflow_dispatch`
- 当前配置直接上传仓库根目录作为 Pages artifact。