/**
 * 集成测试：验证上传功能修复
 * 测试JavaScript模块导入是否正确
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Upload Integration Fix', () => {
  describe('Module Import Validation', () => {
    it('should not have import errors in fourier-main.js', async () => {
      // 读取 fourier-main.js 源码
      const mainPath = resolve(process.cwd(), 'src/app/fourier-main.js')
      const mainCode = readFileSync(mainPath, 'utf-8')

      // 检查是否还有错误的导入
      const hasWrongImport = mainCode.includes(
        "import { selectTermCount, calculateEnergyRatio } from '../fourier-analyzer/adaptive-selector.js'"
      )

      assert.strictEqual(hasWrongImport, false,
        'fourier-main.js should not import calculateEnergyRatio from adaptive-selector.js'
      )
    })

    it('should only import existing exports from adaptive-selector.js', async () => {
      // 读取 adaptive-selector.js 源码
      const selectorPath = resolve(process.cwd(), 'src/fourier-analyzer/adaptive-selector.js')
      const selectorCode = readFileSync(selectorPath, 'utf-8')

      // 提取所有导出的函数名
      const exportMatches = selectorCode.matchAll(/export\s+function\s+(\w+)/g)
      const exports = Array.from(exportMatches, m => m[1])

      // 确认只有 selectTermCount 被导出
      assert.ok(exports.includes('selectTermCount'),
        'adaptive-selector.js should export selectTermCount')

      assert.ok(!exports.includes('calculateEnergyRatio'),
        "adaptive-selector.js should NOT export calculateEnergyRatio (it's in dft.js)"
      )
    })
  })
})
