export const dft1d = (signal) => {
  const N = signal.length
  const result = new Array(N).fill(0).map(() => ({ re: 0, im: 0 }))

  for (let k = 0; k < N; k++) {
    let re = 0
    let im = 0
    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / N
      re += signal[n] * Math.cos(angle)
      im += signal[n] * Math.sin(angle)
    }
    result[k] = { re: re / N, im: im / N, mag: Math.sqrt(re * re + im * im) / N }
  }
  return result
}

export const idft1d = (spectrum) => {
  const N = spectrum.length
  const result = new Float32Array(N)

  for (let n = 0; n < N; n++) {
    let val = 0
    for (let k = 0; k < N; k++) {
      const angle = (2 * Math.PI * k * n) / N
      val += spectrum[k].re * Math.cos(angle) - spectrum[k].im * Math.sin(angle)
    }
    result[n] = val
  }
  return result
}

export const dft2d = (imageData, width, height) => {
  const rows = []
  for (let y = 0; y < height; y++) {
    const row = new Float32Array(width)
    for (let x = 0; x < width; x++) {
      row[x] = imageData[y * width + x]
    }
    rows.push(dft1d(row))
  }

  const spectrum = []
  for (let kx = 0; kx < width; kx++) {
    const col = new Array(height).fill(0).map((_, ky) => ({
      re: rows[ky][kx].re,
      im: rows[ky][kx].im
    }))
    const colDft = dft1d(col.map((c) => c.re))
    for (let ky = 0; ky < height; ky++) {
      colDft[ky].im = dft1d(col.map((c) => c.im))[ky].re
      colDft[ky].mag = Math.sqrt(colDft[ky].re * colDft[ky].re + colDft[ky].im * colDft[ky].im)
    }
    spectrum.push(colDft)
  }

  const result = new Float32Array(width * height)
  const shiftWidth = width >> 1
  const shiftHeight = height >> 1

  for (let ky = 0; ky < height; ky++) {
    for (let kx = 0; kx < width; kx++) {
      const shiftedX = (kx + shiftWidth) % width
      const shiftedY = (ky + shiftHeight) % height
      const mag = spectrum[kx][ky].mag
      result[shiftedY * width + shiftedX] = mag
    }
  }

  return result
}

export const extractTopFrequencies = (spectrum, width, height, n = 8) => {
  const freqs = []
  const centerX = width >> 1
  const centerY = height >> 1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const dx = x - centerX
      const dy = y - centerY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 0) {
        freqs.push({ x: dx, y: dy, mag: spectrum[idx], dist })
      }
    }
  }

  freqs.sort((a, b) => b.mag - a.mag)
  return freqs.slice(0, n).map((f, i) => ({ ...f, rank: i + 1 }))
}

export const generateFourierFormula = (frequencies, width, height) => {
  const terms = frequencies.map((f) => {
    const kx = (f.x / width) * 2 * Math.PI
    const ky = (f.y / height) * 2 * Math.PI
    const amp = f.mag.toFixed(4)
    const phase = Math.atan2(f.y, f.x).toFixed(2)
    return `  ${amp} * sin(${kx.toFixed(3)}*x + ${ky.toFixed(3)}*y + ${phase})`
  })

  return `I(x, y) = ${terms.join('\n       + ')}`
}

export const renderFourierApproximation = (frequencies, width, height, time = 0) => {
  const out = new Float32Array(width * height)
  const maxR = Math.sqrt(width * width + height * height) / 2

  frequencies.forEach((f, idx) => {
    const kx = (f.x / width) * 2 * Math.PI
    const ky = (f.y / height) * 2 * Math.PI
    const amp = f.mag
    const phase = Math.atan2(f.y, f.x)
    const decay = Math.exp(-f.dist / maxR * 2)
    const timePhase = time * (idx + 1) * 0.5

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = (x / width - 0.5) * 2
        const ny = (y / height - 0.5) * 2
        const val = amp * decay * Math.sin(kx * nx + ky * ny + phase + timePhase)
        out[y * width + x] += val
      }
    }
  })

  const maxVal = Math.max(...out.map(Math.abs)) || 1
  for (let i = 0; i < out.length; i++) {
    out[i] = (out[i] / maxVal + 1) / 2
  }

  return out
}
