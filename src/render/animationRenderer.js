export const createAnimationRenderer = (canvas, renderFn) => {
  let animId = null
  let startTime = 0
  let duration = 2000
  let easing = (t) => t * t * (3 - 2 * t)

  const start = (durationMs = 2000, onComplete) => {
    stop()
    startTime = performance.now()
    duration = durationMs

    const loop = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      const eased = easing(progress)

      renderFn(eased, 1 - eased)

      if (progress < 1) {
        animId = requestAnimationFrame(loop)
      } else {
        renderFn(1, 0)
        animId = null
        if (onComplete) onComplete()
      }
    }

    animId = requestAnimationFrame(loop)
  }

  const stop = () => {
    if (animId) {
      cancelAnimationFrame(animId)
      animId = null
    }
  }

  const renderStepByStep = async (steps, delayMs, onStep) => {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      renderFn(t, 1 - t)
      if (onStep) onStep(i, steps)
      if (i < steps) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  return { start, stop, renderStepByStep }
}

export const animateFourierBuild = (canvas, frequencies, width, height, duration = 3000) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let startTime = performance.now()
  const maxR = Math.sqrt(width * width + height * height) / 2

  const render = (progress) => {
    const imageData = ctx.createImageData(width, height)
    const data = imageData.data

    const activeTerms = Math.max(1, Math.floor(progress * frequencies.length + 0.5))

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = (x / width - 0.5) * 2
        const ny = (y / height - 0.5) * 2
        let val = 0.5

        for (let i = 0; i < activeTerms; i++) {
          const f = frequencies[i]
          const kx = (f.x / width) * 2 * Math.PI
          const ky = (f.y / height) * 2 * Math.PI
          const decay = Math.exp(-f.dist / maxR * 2)
          val += f.mag * decay * Math.sin(kx * nx + ky * ny + Math.atan2(f.y, f.x)) * 0.1
        }

        val = Math.max(0, Math.min(1, val))
        const intensity = Math.floor(val * 255)
        const idx = (y * width + x) * 4
        data[idx] = intensity
        data[idx + 1] = intensity
        data[idx + 2] = intensity
        data[idx + 3] = 255
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }

  return new Promise((resolve) => {
    const loop = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      render(progress)

      if (progress < 1) {
        requestAnimationFrame(loop)
      } else {
        resolve()
      }
    }
    requestAnimationFrame(loop)
  })
}

export const animateOriginalBuild = (canvas, sampleIntensity, toneMap, params, width, height, duration = 3000) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let startTime = performance.now()
  const totalPixels = width * height

  const render = (progress) => {
    const imageData = ctx.createImageData(width, height)
    const data = imageData.data

    const maxIndex = Math.floor(progress * totalPixels)

    for (let i = 0; i < maxIndex; i++) {
      const x = i % width
      const y = Math.floor(i / width)
      const nx = (x / width - 0.5) * 2
      const ny = (y / height - 0.5) * 2
      const intensity = sampleIntensity(nx, ny, 0, params)
      const [r, g, b, a] = toneMap(intensity, params)
      const idx = (y * width + x) * 4
      data[idx] = r
      data[idx + 1] = g
      data[idx + 2] = b
      data[idx + 3] = a
    }

    for (let i = maxIndex; i < totalPixels; i++) {
      const idx = i * 4
      data[idx] = 30
      data[idx + 1] = 30
      data[idx + 2] = 40
      data[idx + 3] = 255
    }

    ctx.putImageData(imageData, 0, 0)
  }

  return new Promise((resolve) => {
    const loop = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      render(progress)

      if (progress < 1) {
        requestAnimationFrame(loop)
      } else {
        resolve()
      }
    }
    requestAnimationFrame(loop)
  })
}
