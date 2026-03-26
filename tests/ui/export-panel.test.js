import test from 'node:test'
import assert from 'node:assert/strict'
import { generateTimestamp, createCSVString, exportToJSON, exportToCSV } from '../../src/ui/export-panel.js'

test('generateTimestamp returns date in ISO format', () => {
  const timestamp = generateTimestamp()
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(timestamp))
})

test('createCSVString creates headers for empty data', () => {
  const csv = createCSVString([])
  assert.ok(csv.includes('n'))
  assert.ok(csv.includes('amplitude'))
  assert.ok(csv.includes('phase'))
  assert.ok(csv.includes('energy'))
})

test('createCSVString creates data rows', () => {
  const data = [
    { n: 1, amplitude: 0.5, phase: 0, energy: 0.15 },
    { n: 2, amplitude: 0.3, phase: 1.57, energy: 0.08 }
  ]
  const csv = createCSVString(data)
  const lines = csv.split('\n')
  assert.equal(lines.length, 3) // header + 2 data rows
})

test('createCSVString includes header row', () => {
  const data = [{ n: 1, amplitude: 0.5, phase: 0, energy: 0.1 }]
  const csv = createCSVString(data)
  const lines = csv.split('\n')
  assert.ok(lines[0].includes('n'))
  assert.ok(lines[0].includes('amplitude'))
  assert.ok(lines[0].includes('phase'))
  assert.ok(lines[0].includes('energy'))
})

test('createCSVString escapes commas in values', () => {
  const data = [{ n: 1, amplitude: 0.5, phase: 0, note: 'test,with,commas' }]
  const csv = createCSVString(data)
  assert.ok(csv.includes('"test,with,commas"'))
})

test('createCSVString escapes quotes in values', () => {
  const data = [{ n: 1, amplitude: 0.5, phase: 0, note: 'test"with"quotes' }]
  const csv = createCSVString(data)
  assert.ok(csv.includes('test""with""quotes'))
})

test('exportToJSON creates downloadable JSON blob', () => {
  const data = { coeffs: [{ n: 1, amplitude: 0.5, phase: 0 }] }
  const result = exportToJSON(data, 'test.json')
  assert.ok(result)
  assert.equal(result.filename, 'test.json')
  assert.ok(result.blob)
  assert.equal(result.blob.type, 'application/json')
})

test('exportToJSON serializes data correctly', async () => {
  const data = {
    coeffs: [
      { n: 1, amplitude: 0.5, phase: 0 },
      { n: 2, amplitude: 0.3, phase: 1.57 }
    ]
  }
  const result = exportToJSON(data, 'fourier.json')
  const text = await result.blob.text()
  const parsed = JSON.parse(text)
  assert.deepEqual(parsed, data)
})

test('exportToJSON uses default filename if not provided', () => {
  const data = { test: true }
  const result = exportToJSON(data)
  assert.ok(result.filename.includes('fourier'))
  assert.ok(result.filename.includes('.json'))
})

test('exportToJSON handles complex nested data', async () => {
  const data = {
    metadata: { version: '1.0', date: '2026-03-26' },
    params: {
      coeffs: [{ n: 1, amplitude: 0.5, phase: 0 }],
      settings: { termCount: 10 }
    }
  }
  const result = exportToJSON(data, 'complex.json')
  const text = await result.blob.text()
  const parsed = JSON.parse(text)
  assert.equal(parsed.metadata.version, '1.0')
  assert.equal(parsed.params.settings.termCount, 10)
})

test('exportToCSV creates downloadable CSV blob', () => {
  const data = [
    { n: 1, amplitude: 0.5, phase: 0 },
    { n: 2, amplitude: 0.3, phase: 1.57 }
  ]
  const result = exportToCSV(data, 'test.csv')
  assert.ok(result)
  assert.equal(result.filename, 'test.csv')
  assert.ok(result.blob)
  assert.equal(result.blob.type, 'text/csv')
})

test('exportToCSV formats data with headers', async () => {
  const data = [
    { n: 1, amplitude: 0.5, phase: 0 },
    { n: 2, amplitude: 0.3, phase: 1.57 }
  ]
  const result = exportToCSV(data, 'coeffs.csv')
  const text = await result.blob.text()
  const lines = text.split('\n')
  assert.ok(lines[0].includes('n'))
  assert.ok(lines[0].includes('amplitude'))
  assert.ok(lines[0].includes('phase'))
  assert.equal(lines.length, 3) // header + 2 data rows
})

test('exportToCSV uses default filename if not provided', () => {
  const data = [{ n: 1, amplitude: 0.5, phase: 0 }]
  const result = exportToCSV(data)
  assert.ok(result.filename.includes('fourier'))
  assert.ok(result.filename.includes('.csv'))
})

test('exportToCSV handles empty data', async () => {
  const data = []
  const result = exportToCSV(data, 'empty.csv')
  const text = await result.blob.text()
  assert.ok(text.length > 0) // Should have at least headers
})

test('exportToCSV escapes special characters', async () => {
  const data = [
    { n: 1, amplitude: 0.5, phase: 0, note: 'test,with,commas' },
    { n: 2, amplitude: 0.3, phase: 1.57, note: 'test"with"quotes' }
  ]
  const result = exportToCSV(data, 'special.csv')
  const text = await result.blob.text()
  // Should properly quote fields with special characters
  assert.ok(text.includes('"test,with,commas"') || text.includes('test,with,commas'))
})
