# 傅里叶轮廓重建问题修复方案

## 问题描述

当前傅里叶动画轨迹完全偏离原始轮廓，画出来的形状与原始轮廓完全不同。

## 根本原因

**输入数据转换方式错误**。

当前代码将轮廓点当作一维复数信号做DFT：
- 输入：`z[n] = x[n] + i*y[n]`
- DFT结果：`C[k]` 是复数系数

但轮圆渲染器期望的系数格式是独立的x和y正弦/余弦展开：
```
x(t) = Σ [a[n]*cos(n*t) - b[n]*sin(n*t)]
y(t) = Σ [c[n]*cos(n*t) - d[n]*sin(n*t)]
```

当直接把复数DFT系数映射为{a: C[k].re, b: C[k].im}时：
- x和y分量使用了相同的正弦/余弦权重
- 导致轨迹严重扭曲

## 修复方案

将**复数DFT**改为**分别对x和y坐标做独立的实数DFT**。

实数信号的傅里叶级数展开：
- x[n] = a0 + Σ [a[k]*cos(2πkn/N) + b[k]*sin(2πkn/N)]
- y[n] = c0 + Σ [c[k]*cos(2πkn/N) + d[k]*sin(2πkn/N)]

其中：
```javascript
a[k] = Σ x[n] * cos(2πkn/N) / N
b[k] = -Σ x[n] * sin(2πkn/N) / N
c[k] = Σ y[n] * cos(2πkn/N) / N
d[k] = -Σ y[n] * sin(2πkn/N) / N
```

**重建公式（与轮圆渲染器一致）**：
```javascript
x(t) = Σ [a[k]*cos(k*t) - b[k]*sin(k*t)]
y(t) = Σ [c[k]*cos(k*t) - d[k]*sin(k*t)]
```

## 代码修改

### 修改文件：`src/app/fourier-main.js`

**当前（错误）：**
```javascript
const complexPoints = pointsToComplex(normalizedPoints)
const coeffs = dft(complexPoints)
const coeffsObj = {
  a: coeffs.map(c => c.re),
  b: coeffs.map(c => c.im)
}
```

**修复后：**
```javascript
// 分别对x和y坐标做DFT
const xCoeffs = realDft(normalizedPoints.map(p => p.x))
const yCoeffs = realDft(normalizedPoints.map(p => p.y))

const coeffsObj = {
  a: xCoeffs.a,  // x的余弦系数
  b: xCoeffs.b,  // x的正弦系数
  c: yCoeffs.a,  // y的余弦系数
  d: yCoeffs.b   // y的正弦系数
}
```

### 新增函数：`realDft`

在 `src/fourier-analyzer/dft.js` 中添加：
```javascript
/**
 * 对实数信号做DFT
 * 返回 {a, b} 其中 a是余弦系数, b是正弦系数
 */
export function realDft(signal) {
  const N = signal.length
  const a = new Array(N).fill(0)
  const b = new Array(N).fill(0)

  for (let k = 0; k < N; k++) {
    let sumCos = 0
    let sumSin = 0
    for (let n = 0; n < N; n++) {
      const angle = 2 * Math.PI * k * n / N
      sumCos += signal[n] * Math.cos(angle)
      sumSin += signal[n] * Math.sin(angle)
    }
    a[k] = sumCos / N
    b[k] = -sumSin / N
  }

  return { a, b }
}
```

## 验证

修复后的动画应该：
1. 轨迹与原始轮廓重合
2. 第一眼就能看出轮廓形状
3. 轮廓点越多，细节越清晰

## 风险

- 自适应选择器需要调整，以处理4组系数
- 公式生成器需要确认格式兼容性
- 需要更新测试用例
