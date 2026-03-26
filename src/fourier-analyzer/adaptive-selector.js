/**
 * 自适应项数选择器
 * 根据能量占比自动选择最优傅里叶项数
 */

/**
 * 根据能量占比选择傅里叶项数
 * @param {Object} coeffs - 傅里叶系数 {a, b, c, d}
 * @param {number} energyThreshold - 能量阈值（默认0.95）
 * @returns {Object} 选择结果 {termCount, energyRatio, selectedIndices, energies}
 */
export function selectTermCount(coeffs, energyThreshold = 0.95) {
  // 输入验证：检查系数完整性
  if (!coeffs.a || !coeffs.b || !coeffs.c || !coeffs.d) {
    throw new Error('INVALID_COEFFICIENTS: 傅里叶系数不完整');
  }

  const N = coeffs.a.length;

  // 输入验证：检查系数非空
  if (N === 0) {
    throw new Error('EMPTY_COEFFICIENTS: 傅里叶系数为空');
  }

  // 输入验证：检查最小系数数量
  if (N < 3) {
    throw new Error('INSUFFICIENT_COEFFICIENTS: 傅里叶系数数量不足（<3）');
  }

  // 计算每个频率分量的能量
  const energies = [];
  for (let k = 0; k < N; k++) {
    // 验证系数有效性
    if (!Number.isFinite(coeffs.a[k]) || !Number.isFinite(coeffs.b[k]) ||
        !Number.isFinite(coeffs.c[k]) || !Number.isFinite(coeffs.d[k])) {
      throw new Error(`INVALID_COEFFICIENT: 索引${k}存在NaN或Infinity`);
    }

    const energyX = coeffs.a[k] ** 2 + coeffs.b[k] ** 2;
    const energyY = coeffs.c[k] ** 2 + coeffs.d[k] ** 2;
    energies.push({ k, energy: energyX + energyY });
  }

  // 按能量降序排序（关键！）
  energies.sort((a, b) => b.energy - a.energy);

  // 计算总能量
  const totalEnergy = energies.reduce((sum, e) => sum + e.energy, 0);

  // 输入验证：检查总能量非零
  if (totalEnergy === 0) {
    throw new Error('ZERO_TOTAL_ENERGY: 总能量为零');
  }

  // 从最大能量开始累加，直到达到阈值
  let cumulativeEnergy = 0;
  const selectedIndices = [];

  for (const item of energies) {
    cumulativeEnergy += item.energy;
    selectedIndices.push(item.k);
    const ratio = cumulativeEnergy / totalEnergy;

    if (ratio >= energyThreshold) {
      // 按频率索引排序，保持低频在前
      selectedIndices.sort((a, b) => a - b);

      return {
        termCount: selectedIndices.length,
        energyRatio: ratio,
        selectedIndices,
        energies: energies.slice(0, selectedIndices.length).map(e => ({
          index: e.k,
          energy: e.energy,
          energyRatio: e.energy / totalEnergy
        }))
      };
    }
  }

  // 达到最大项数仍未满足阈值
  return {
    termCount: N,
    energyRatio: 1.0,
    selectedIndices: Array.from({ length: N }, (_, i) => i),
    energies: energies.map(e => ({
      index: e.k,
      energy: e.energy,
      energyRatio: e.energy / totalEnergy
    }))
  };
}
