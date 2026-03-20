import { defaultParams, clampParams } from '../formula/params.js'
import { sampleIntensity, toneMap } from '../formula/model.js'
import { renderToBuffer } from '../render/canvasRenderer.js'
import { loadReferenceImageData } from '../io/referenceLoader.js'
import { extractFeaturesFromGray } from '../fit/extractFeatures.js'
import { scoreFeatures } from '../fit/score.js'
import { optimizeParams } from '../fit/optimizer.js'
import { mountControlPanel } from '../ui/controlPanel.js'
import { exportCanvasToPng, exportParams, importParamsFromFile } from '../io/exporter.js'

const REFERENCE_PATH = './ideal/ideal_1.PNG'

export const createAppState = () => ({
  status: 'idle',
  hasReference: false,
  params: { ...defaultParams }
})

const grayscaleFromRgba = (rgba) => {
  const gray = new Float32Array(rgba.length / 4)
  for (let i = 0; i < gray.length; i += 1) {
    const idx = i * 4
    gray[i] = (0.299 * rgba[idx] + 0.587 * rgba[idx + 1] + 0.114 * rgba[idx + 2]) / 255
  }
  return gray
}

const setStatus = (el, text) => {
  if (el) el.textContent = text
}

const drawBuffer = (canvas, buffer) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  const imageData = new ImageData(buffer, canvas.width, canvas.height)
  ctx.putImageData(imageData, 0, 0)
}

const evaluateCandidateFactory = ({ targetFeatures, width, height, t }) => async (params) => {
  const rgba = renderToBuffer({ width, height, t, params, sampleIntensity, toneMap })
  const gray = grayscaleFromRgba(rgba)
  const candFeatures = extractFeaturesFromGray(gray, width, height)
  return scoreFeatures(targetFeatures, candFeatures)
}

export const runPipelineOnce = async ({ iterations = 20, width = 128, height = 128, referenceFeatures } = {}) => {
  const targetFeatures =
    referenceFeatures ??
    (() => {
      throw new Error('referenceFeatures is required in non-browser environment')
    })()

  const evaluate = evaluateCandidateFactory({
    targetFeatures,
    width,
    height,
    t: 0
  })

  const result = await optimizeParams({
    iterations,
    evaluate
  })

  return {
    bestParams: result.bestParams,
    bestScore: result.bestScore
  }
}

const boot = async () => {
  const state = createAppState()

  const canvas = document.getElementById('formula-canvas')
  const panel = document.getElementById('control-panel')
  const status = document.getElementById('status')
  const fitBtn = document.getElementById('fit-btn')
  const exportPngBtn = document.getElementById('export-png-btn')
  const exportParamsBtn = document.getElementById('export-params-btn')
  const importParamsInput = document.getElementById('import-params-input')

  if (!canvas || !panel || !status || !fitBtn || !exportPngBtn || !exportParamsBtn || !importParamsInput) {
    return
  }

  const renderFrame = (timeSec = 0) => {
    const rgba = renderToBuffer({
      width: canvas.width,
      height: canvas.height,
      t: timeSec,
      params: state.params,
      sampleIntensity,
      toneMap
    })
    drawBuffer(canvas, rgba)
  }

  let animHandle = 0
  const startAnimation = () => {
    const loop = (ms) => {
      renderFrame(ms / 1000)
      animHandle = requestAnimationFrame(loop)
    }
    animHandle = requestAnimationFrame(loop)
  }

  const stopAnimation = () => {
    if (animHandle) cancelAnimationFrame(animHandle)
    animHandle = 0
  }

  try {
    setStatus(status, 'loading reference...')
    const reference = await loadReferenceImageData(REFERENCE_PATH)
    const targetFeatures = extractFeaturesFromGray(reference.gray, reference.width, reference.height)
    const evaluate = evaluateCandidateFactory({
      targetFeatures,
      width: 160,
      height: 220,
      t: 0
    })

    state.hasReference = true
    setStatus(status, 'reference loaded, rendering...')
    mountControlPanel({
      container: panel,
      params: state.params,
      onParamsChange: (next) => {
        state.params = clampParams(next)
      }
    })

    renderFrame(0)
    startAnimation()

    fitBtn.addEventListener('click', async () => {
      setStatus(status, 'fitting...')
      stopAnimation()
      const out = await optimizeParams({
        iterations: 120,
        evaluate,
        onProgress: ({ step, total, bestScore }) => setStatus(status, `fitting ${step}/${total}, score=${bestScore.toFixed(4)}`)
      })
      state.params = clampParams(out.bestParams)
      mountControlPanel({
        container: panel,
        params: state.params,
        onParamsChange: (next) => {
          state.params = clampParams(next)
        }
      })
      renderFrame(0)
      startAnimation()
      setStatus(status, `done. best score=${out.bestScore.toFixed(4)}`)
    })

    exportPngBtn.addEventListener('click', () => exportCanvasToPng(canvas))
    exportParamsBtn.addEventListener('click', () => exportParams(state.params))
    importParamsInput.addEventListener('change', async () => {
      const file = importParamsInput.files?.[0]
      if (!file) return
      try {
        const parsed = await importParamsFromFile(file)
        state.params = clampParams(parsed)
        mountControlPanel({
          container: panel,
          params: state.params,
          onParamsChange: (next) => {
            state.params = clampParams(next)
          }
        })
        setStatus(status, 'params imported')
      } catch (error) {
        setStatus(status, `import failed: ${error.message}`)
      }
    })
  } catch (error) {
    setStatus(status, `startup failed: ${error.message}`)
  }
}

if (typeof window !== 'undefined') {
  boot()
}
