const toGray = (imageData) => {
  const { data, width, height } = imageData
  const gray = new Float32Array(width * height)
  for (let i = 0; i < width * height; i += 1) {
    const idx = i * 4
    gray[i] = (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) / 255
  }
  return { gray, width, height }
}

export const loadReferenceImageData = async (src) => {
  const image = new Image()
  image.decoding = 'async'
  image.src = src

  await new Promise((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error(`Failed to load reference image: ${src}`))
  })

  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas2D context unavailable while loading reference')
  ctx.drawImage(image, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  return { imageData, ...toGray(imageData) }
}
