/**
 * 傅里叶轮圆动画系统 - 主控制模块
 * 协调图像处理、傅里叶分析、动画渲染和UI交互
 */

import { detectImageType, calculateHistogram } from '../image-processor/detector.js'
import { cannyEdgeDetection } from '../image-processor/edge-detector.js'
import { traceContour, findFirstBlackPixel, computeOtsuThreshold } from '../image-processor/contour-tracer.js'
import { dft, pointsToComplex, complexToPoints, magnitudeSpectrum } from '../fourier-analyzer/dft.js'
import { selectTermCount } from '../fourier-analyzer/adaptive-selector.js'
import { generateFormula, generateParameterTable as generateParams } from '../fourier-analyzer/formula-generator.js'
import { renderEpicycles } from '../renderer/epicycle-renderer.js'
import { createAnimationController } from '../renderer/animation-controls.js'
import * as exportPanel from '../ui/export-panel.js'

/**
 * 创建应用状态
 * @returns {Object} 应用状态对象
 */
export const createAppState = () => ({
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
})

// 全局应用状态
let appState = createAppState()

// Canvas引用
let mainCanvas = null
let previewCanvas = null
let mainCtx = null
let previewCtx = null

// UI元素引用
let formulaDisplayEl = null
let parameterTableEl = null
let statusEl = null
let playBtn = null
let resetBtn = null
let speedSelect = null
let progressBar = null

// 动画控制器
let animationController = null

// 上传相关元素
let uploadZone = null
let imageInput = null
let previewImage = null

/**
 * 设置状态文本
 * @param {string} text - 状态文本
 */
function setStatus(text) {
  appState.status = text
  if (statusEl) {
    statusEl.textContent = text
  }
}

/**
 * 显示错误信息
 * @param {string} code - 错误码
 * @param {string} message - 错误信息
 */
function showError(code, message) {
  console.error(`[${code}] ${message}`)
  setStatus(`错误: ${message}`)
  // 触发错误事件，UI可以监听
  document.dispatchEvent(new CustomEvent('fourier-error', {
    detail: { code, message }
  }))
}

/**
 * 将File加载为Image
 * @param {File} file - 图片文件
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('IMAGE_LOAD_ERROR'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 从Image提取ImageData
 * @param {HTMLImageElement} img - 图片元素
 * @returns {ImageData}
 */
function getImageData(img) {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('CANVAS_CONTEXT_ERROR')
  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, img.width, img.height)
}

/**
 * 二值化图像
 * @param {ImageData} imageData - 图像数据
 * @param {number} threshold - 阈值
 * @returns {ImageData} 二值化后的图像
 */
function binaryize(imageData, threshold = 128) {
  const { width, height, data } = imageData
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const output = ctx.createImageData(width, height)

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    const val = gray < threshold ? 0 : 255
    output.data[i] = val
    output.data[i + 1] = val
    output.data[i + 2] = val
    output.data[i + 3] = 255
  }

  return output
}

/**
 * 处理图像上传
 * @param {File} file - 上传的文件
 */
export async function handleImageUpload(file) {
  try {
    // 1. 文件验证
    const maxSizeMB = 10
    if (file.size > maxSizeMB * 1024 * 1024) {
      showError('FILE_TOO_LARGE', `文件过大，请上传小于${maxSizeMB}MB的图片`)
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp']
    if (!allowedTypes.includes(file.type)) {
      showError('UNSUPPORTED_FORMAT', `不支持${file.type}格式，请上传JPG、PNG、WebP或BMP`)
      return
    }

    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      showError('INVALID_FILENAME', '文件名包含非法字符')
      return
    }

    setStatus('processing')

    // 2. 加载图像
    const img = await loadImage(file)
    if (img.width > 2048 || img.height > 2048) {
      showError('IMAGE_TOO_LARGE', '图像尺寸过大，请压缩至2048x2048以下')
      setStatus('idle')
      return
    }

    appState.currentImage = img

    // 3. 提取ImageData
    const imageData = getImageData(img)

    // 4. 检测图像类型
    const detection = detectImageType(imageData)
    appState.imageType = detection.type

    // 5. 提取轮廓
    let contour
    if (appState.imageType === 'contour') {
      // 纯轮廓图：直接二值化后追踪
      const binaryData = binaryize(imageData, 128)
      contour = traceContour(binaryData)
      setStatus('提取完成')
    } else {
      // 复杂图：使用Canny边缘检测
      const edges = cannyEdgeDetection(imageData, { lowThreshold: 50, highThreshold: 150 })
      // 将边缘图转换为RGBA
      const edgeImageData = new ImageData(
        new Uint8ClampedArray(edges.data.length * 4),
        edges.width,
        edges.height
      )
      for (let i = 0; i < edges.data.length; i++) {
        const val = edges.data[i]
        edgeImageData.data[i * 4] = val
        edgeImageData.data[i * 4 + 1] = val
        edgeImageData.data[i * 4 + 2] = val
        edgeImageData.data[i * 4 + 3] = 255
      }
      contour = traceContour(edgeImageData)
      setStatus('提取完成')
    }

    appState.contourPoints = contour

    // 6. 傅里叶分析
    await performFourierAnalysis()

    // 7. 显示结果
    displayResults()
    setStatus('ready')

  } catch (error) {
    handleProcessingError(error)
  }
}

/**
 * 执行傅里叶分析
 */
async function performFourierAnalysis() {
  const { contourPoints } = appState
  if (!contourPoints || contourPoints.length < 3) {
    throw new Error('CONTOUR_TOO_FEW_POINTS')
  }

  // 1. 归一化轮廓点
  const normalizedPoints = normalizeContour(contourPoints)

  // 2. 转换为复数
  const complexPoints = pointsToComplex(normalizedPoints)

  // 3. DFT变换
  const coeffs = dft(complexPoints)
  appState.fourierCoeffs = coeffs


 // 4. 转换系数格式为 {a, b, c, d}
 const coeffsObj = {
 a: coeffs.map(c => c.re),
 b: coeffs.map(c => c.im),
 c: coeffs.map(c => c.re),
 d: coeffs.map(c => c.im)
 }

  // 5. 自适应项数选择
  const selection = selectTermCount(coeffsObj, 0.95)
  appState.termCount = selection.termCount
  appState.energyRatio = selection.energyRatio
}

/**
 * 归一化轮廓点
 * @param {Array<{x:number,y:number}>} points - 轮廓点
 * @returns {Array<{x:number,y:number}>} 归一化后的点
 */
function normalizeContour(points) {
  const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length
  const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length
  const scale = Math.max(...points.map(p =>
    Math.max(Math.abs(p.x - centerX), Math.abs(p.y - centerY))
  ))

  if (scale === 0) {
    throw new Error('DEGENERATE_CONTOUR')
  }

  return points.map(p => ({
    x: (p.x - centerX) / scale,
    y: (p.y - centerY) / scale
  }))
}

/**
 * 显示分析结果
 */
function displayResults() {
  const { fourierCoeffs, termCount, energyRatio, contourPoints } = appState
  if (!fourierCoeffs) return

  // 1. 生成公式文本（适配公式生成器的输入格式）
  const coeffsObj = {
    a: fourierCoeffs.map(c => c.re),
    b: fourierCoeffs.map(c => c.im),
    c: fourierCoeffs.map(c => c.re),
    d: fourierCoeffs.map(c => c.im)
  }
  const formulaText = generateFormula(coeffsObj)
  if (formulaDisplayEl) {
    formulaDisplayEl.innerHTML = `<pre>${formulaText}</pre>`
  }

  // 2. 生成参数表
  const formulaParams = generateParams(coeffsObj)
  if (parameterTableEl) {
    renderParameterTable(parameterTableEl, formulaParams)
  }

  // 3. 创建动画控制器
  if (mainCanvas) {
    animationController = createAnimationController(mainCanvas, {
      speed: appState.speed,
      onFrame: (t) => {
        renderFrame(t)
      },
      onComplete: () => {
        appState.isPlaying = false
        updatePlayButton()
      }
    })
  }
}

/**
 * 渲染参数表到元素
 * @param {HTMLElement} container - 容器元素
 * @param {Array} params - 参数数组
 */
function renderParameterTable(container, params) {
  const table = document.createElement('table')
  table.className = 'parameter-table'

  // 表头
  const thead = document.createElement('thead')
  thead.innerHTML = `
    <tr>
      <th>n</th>
      <th>半径 rₙ</th>
      <th>角速度 ωₙ</th>
      <th>相位 φₙ</th>
      <th>能量占比</th>
    </tr>
  `
  table.appendChild(thead)

  // 表体
  const tbody = document.createElement('tbody')
  params.forEach((param, index) => {
    const row = document.createElement('tr')
    if (param.energyRatio > 0.1) {
      row.className = 'high-energy'
    }
    row.innerHTML = `
      <td>${index}</td>
      <td>${param.radius.toFixed(2)}</td>
      <td>${param.angularVelocity}</td>
      <td>${param.phaseX.toFixed(3)}</td>
      <td>${(param.energyRatio * 100).toFixed(1)}%</td>
    `
    tbody.appendChild(row)
  })
  table.appendChild(tbody)

  container.innerHTML = ''
  container.appendChild(table)
}

/**
 * 渲染单帧动画
 * @param {number} t - 时间参数 (0-2π)
 */
function renderFrame(t) {
  if (!mainCtx || !mainCanvas || !appState.fourierCoeffs) return

  const { fourierCoeffs, trajectory } = appState
  const { width, height } = mainCanvas

  // 准备渲染参数
  const scale = Math.min(width, height) * 0.4
  const offsetX = width / 2
  const offsetY = height / 2

  // 准备系数（转换为轮圆渲染器需要的格式）
  const coeffs = {
    a: fourierCoeffs.map(c => c.re),
    b: fourierCoeffs.map(c => c.im),
    c: fourierCoeffs.map(c => c.re), // y坐标使用相同的系数
    d: fourierCoeffs.map(c => c.im)
  }

  // 渲染轮圆
  const result = renderEpicycles(mainCtx, width, height, coeffs, t, trajectory || [])

  // 更新轨迹
  if (!appState.trajectory) {
    appState.trajectory = []
  }
  appState.trajectory.push({ x: result.penX, y: result.penY })
}

/**
 * 切换动画播放/暂停
 */
export function toggleAnimation() {
  if (!animationController) return

  if (appState.isPlaying) {
    animationController.pause()
    appState.isPlaying = false
  } else {
    animationController.play()
    appState.isPlaying = true
  }
  updatePlayButton()
}

/**
 * 重置动画
 */
export function resetAnimation() {
  if (!animationController) return

  animationController.stop()
  appState.isPlaying = false
  appState.currentFrame = 0
  appState.trajectory = []
  updatePlayButton()

  // 清空画布
  if (mainCtx && mainCanvas) {
    mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height)
  }

  // 渲染初始帧
  renderFrame(0)
}

/**
 * 更新播放按钮状态
 */
function updatePlayButton() {
  if (playBtn) {
    playBtn.textContent = appState.isPlaying ? '暂停' : '播放'
  }
}

/**
 * 设置播放速度
 * @param {number} speed - 速度倍数
 */
export function setAnimationSpeed(speed) {
  appState.speed = speed
  if (animationController) {
    animationController.setSpeed(speed)
  }
}

/**
 * 导出数据
 * @param {string} format - 导出格式 ('json' | 'png' | 'csv')
 */
export async function exportData(format) {
  const { fourierCoeffs, termCount, contourPoints } = appState
  if (!fourierCoeffs) {
    showError('NO_DATA', '没有可导出的数据')
    return
  }

  try {
    // 转换系数格式
    const coeffsObj = {
      a: fourierCoeffs.map(c => c.re),
      b: fourierCoeffs.map(c => c.im),
      c: fourierCoeffs.map(c => c.re),
      d: fourierCoeffs.map(c => c.im)
    }
    const params = generateParams(coeffsObj)

    switch (format) {
      case 'json': {
        const jsonData = {
          metadata: { termCount, contourPoints: contourPoints.length },
          coefficients: params,
          timestamp: exportPanel.generateTimestamp()
        }
        const { download } = exportPanel.exportToJSON(jsonData, `fourier-coeffs-${exportPanel.generateTimestamp()}.json`)
        download()
        break
      }
      case 'csv': {
        const { download } = exportPanel.exportToCSV(params, `fourier-coeffs-${exportPanel.generateTimestamp()}.csv`)
        download()
        break
      }
      case 'png':
        exportCanvasToPNG()
        break
      default:
        showError('UNSUPPORTED_FORMAT', `不支持的导出格式: ${format}`)
    }
  } catch (error) {
    showError('EXPORT_FAILED', `导出失败: ${error.message}`)
  }
}

/**
 * 导出Canvas为PNG
 */
function exportCanvasToPNG() {
  if (!mainCanvas) return

  const link = document.createElement('a')
  link.download = 'fourier-animation.png'
  link.href = mainCanvas.toDataURL('image/png')
  link.click()
}

/**
 * 处理处理过程中的错误
 * @param {Error} error - 错误对象
 */
function handleProcessingError(error) {
  console.error('Processing error:', error)

  const errorMap = {
    'IMAGE_LOAD_ERROR': '图像加载失败',
    'IMAGE_TOO_LARGE': '图像尺寸过大',
    'NO_CONTOUR_FOUND': '未找到可识别的轮廓',
    'CONTOUR_TOO_FEW_POINTS': '轮廓点过少，无法拟合',
    'CONTOUR_TOO_LARGE': '轮廓过于复杂，自动降采样',
    'CONTOUR_TRACE_FAILED': '边界追踪失败',
    'INVALID_COEFFICIENTS': '傅里叶系数无效',
    'EMPTY_COEFFICIENTS': '傅里叶系数为空',
    'ZERO_TOTAL_ENERGY': '总能量为零',
    'CANVAS_CONTEXT_ERROR': 'Canvas上下文获取失败',
    'DEGENERATE_CONTOUR': '轮廓退化为点'
  }

  let message = error.message
  for (const [code, msg] of Object.entries(errorMap)) {
    if (error.message.includes(code) || error.code === code) {
      message = msg
      showError(code, message)
      return
    }
  }

  showError('UNKNOWN_ERROR', message || '处理失败，请重试')
  setStatus('idle')
}

/**
 * 初始化应用
 * @param {Object} options - 初始化选项
 * @param {HTMLCanvasElement} options.mainCanvas - 主Canvas元素
 * @param {HTMLCanvasElement} options.previewCanvas - 预览Canvas元素
 * @param {HTMLElement} options.formulaDisplay - 公式显示容器
 * @param {HTMLElement} options.parameterTable - 参数表容器
 * @param {HTMLElement} options.status - 状态显示元素
 * @param {HTMLButtonElement} options.playBtn - 播放按钮
 * @param {HTMLButtonElement} options.resetBtn - 重置按钮
 * @param {HTMLSelectElement} options.speedSelect - 速度选择器
 * @param {HTMLInputElement} options.progressBar - 进度条
 * @param {HTMLElement} options.uploadZone - 上传区域
 * @param {HTMLInputElement} options.imageInput - 文件输入
 * @param {HTMLImageElement} options.previewImage - 预览图像
 */
export function initApp(options) {
  // 获取Canvas引用
  if (options.mainCanvas) {
    mainCanvas = options.mainCanvas
    mainCtx = mainCanvas.getContext('2d')
  }
  if (options.previewCanvas) {
    previewCanvas = options.previewCanvas
    previewCtx = previewCanvas.getContext('2d')
  }

  // 获取UI元素引用
  formulaDisplayEl = options.formulaDisplay
  parameterTableEl = options.parameterTable
  statusEl = options.status
  playBtn = options.playBtn
  resetBtn = options.resetBtn
  speedSelect = options.speedSelect
  progressBar = options.progressBar

  // 获取上传相关元素
  uploadZone = options.uploadZone
  imageInput = options.imageInput
  previewImage = options.previewImage

  // 绑定上传事件
  if (uploadZone && imageInput) {
    // 点击上传区域触发文件选择
    uploadZone.addEventListener('click', () => {
      imageInput.click()
    })

    // 文件选择后处理
    imageInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0]
      if (!file) return

      // 显示预览
      if (previewImage) {
        const url = URL.createObjectURL(file)
        previewImage.src = url
        previewImage.hidden = false
      }

      // 处理上传
      await handleImageUpload(file)
    })

    // 拖拽上传
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault()
      uploadZone.classList.add('dragover')
    })

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover')
    })

    uploadZone.addEventListener('drop', async (e) => {
      e.preventDefault()
      uploadZone.classList.remove('dragover')

      const file = e.dataTransfer?.files?.[0]
      if (!file) return

      // 显示预览
      if (previewImage) {
        const url = URL.createObjectURL(file)
        previewImage.src = url
        previewImage.hidden = false
      }

      // 处理上传
      await handleImageUpload(file)
    })
  }

  // 绑定事件监听器
  if (playBtn) {
    playBtn.addEventListener('click', toggleAnimation)
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetAnimation)
  }

  if (speedSelect) {
    speedSelect.addEventListener('change', (e) => {
      setAnimationSpeed(parseFloat(e.target.value))
    })
  }

  if (progressBar) {
    progressBar.addEventListener('input', (e) => {
      if (animationController) {
        const progress = parseFloat(e.target.value) / 100
        animationController.setProgress(progress)
      }
    })
  }

  // 初始化状态
  setStatus('idle')
}

/**
 * 获取当前状态（供测试使用）
 * @returns {Object} 应用状态副本
 */
export function getState() {
  return { ...appState }
}

/**
 * 重置应用状态
 */
export function resetState() {
  appState = createAppState()
}
