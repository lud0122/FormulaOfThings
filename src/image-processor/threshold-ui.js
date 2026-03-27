/**
 * 阈值调节UI逻辑
 * 用于Canny边缘检测的双阈值参数调整
 */

/**
 * 阈值配置模式
 */
export const thresholdSchema = {
  lowThreshold: {
    min: 0,
    max: 255,
    step: 1,
    default: 50,
    label: '低阈值'
  },
  highThreshold: {
    min: 0,
    max: 255,
    step: 1,
    default: 150,
    label: '高阈值'
  }
}

/**
 * 验证并限制阈值在有效范围内
 * @param {number} value - 输入值
 * @param {string} key - 阈值键名
 * @returns {number} 限制后的值
 */
export function clampThreshold(value, key) {
  const config = thresholdSchema[key]
  if (!config) return value
  return Math.min(config.max, Math.max(config.min, Math.round(Number(value))))
}

/**
 * 确保低阈值不超过高阈值
 * @param {Object} thresholds - 阈值对象 {lowThreshold, highThreshold}
 * @returns {Object} 调整后的阈值
 */
export function validateThresholds({ lowThreshold, highThreshold }) {
  let low = clampThreshold(lowThreshold, 'lowThreshold')
  let high = clampThreshold(highThreshold, 'highThreshold')

  // 确保 low <= high
  if (low > high) {
    low = high
  }

  return { lowThreshold: low, highThreshold: high }
}

/**
 * 计算推荐的阈值对（基于Otsu方法或经验值）
 * @param {Object} image - 灰度图像
 * @returns {{lowThreshold: number, highThreshold: number}} 推荐阈值
 */
export function suggestThresholds(image) {
  const { data } = image
  const hist = new Array(256).fill(0)

  // 计算直方图
  for (let i = 0; i < data.length; i++) {
    hist[data[i]]++
  }

  // 使用Otsu算法自动计算最优阈值
  const total = data.length
  let sum = 0
  for (let i = 0; i < 256; i++) {
    sum += i * hist[i]
  }

  let sumB = 0
  let wB = 0
  let wF = 0
  let varMax = 0
  let threshold = 0

  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (wB === 0) continue
    wF = total - wB
    if (wF === 0) break

    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const varBetween = wB * wF * (mB - mF) * (mB - mF)

    if (varBetween > varMax) {
      varMax = varBetween
      threshold = t
    }
  }

  // 基于Otsu阈值设置高低阈值
  return {
    lowThreshold: Math.round(threshold * 0.5),
    highThreshold: Math.min(255, Math.round(threshold * 1.5))
  }
}

/**
 * 创建阈值调节UI
 * @param {Object} options
 * @param {HTMLElement} options.container - 容器元素
 * @param {Object} options.thresholds - 初始阈值 {lowThreshold, highThreshold}
 * @param {Function} options.onChange - 阈值变化时的回调
 * @returns {Object} UI控制器 {update, getValues}
 */
export function createThresholdUI({ container, thresholds, onChange }) {
  let currentThresholds = validateThresholds(thresholds || {
    lowThreshold: thresholdSchema.lowThreshold.default,
    highThreshold: thresholdSchema.highThreshold.default
  })

  const wrapper = document.createElement('div')
  wrapper.className = 'threshold-controls'

  // 创建标题
  const title = document.createElement('h4')
  title.textContent = '边缘检测阈值'
  wrapper.appendChild(title)

  // 创建阈值滑块
  const createSlider = (key, config) => {
    const row = document.createElement('div')
    row.className = 'threshold-row'

    const label = document.createElement('label')
    label.textContent = config.label
    label.htmlFor = `threshold-${key}`

    const slider = document.createElement('input')
    slider.type = 'range'
    slider.id = `threshold-${key}`
    slider.min = config.min
    slider.max = config.max
    slider.step = config.step
    slider.value = currentThresholds[key]

    const number = document.createElement('input')
    number.type = 'number'
    number.min = config.min
    number.max = config.max
    number.step = config.step
    number.value = currentThresholds[key]
    number.className = 'threshold-number'

    const sync = (value) => {
      const validated = validateThresholds({
        ...currentThresholds,
        [key]: clampThreshold(value, key)
      })
      currentThresholds = validated

      // 更新UI
      slider.value = validated[key]
      number.value = validated[key]

      // 更新另一个阈值输入（如果发生了交换）
      const otherKey = key === 'lowThreshold' ? 'highThreshold' : 'lowThreshold'
      const otherSlider = wrapper.querySelector(`#threshold-${otherKey}`)
      const otherNumber = wrapper.querySelector(`.threshold-number`)
      if (otherSlider) otherSlider.value = validated[otherKey]
      if (otherNumber) otherNumber.value = validated[otherKey]

      onChange?.(currentThresholds)
    }

    slider.addEventListener('input', () => sync(slider.value))
    number.addEventListener('input', () => sync(number.value))

    row.append(label, slider, number)
    return row
  }

  // 添加低阈值控制
  wrapper.appendChild(createSlider('lowThreshold', thresholdSchema.lowThreshold))

  // 添加高阈值控制
  wrapper.appendChild(createSlider('highThreshold', thresholdSchema.highThreshold))

  // 添加自动建议按钮
  const suggestBtn = document.createElement('button')
  suggestBtn.className = 'suggest-btn'
  suggestBtn.textContent = '自动建议阈值'
  suggestBtn.type = 'button'
  suggestBtn.addEventListener('click', () => {
    // 这里应该传入当前图像，简化处理使用默认值
    const suggested = {
      lowThreshold: 50,
      highThreshold: 150
    }
    currentThresholds = suggested

    // 更新所有UI
    wrapper.querySelector('#threshold-lowThreshold').value = suggested.lowThreshold
    wrapper.querySelector('#threshold-highThreshold').value = suggested.highThreshold
    wrapper.querySelectorAll('.threshold-number').forEach(el => {
      const key = el.previousElementSibling?.id?.replace('threshold-', '')
      if (key && suggested[key]) {
        el.value = suggested[key]
      }
    })

    onChange?.(currentThresholds)
  })
  wrapper.appendChild(suggestBtn)

  container.appendChild(wrapper)

  return {
    update: (newThresholds) => {
      currentThresholds = validateThresholds(newThresholds)
      wrapper.querySelector('#threshold-lowThreshold').value = currentThresholds.lowThreshold
      wrapper.querySelector('#threshold-highThreshold').value = currentThresholds.highThreshold
      wrapper.querySelectorAll('.threshold-number').forEach(el => {
        const key = el.previousElementSibling?.id?.replace('threshold-', '')
        if (key && currentThresholds[key] !== undefined) {
          el.value = currentThresholds[key]
        }
      })
    },
    getValues: () => ({ ...currentThresholds })
  }
}

/**
 * 应用阈值并返回调整后的阈值
 * @param {number} lowThreshold - 低阈值
 * @param {number} highThreshold - 高阈值
 * @returns {{lowThreshold: number, highThreshold: number}} 调整后的阈值
 */
export function applyThresholds(lowThreshold, highThreshold) {
  return validateThresholds({ lowThreshold, highThreshold })
}
