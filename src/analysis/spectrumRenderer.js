export const renderSpectrumToCanvas = (canvas, spectrum, width, height) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const imageData = ctx.createImageData(width, height)
  const data = imageData.data

  const maxVal = Math.max(...spectrum) || 1
  const logBase = Math.log1p(maxVal)

  for (let i = 0; i < width * height; i++) {
    const logVal = Math.log1p(spectrum[i]) / logBase
    const intensity = Math.pow(logVal, 0.5)
    const color = spectrumColor(intensity)
    data[i * 4] = color.r
    data[i * 4 + 1] = color.g
    data[i * 4 + 2] = color.b
    data[i * 4 + 3] = 255
  }

  ctx.putImageData(imageData, 0, 0)
}

const spectrumColor = (t) => {
  const colors = [
    { t: 0, r: 0, g: 0, b: 32 },
    { t: 0.2, r: 0, g: 0, b: 128 },
    { t: 0.4, r: 0, g: 128, b: 255 },
    { t: 0.6, r: 0, g: 255, b: 128 },
    { t: 0.8, r: 255, g: 255, b: 0 },
    { t: 1, r: 255, g: 255, b: 255 }
  ]

  for (let i = 0; i < colors.length - 1; i++) {
    if (t >= colors[i].t && t <= colors[i + 1].t) {
      const localT = (t - colors[i].t) / (colors[i + 1].t - colors[i].t)
      return {
        r: Math.round(lerp(colors[i].r, colors[i + 1].r, localT)),
        g: Math.round(lerp(colors[i].g, colors[i + 1].g, localT)),
        b: Math.round(lerp(colors[i].b, colors[i + 1].b, localT))
      }
    }
  }
  return colors[colors.length - 1]
}

const lerp = (a, b, t) => a + (b - a) * t

export const drawFrequencyMarkers = (canvas, frequencies, width, height) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const centerX = width / 2
  const centerY = height / 2

  ctx.strokeStyle = '#ff4444'
  ctx.lineWidth = 1
  ctx.fillStyle = '#ff4444'
  ctx.font = '10px monospace'

  frequencies.forEach((f, i) => {
    const x = centerX + f.x
    const y = centerY + f.y

    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillText(`${i + 1}`, x + 6, y + 3)
  })
}
