import { describe, it } from 'node:test';
import assert from 'node:assert';
import { selectTermCount } from '../../src/fourier-analyzer/adaptive-selector.js';

describe('adaptive-selector', () => {
  describe('输入验证', () => {
    it('应该拒绝空系数', () => {
      const coeffs = { a: [], b: [], c: [], d: [] };
      assert.throws(
        () => selectTermCount(coeffs),
        { message: 'EMPTY_COEFFICIENTS: 傅里叶系数为空' }
      );
    });

    it('应该拒绝不完整的系数', () => {
      const coeffs = { a: [1, 2], b: [3, 4] };
      assert.throws(
        () => selectTermCount(coeffs),
        { message: 'INVALID_COEFFICIENTS: 傅里叶系数不完整' }
      );
    });

    it('应该拒绝数量不足的系数', () => {
      const coeffs = { a: [1], b: [2], c: [3], d: [4] };
      assert.throws(
        () => selectTermCount(coeffs),
        { message: 'INSUFFICIENT_COEFFICIENTS: 傅里叶系数数量不足（<3）' }
      );
    });

    it('应该拒绝包含NaN的系数', () => {
      const coeffs = {
        a: [1, NaN, 3],
        b: [1, 2, 3],
        c: [1, 2, 3],
        d: [1, 2, 3]
      };
      assert.throws(
        () => selectTermCount(coeffs),
        { message: 'INVALID_COEFFICIENT: 索引1存在NaN或Infinity' }
      );
    });

    it('应该拒绝包含Infinity的系数', () => {
      const coeffs = {
        a: [1, Infinity, 3],
        b: [1, 2, 3],
        c: [1, 2, 3],
        d: [1, 2, 3]
      };
      assert.throws(
        () => selectTermCount(coeffs),
        { message: 'INVALID_COEFFICIENT: 索引1存在NaN或Infinity' }
      );
    });

    it('应该拒绝总能量为零的系数', () => {
      const coeffs = {
        a: [0, 0, 0],
        b: [0, 0, 0],
        c: [0, 0, 0],
        d: [0, 0, 0]
      };
      assert.throws(
        () => selectTermCount(coeffs),
        { message: 'ZERO_TOTAL_ENERGY: 总能量为零' }
      );
    });
  });

  describe('正常选择', () => {
    it('应该按能量降序选择（不按索引顺序）', () => {
      // 构造一个能量集中在中间频率的例子
      const coeffs = {
        a: [1, 0, 10, 0, 1],  // 能量: 1^2+1^2=2, 0+0=0, 10^2+0=100, 0+0=0, 1^2+1^2=2
        b: [1, 0, 0, 0, 1],
        c: [1, 0, 0, 0, 1],
        d: [1, 0, 0, 0, 1]
      };
      const result = selectTermCount(coeffs, 0.95);

      assert.ok(result.termCount >= 1);
      assert.ok(result.termCount <= 5);
      assert.ok(result.energyRatio >= 0.95);
      assert.ok(Array.isArray(result.selectedIndices));
      assert.ok(Array.isArray(result.energies));

      // 检查selectedIndices是否已排序
      const sorted = [...result.selectedIndices].sort((a, b) => a - b);
      assert.deepStrictEqual(result.selectedIndices, sorted);
    });

    it('应该返回正确的能量信息', () => {
      const coeffs = {
        a: [3, 0, 0],  // 能量: 3^2+3^2=18
        b: [3, 0, 0],
        c: [3, 0, 0],  // 能量: 3^2+3^2=18
        d: [3, 0, 0]
      };

      const result = selectTermCount(coeffs, 0.9);

      assert.strictEqual(result.termCount, 1);
      assert.ok(result.energyRatio >= 0.9);
      assert.deepStrictEqual(result.selectedIndices, [0]);
      assert.strictEqual(result.energies.length, 1);
      assert.strictEqual(result.energies[0].index, 0);
      assert.strictEqual(result.energies[0].energy, 36);  // 18+18
      assert.ok(result.energies[0].energyRatio >= 0.9);
    });

    it('应该处理能量分布均匀的情况', () => {
      const coeffs = {
        a: [1, 1, 1, 1, 1],
        b: [1, 1, 1, 1, 1],
        c: [1, 1, 1, 1, 1],
        d: [1, 1, 1, 1, 1]
      };

      const result = selectTermCount(coeffs, 0.95);

      assert.ok(result.termCount >= 4);  // 需要大部分项才能达到95%
      assert.ok(result.energyRatio >= 0.95);
      assert.strictEqual(result.selectedIndices.length, result.termCount);
    });

    it('应该处理低阈值（选择较少项）', () => {
      const coeffs = {
        a: [10, 1, 1, 1, 1],  // 能量集中在第0项
        b: [10, 1, 1, 1, 1],
        c: [10, 1, 1, 1, 1],
        d: [10, 1, 1, 1, 1]
      };

      const result = selectTermCount(coeffs, 0.8);

      assert.ok(result.termCount < 5);
      assert.ok(result.energyRatio >= 0.8);
    });

    it('应该处理高阈值（选择较多项）', () => {
      const coeffs = {
        a: [10, 1, 1, 1, 1],
        b: [10, 1, 1, 1, 1],
        c: [10, 1, 1, 1, 1],
        d: [10, 1, 1, 1, 1]
      };

      const result = selectTermCount(coeffs, 0.99);

      assert.ok(result.termCount > 1);
      assert.ok(result.energyRatio >= 0.99);
    });

    it('应该正确计算能量', () => {
      const coeffs = {
        a: [3, 0, 0],  // energyX: 3^2+0^2 = 9
        b: [0, 0, 0],
        c: [0, 0, 0],  // energyY: 0^2+0^2 = 0
        d: [0, 0, 0]
      };
      // 第0项总能量: 9 + 0 = 9

      const result = selectTermCount(coeffs, 0.95);

      // 第一个项应该被选中
      assert.ok(result.selectedIndices.includes(0));
      assert.strictEqual(result.energies[0].energy, 9);
    });
  });

  describe('边界情况', () => {
    it('应该处理刚好达到阈值的情况', () => {
      // 构造一个能量分布使得某项刚好达到阈值
      const coeffs = {
        a: [2, 1, 1],
        b: [2, 1, 1],
        c: [2, 1, 1],
        d: [2, 1, 1]
      };

      const result = selectTermCount(coeffs, 0.8);
      assert.ok(result.energyRatio >= 0.8);
    });

    it('应该在无法达到阈值时返回所有项', () => {
      const coeffs = {
        a: [1, 1, 1],
        b: [1, 1, 1],
        c: [1, 1, 1],
        d: [1, 1, 1]
      };

      const result = selectTermCount(coeffs, 1.0);
      assert.strictEqual(result.termCount, 3);
      assert.strictEqual(result.energyRatio, 1.0);
      assert.deepStrictEqual(result.selectedIndices, [0, 1, 2]);
    });

    it('应该处理默认阈值0.95', () => {
      const coeffs = {
        a: [5, 3, 1],
        b: [5, 3, 1],
        c: [5, 3, 1],
        d: [5, 3, 1]
      };

      const result = selectTermCount(coeffs);  // 使用默认阈值
      assert.ok(result.energyRatio >= 0.95);
    });
  });
});
