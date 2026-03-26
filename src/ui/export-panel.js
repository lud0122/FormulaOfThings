/**
 * Export Panel Module
 * Provides export functionality for JSON, CSV, and PNG
 */

export const generateTimestamp = () => {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

export const createCSVString = (data) => {
  if (data.length === 0) {
    return 'n,amplitude,phase,energy\n'
  }

  // Get headers from first object
  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]

  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header]
      // Escape quotes and wrap in quotes if contains special characters
      const strValue = String(value)
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`
      }
      return strValue
    })
    csvRows.push(values.join(','))
  })

  return csvRows.join('\n')
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const renderExportPanel = () => {
  const container = document.createElement('div')
  container.className = 'export-panel'

  // Create JSON export button
  const jsonButton = document.createElement('button')
  jsonButton.className = 'export-btn json-btn'
  jsonButton.textContent = 'Export JSON'
  jsonButton.setAttribute('aria-label', 'Export data as JSON file')
  jsonButton.addEventListener('click', () => {
    // Placeholder - actual implementation will wire up with data
    console.log('JSON export clicked')
  })
  container.appendChild(jsonButton)

  // Create CSV export button
  const csvButton = document.createElement('button')
  csvButton.className = 'export-btn csv-btn'
  csvButton.textContent = 'Export CSV'
  csvButton.setAttribute('aria-label', 'Export data as CSV file')
  csvButton.addEventListener('click', () => {
    // Placeholder - actual implementation will wire up with data
    console.log('CSV export clicked')
  })
  container.appendChild(csvButton)

  // Create PNG snapshot button
  const pngButton = document.createElement('button')
  pngButton.className = 'export-btn png-btn'
  pngButton.textContent = 'Save PNG Snapshot'
  pngButton.setAttribute('aria-label', 'Save canvas as PNG image')
  pngButton.addEventListener('click', () => {
    // Placeholder - actual implementation will wire up with canvas
    console.log('PNG export clicked')
  })
  container.appendChild(pngButton)

  return container
}

export const exportToJSON = (data, filename) => {
  const finalFilename = filename || `fourier-coeffs-${generateTimestamp()}.json`
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })

  return {
    blob,
    filename: finalFilename,
    download: () => downloadBlob(blob, finalFilename)
  }
}

export const exportToCSV = (data, filename) => {
  const finalFilename = filename || `fourier-coeffs-${generateTimestamp()}.csv`
  const csvString = createCSVString(data)
  const blob = new Blob([csvString], { type: 'text/csv' })

  return {
    blob,
    filename: finalFilename,
    download: () => downloadBlob(blob, finalFilename)
  }
}

export const snapshotToPNG = (canvas, filename) => {
  const finalFilename = filename || `fourier-epicycle-${generateTimestamp()}.png`

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve({
        blob,
        filename: finalFilename,
        download: () => downloadBlob(blob, finalFilename)
      })
    }, 'image/png')
  })
}
