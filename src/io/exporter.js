export const exportCanvasToPng = (canvas, filename = 'formula-output.png') => {
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = filename
  link.click()
}

export const exportParams = (params, filename = 'params.json') => {
  const blob = new Blob([JSON.stringify(params, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const importParamsFromFile = async (file) => {
  const text = await file.text()
  const parsed = JSON.parse(text)
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid params file')
  }
  return parsed
}
