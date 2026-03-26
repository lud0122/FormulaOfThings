import test from 'node:test'
import assert from 'node:assert/strict'
import { toSubscript, formatNumber, createTermHTML, buildFormulaHTML } from '../../src/ui/formula-display.js'

test('toSubscript converts digits to Unicode subscripts', () => {
  assert.equal(toSubscript(0), '₀')
  assert.equal(toSubscript(1), '₁')
  assert.equal(toSubscript(5), '₅')
  assert.equal(toSubscript(10), '₁₀')
  assert.equal(toSubscript(123), '₁₂₃')
})

test('formatNumber limits decimal places', () => {
  assert.equal(formatNumber(0), '0')
  assert.equal(formatNumber(0.123456789), '0.123')
  assert.equal(formatNumber(0.999999), '1')
  assert.equal(formatNumber(1.23456789), '1.235')
})

test('formatNumber handles zero', () => {
  assert.equal(formatNumber(0), '0')
  assert.equal(formatNumber(0.0001), '0')
})

test('createTermHTML generates term with amplitude', () => {
  const coeff = { n: 1, amplitude: 0.5, phase: 0 }
  const html = createTermHTML(coeff, 0)
  assert.ok(html.includes('0.5'))
  assert.ok(html.includes('class="amplitude"'))
})

test('createTermHTML generates term with harmonic subscript', () => {
  const coeff = { n: 5, amplitude: 0.5, phase: 0 }
  const html = createTermHTML(coeff, 0)
  assert.ok(html.includes('₅'))
  assert.ok(html.includes('class="harmonic"'))
})

test('createTermHTML includes phase when non-zero', () => {
  const coeff = { n: 1, amplitude: 0.5, phase: 1.57 }
  const html = createTermHTML(coeff, 0)
  assert.ok(html.includes('1.57'))
  assert.ok(html.includes('class="phase"'))
})

test('createTermHTML omits phase when zero', () => {
  const coeff = { n: 1, amplitude: 0.5, phase: 0 }
  const html = createTermHTML(coeff, 0)
  assert.ok(!html.includes('class="phase"'))
})

test('createTermHTML uses correct structure', () => {
  const coeff = { n: 1, amplitude: 0.5, phase: 0 }
  const html = createTermHTML(coeff, 0)
  assert.ok(html.includes('class="term"'))
  assert.ok(html.includes('class="operator"'))
  assert.ok(html.includes('class="function"'))
  assert.ok(html.includes('cos'))
})

test('buildFormulaHTML generates empty formula for zero terms', () => {
  const html = buildFormulaHTML([], 0)
  assert.ok(html.includes('f(t)'))
  assert.ok(html.includes('class="zero"'))
})

test('buildFormulaHTML generates single term formula', () => {
  const coeffs = [{ n: 1, amplitude: 0.5, phase: 0 }]
  const html = buildFormulaHTML(coeffs, 1)
  assert.ok(html.includes('f(t)'))
  assert.ok(html.includes('0.5'))
  assert.ok(!html.includes('class="operator"> + </span>')) // No plus sign for first term
})

test('buildFormulaHTML generates multiple terms with separators', () => {
  const coeffs = [
    { n: 1, amplitude: 0.5, phase: 0 },
    { n: 2, amplitude: 0.3, phase: 0 }
  ]
  const html = buildFormulaHTML(coeffs, 2)
  assert.ok(html.includes('class="operator"> + </span>'))
})

test('buildFormulaHTML respects termCount limit', () => {
  const coeffs = [
    { n: 1, amplitude: 0.5, phase: 0 },
    { n: 2, amplitude: 0.3, phase: 0 },
    { n: 3, amplitude: 0.1, phase: 0 },
    { n: 4, amplitude: 0.05, phase: 0 }
  ]
  const html = buildFormulaHTML(coeffs, 2)
  // Count occurrences of amplitude class (should be 2)
  const matches = html.match(/class="amplitude"/g)
  assert.equal(matches.length, 2)
})

test('buildFormulaHTML formats numbers with limited decimals', () => {
  const coeffs = [{ n: 1, amplitude: 0.123456789, phase: 0.987654321 }]
  const html = buildFormulaHTML(coeffs, 1)
  assert.ok(!html.includes('0.123456789'))
  assert.ok(!html.includes('0.987654321'))
})

test('buildFormulaHTML creates equation wrapper', () => {
  const html = buildFormulaHTML([], 0)
  assert.ok(html.includes('class="equation"'))
})
