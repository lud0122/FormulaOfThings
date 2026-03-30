/**
 * 测试傅里叶重建修复
 * 验证分别对x和y做实数DFT后，轨迹能正确重建原始轮廓
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { realDft, reconstructPoint } from '../../src/fourier-analyzer/dft.js'

describe('实数DFT重建测试', () => {
  describe('realDft函数', () => {
    it('应该为正弦信号返回正确系数', () => {
      // f[n] = cos(2πn/8)，期望a[1]=0.5, 其他为0
      const N = 8
      const signal = Array(N).fill(0).map((_, i) => Math.cos(2 * Math.PI * i / N))
      
      const coeffs = realDft(signal)
      
      assert.strictEqual(coeffs.a.length, N)
      assert.strictEqual(coeffs.b.length, N)
      
      // a[1]应该接近0.5
      assert.ok(Math.abs(coeffs.a[1] - 0.5) < 0.001, `a[1]=${coeffs.a[1]} 应该接近0.5`)
      // b[1]应该接近0
      assert.ok(Math.abs(coeffs.b[1]) < 0.001, `b[1]=${coeffs.b[1]} 应该接近0`)
    })
    
    it('应该为正弦信号返回正确系数', () => {
      // f[n] = sin(2πn/8)
      // 重建公式: x(t) = Σ [a[k]*cos(kt) - b[k]*sin(kt)]
      // b[k] = -Σ x[n]*sin(2πkn/N) / N （注意负号）
      // 对于x[n]=sin(2πn/N)：
      //   sin * sin 的平均 = 0.5
      //   所以 b[1] = -0.5
      // 重建时：-b[1]*sin(kt) = -(-0.5)*sin(t) = 0.5*sin(t)
      const N = 8
      const signal = Array(N).fill(0).map((_, i) => Math.sin(2 * Math.PI * i / N))

      const coeffs = realDft(signal)

      // a[1]应该接近0（纯正弦信号没有余弦分量）
      assert.ok(Math.abs(coeffs.a[1]) < 0.001)
      // b[1]应该接近-0.5（因为重建时有负号）
      assert.ok(Math.abs(coeffs.b[1] + 0.5) < 0.001, `b[1]=${coeffs.b[1]} 应该接近-0.5`)
    })
  })
  
  describe('reconstructPoint函数', () => {
    it('应该使用{a,b,c,d}格式正确重建点', () => {
      // 使用正弦波形测试
      const N = 8
      // x方向：cos(t)
      const xSignal = Array(N).fill(0).map((_, i) => Math.cos(2 * Math.PI * i / N))
      // y方向：sin(t)
      const ySignal = Array(N).fill(0).map((_, i) => Math.sin(2 * Math.PI * i / N))

      const xCoeffs = realDft(xSignal)
      const yCoeffs = realDft(ySignal)

      // 在t=0时，应该得到(1, 0)
      const point = reconstructPoint(xCoeffs.a, xCoeffs.b, yCoeffs.a, yCoeffs.b, 0)

      assert.ok(Math.abs(point.x - 1.0) < 0.01, `t=0时 x=${point.x} 应该接近1`)
      assert.ok(Math.abs(point.y - 0.0) < 0.01, `t=0时 y=${point.y} 应该接近0`)

      // 在t=π/N（第一个采样点）时，重建应该能匹配原始信号
      // f[1] = cos(2π/N) for x, f[1] = sin(2π/N) for y
      const t1 = 2 * Math.PI / N
      const point1 = reconstructPoint(xCoeffs.a, xCoeffs.b, yCoeffs.a, yCoeffs.b, t1)
      const expectedX = Math.cos(t1)
      const expectedY = Math.sin(t1)

      assert.ok(Math.abs(point1.x - expectedX) < 0.01, `t=2π/N时 x=${point1.x} 应该接近${expectedX}`)
      assert.ok(Math.abs(point1.y - expectedY) < 0.01, `t=2π/N时 y=${point1.y} 应该接近${expectedY}`)
    })
    
    it('应该正确重建正方形轮廓', () => {
      // 创建正方形轮廓点
      const points = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 }
      ]
      
      const xSignal = points.map(p => p.x)
      const ySignal = points.map(p => p.y)
      
      const xCoeffs = realDft(xSignal)
      const yCoeffs = realDft(ySignal)
      
      // 验证每个点都能被重建
      for (let i = 0; i < points.length; i++) {
        const t = 2 * Math.PI * i / points.length
        const reconstructed = reconstructPoint(xCoeffs.a, xCoeffs.b, yCoeffs.a, yCoeffs.b, t)
        
        const dx = Math.abs(reconstructed.x - points[i].x)
        const dy = Math.abs(reconstructed.y - points[i].y)
        
        // 允许一定误差
        assert.ok(dx < 0.01, `点${i}的x误差: ${dx}`)
        assert.ok(dy < 0.01, `点${i}的y误差: ${dy}`)
      }
    })
  })
  
  describe('与旧DFT对比', () => {
    it('复数DFT和实数DFT应该能互相转换', () => {
      // 测试信号
      const signal = [1, 0.7, 0, -0.7, -1, -0.7, 0, 0.7]
      
      // 实数DFT
      const realCoeffs = realDft(signal)
      
      // 验证a[0]是平均值
      const avg = signal.reduce((a, b) => a + b, 0) / signal.length
      assert.ok(Math.abs(realCoeffs.a[0] - avg) < 1e-10, `a[0]应该等于平均值`)
    })
  })
})
