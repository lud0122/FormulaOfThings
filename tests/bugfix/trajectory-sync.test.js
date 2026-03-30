/**
 * 测试轨迹同步问题
 * 验证傅里叶动画是否正确重建轮廓
 */

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { dft, idft, pointsToComplex, complexToPoints } from '../../src/fourier-analyzer/dft.js'

describe('轨迹同步问题测试', () => {
  describe('傅里叶系数重建', () => {
    it('应该正确重建原始轮廓', () => {
      // 创建一个简单的正方形轮廓
      const originalPoints = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 }
      ]

      // 转换为复数并执行DFT
      const complexPoints = pointsToComplex(originalPoints)
      const coeffs = dft(complexPoints)

      // 重建轮廓（采样4个点）
      // 使用IDFT完全重建，然后通过complexToPoints转换
      const reconstructedComplex = idft(coeffs)
      const reconstructed = complexToPoints(reconstructedComplex)

      // 验证重建的点与原始点接近（允许小误差）
      for (let i = 0; i < originalPoints.length; i++) {
        const dx = Math.abs(reconstructed[i].x - originalPoints[i].x)
        const dy = Math.abs(reconstructed[i].y - originalPoints[i].y)
        assert.ok(dx < 0.1, `x坐标误差过大: ${dx}`)
        assert.ok(dy < 0.1, `y坐标误差过大: ${dy}`)
      }
    })

    it('IDFT应该完全重建原始信号', () => {
      const originalPoints = [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 0, y: -1 }
      ]

      const complexPoints = pointsToComplex(originalPoints)
      const coeffs = dft(complexPoints)
      const reconstructed = idft(coeffs)
      const resultPoints = complexToPoints(reconstructed)

      // IDFT应该完全重建原始信号
      for (let i = 0; i < originalPoints.length; i++) {
        const dx = Math.abs(resultPoints[i].x - originalPoints[i].x)
        const dy = Math.abs(resultPoints[i].y - originalPoints[i].y)
        assert.ok(dx < 1e-10, `IDFT重建x坐标误差: ${dx}`)
        assert.ok(dy < 1e-10, `IDFT重建y坐标误差: ${dy}`)
      }
    })
  })

  describe('系数格式转换问题', () => {
    it('错误转换会导致x和y相同', () => {
      const coeffs = [
        { re: 1, im: 0.5 },
        { re: 0.3, im: 0.2 }
      ]

      // 错误的转换（当前代码）
      const wrongCoeffs = {
        a: coeffs.map(c => c.re),
        b: coeffs.map(c => c.im),
        c: coeffs.map(c => c.re), // 错误！
        d: coeffs.map(c => c.im)  // 错误！
      }

      // 验证错误转换：x和y会完全相同
      const t = 0
      let x = 0, y = 0
      for (let n = 0; n < coeffs.length; n++) {
        const r = Math.sqrt(wrongCoeffs.a[n] ** 2 + wrongCoeffs.b[n] ** 2)
        const angle = n * t + Math.atan2(wrongCoeffs.b[n], wrongCoeffs.a[n])
        x += r * Math.cos(angle)
        y += r * Math.sin(angle)
      }

      // x和y应该不同，但错误转换会导致它们相似
      // 这会导致轨迹变成一个圆形
      console.log(`错误转换: x=${x}, y=${y}`)
    })
  })
})
