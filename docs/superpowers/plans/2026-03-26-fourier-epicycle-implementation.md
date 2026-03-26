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
│   ├── detector.js          # 图像类型检测（轮廓图 vs 复杂图）
│   ├── edge-detector.js     # Canny边缘检测实现
│   ├── contour-tracer.js    # 8方向边界追踪算法
│   └── threshold-ui.js      # 阈值调节UI逻辑
├── fourier-analyzer/
│   ├── dft.js               # 离散傅里叶变换实现
│   ├── adaptive-selector.js # 自适应项数选择（能量占比）
│   └── formula-generator.js # 数学公式生成
├── renderer/
│   ├── epicycle-renderer.js # 轮圆动画渲染核心
│   └── animation-controls.js # 动画播放控制
├── ui/
│   ├── formula-display.js   # 数学公式HTML渲染
│   ├── parameter-table.js   # 参数表格渲染
│   └── export-panel.js      # 导出面板
└── app/
    └── main.js              # 主控制与应用流程编排

tests/
├── image-processor/
│   ├── detector.test.js
│   ├── edge-detector.test.js
│   └── contour-tracer.test.js
├── fourier-analyzer/
│   ├── dft.test.js
│   ├── adaptive-selector.test.js
│   └── formula-generator.test.js
├── renderer/
│   ├── epicycle-renderer.test.js
│   └── animation-controls.test.js
└── ui/
    ├── formula-display.test.js
    └── export-panel.test.js

index.html                  # 主页面（修改添加新模块）
styles/main.css             # 样式（修改添加新组件）
```

---

## Task 1: 图像处理模块 - 图像类型检测器

**Files:**
- Create: `src/image-processor/detector.js`
- Create: `tests/image-processor/detector.test.js`

---

- [ ] **Step 1: 编写失败的测试**

```javascript
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { detectImageType, calculateHistogram, findPeaks } from '../../../src/image-processor/detector.js'

describe('detector', () => {
  describe('calculateHistogram', () => {
    it('should calculate histogram for grayscale image', () => {
      const imageData = {
        data: new Uint8ClampedArray([
          0, 0, 0, 255,   128, 128, 128, 255,
          255, 255, 255, 255, 0, 0, 0, 255
        ]),
        width: 2,
        height: 2
      }
      const hist = calculateHistogram(imageData)
      assert.strictEqual(hist[0], 2)  // 2 black pixels
      assert.strictEqual(hist[128], 1)  // 1 gray pixel
      assert.strictEqual(hist[255], 1)  // 1 white pixel
    })
  })

  describe('findPeaks', () => {
    it('should find peaks in bimodal distribution', () => {
      const hist = new Array(256).fill(0)
      hist[0] = 500    // black peak
      hist[128] = 10
      hist[255] = 500  // white peak
      const peaks = findPeaks(hist)
      assert.strictEqual(peaks.length, 2)
      assert.deepStrictEqual(peaks, [0, 255])
    })
  })

  describe('detectImageType', () => {
    it('should detect contour image (bimodal)', () => {
      const imageData = {
        data: new Uint8ClampedArray(400 * 4),
        width: 20,
        height: 20
      }
      // Fill with black and white pixels
      for (let i = 0; i < imageData.data.length; i += 4) {
        const isBlack = Math.random() > 0.5
        imageData.data[i] = isBlack ? 0 : 255
        imageData.data[i + 1] = isBlack ? 0 : 255
        imageData.data[i + 2] = isBlack ? 0 : 255
        imageData.data[i + 3] = 255
      }
      const result = detectImageType(imageData)
      assert.strictEqual(result.type, 'contour')
      assert.ok(result.confidence > 0)
    })

    it('should detect complex image (non-bimodal)', () => {
      const imageData = {
        data: new Uint8ClampedArray(400 * 4),
        width: 20,
        height: 20
      }
      // Fill with various gray values
      for (let i = 0; i < imageData.data.length; i += 4) {
        const gray = Math.floor(Math.random() * 256)
        imageData.data[i] = gray
        imageData.data[i + 1] = gray
        imageData.data[i + 2] = gray
        imageData.data[i + 3] = 255
      }
      const result = detectImageType(imageData)
      assert.strictEqual(result.type, 'complex')
    })
  })
})
```

---

- [ ] **Step 2: 运行测试确认失败**

```bash
node --test tests/image-processor/detector.test.js
```

Expected: FAIL - functions not defined

---

- [ ] **Step 3: 编写最小实现**

```javascript
// src/image-processor/detector.js

/**
 * 计算灰度直方图
 * @param {ImageData} imageData - Canvas ImageData
 * @returns {number[]} 长度为256的直方图数组
 */
export function calculateHistogram(imageData) {
  const hist = new Array(256).fill(0)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.floor(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    hist[gray]++
  }

  return hist
}

/**
 * 在直方图中寻找峰值
 * @param {number[]} hist - 直方图数组
 * @param {number} minValue - 忽略低于此值的bin
 * @returns {number[]} 峰值索引数组
 */
export function findPeaks(hist, minValue = 50) {
  const peaks = []
  const n = hist.length

  for (let i = 1; i < n - 1; i++) {
    if (hist[i] > minValue && hist[i] > hist[i - 1] && hist[i] > hist[i + 1]) {
      // 检查是否是局部最大值
      if (!peaks.includes(i)) {
        peaks.push(i)
      }
    }
  }

  return peaks.sort((a, b) => hist[b] - hist[a])
}

/**
 * 检测图像类型（轮廓图或复杂图）
 * @param {ImageData} imageData - Canvas ImageData
 * @returns {{type: 'contour'|'complex', confidence: number}}
 */
export function detectImageType(imageData) {
  const hist = calculateHistogram(imageData)
  const peaks = findPeaks(hist)
  const totalPixels = imageData.width * imageData.height / 4  // 除以4因为4通道

  // 统计黑白像素占比
  let blackCount = 0
  let whiteCount = 0
  for (let i = 0; i < 64; i++) blackCount += hist[i]
  for (let i = 192; i < 256; i++) whiteCount += hist[i]

  const blackRatio = blackCount / totalPixels
  const whiteRatio = whiteCount / totalPixels
  const bwRatio = blackRatio + whiteRatio

  // 判断是否为轮廓图
  const isBimodal = peaks.length >= 2
  const isMostlyBW = bwRatio > 0.7

  // 计算置信度
  const confidence = isBimodal ? Math.min(peaks[0], peaks[1]) / 255 * isMostlyBW : 0

  return {
    type: isBimodal && isMostlyBW ? 'contour' : 'complex',
    confidence
  }
}

/**
 * 计算置信度
 * @param {number[]} hist - 直方图
 * @param {number[]} peaks - 峰值
 * @returns {number}
 */
function calculateConfidence(hist, peaks) {
  if (peaks.length < 2) return 0
  const maxVal = Math.max(...hist)
  return peaks.slice(0, 2).reduce((sum, p) => sum + hist[p], 0) / maxVal / 2
}
```

---

- [ ] **Step 4: 运行测试确认通过**

```bash
node --test tests/image-processor/detector.test.js
```

Expected: PASS - all 4 tests

---

- [ ] **Step 5: 提交**

```bash
git add tests/image-processor/detector.test.js src/image-processor/detector.js
git commit -m "feat: add image type detector for contour vs complex images"
```

---

