/**
 * @file bug.coefficient-format.test.js
 * 重现系数格式不匹配的bug
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'

import { dft, pointsToComplex } from '../src/fourier-analyzer/dft.js'
import { selectTermCount } from '../src/fourier-analyzer/adaptive-selector.js'

describe('Bug: Coefficient Format Mismatch', () => {
	it('should fail when passing Complex[] to selectTermCount', () => {
		// 创建测试轮廓 - 圆形
		const contour = []
		for (let i = 0; i < 32; i++) {
			const angle = 2 * Math.PI * i / 32
			contour.push({ x: Math.cos(angle), y: Math.sin(angle) })
		}

		// DFT变换 - 返回 Complex[]
		const complexPts = pointsToComplex(contour)
		const coeffs = dft(complexPts)

		// 错误的调用方式：直接传递 Complex[]
		assert.throws(() => {
			selectTermCount(coeffs, 0.95)
		}, /INVALID_COEFFICIENTS/)
	})

	it('should succeed when converting Complex[] to {a,b,c,d} format', () => {
		// 创建测试轮廓 - 圆形
		const contour = []
		for (let i = 0; i < 32; i++) {
			const angle = 2 * Math.PI * i / 32
			contour.push({ x: Math.cos(angle), y: Math.sin(angle) })
		}

		// DFT变换 - 返回 Complex[]
		const complexPts = pointsToComplex(contour)
		const coeffs = dft(complexPts)

		// 正确的调用方式：转换为 {a,b,c,d} 格式
		const coeffsObj = {
			a: coeffs.map(c => c.re),
			b: coeffs.map(c => c.im),
			c: coeffs.map(c => c.re),
			d: coeffs.map(c => c.im)
		}

		const selection = selectTermCount(coeffsObj, 0.95)
		assert.ok(selection.termCount > 0)
		assert.ok(selection.energyRatio >= 0)
		assert.ok(Array.isArray(selection.selectedIndices))
	})
})
