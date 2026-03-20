export const renderToBuffer = ({ width, height, t, params, sampleIntensity, toneMap }) => {
  const out = new Uint8ClampedArray(width * height * 4)
  const invW = 1 / Math.max(1, width - 1)
  const invH = 1 / Math.max(1, height - 1)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = (x * invW - 0.5) * 2
      const ny = (y * invH - 0.5) * 2
      const i = sampleIntensity(nx, ny, t, params)
      const [r, g, b, a] = toneMap(i, params)
      const idx = (y * width + x) * 4
      out[idx] = r
      out[idx + 1] = g
      out[idx + 2] = b
      out[idx + 3] = a
    }
  }

  return out
}
