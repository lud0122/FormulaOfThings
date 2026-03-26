import test from 'node:test'
import assert from 'node:assert/strict'
import { formatNumber, formatPercent, sortData, calculateTotalEnergy, isHighEnergy } from '../../src/ui/parameter-table.js'

test('formatNumber limits decimal places', () => {
  assert.equal(formatNumber(0), '0')
  assert.equal(formatNumber(0.123456789), '0.123')
  assert.equal(formatNumber(1.23456789), '1.235')
})

test('formatNumber handles zero', () => {
  assert.equal(formatNumber(0), '0')
})

test('formatPercent converts decimal to percentage string', () => {
  assert.equal(formatPercent(0.25), '25%')
  assert.equal(formatPercent(0.5), '50%')
  assert.equal(formatPercent(0.15), '15%')
})

test('sortData sorts by specified key ascending', () => {
  const data = [
    { n: 3, amplitude: 0.1 },
    { n: 1, amplitude: 0.5 },
    { n: 2, amplitude: 0.3 }
  ]
  const sorted = sortData([...data], 'n', true)
  assert.equal(sorted[0].n, 1)
  assert.equal(sorted[1].n, 2)
  assert.equal(sorted[2].n, 3)
})

test('sortData sorts by specified key descending', () => {
  const data = [
    { n: 3, amplitude: 0.1 },
    { n: 1, amplitude: 0.5 },
    { n: 2, amplitude: 0.3 }
  ]
  const sorted = sortData([...data], 'n', false)
  assert.equal(sorted[0].n, 3)
  assert.equal(sorted[1].n, 2)
  assert.equal(sorted[2].n, 1)
})

test('sortData sorts by amplitude', () => {
  const data = [
    { n: 1, amplitude: 0.3 },
    { n: 2, amplitude: 0.5 },
    { n: 3, amplitude: 0.1 }
  ]
  const sorted = sortData([...data], 'amplitude', true)
  assert.equal(sorted[0].amplitude, 0.1)
  assert.equal(sorted[1].amplitude, 0.3)
  assert.equal(sorted[2].amplitude, 0.5)
})

test('calculateTotalEnergy sums energy values', () => {
  const data = [
    { n: 1, amplitude: 0.5, phase: 0, energy: 0.25 },
    { n: 2, amplitude: 0.5, phase: 0, energy: 0.25 }
  ]
  assert.equal(calculateTotalEnergy(data), 0.5)
})

test('calculateTotalEnergy returns 0 for empty data', () => {
  assert.equal(calculateTotalEnergy([]), 0)
})

test('isHighEnergy returns true for energy > 10%', () => {
  assert.equal(isHighEnergy(0.15), true)
  assert.equal(isHighEnergy(0.11), true)
})

test('isHighEnergy returns false for energy <= 10%', () => {
  assert.equal(isHighEnergy(0.10), false)
  assert.equal(isHighEnergy(0.05), false)
  assert.equal(isHighEnergy(0), false)
})
