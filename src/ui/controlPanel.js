import { schema, clampParams } from '../formula/params.js'

export const clampBySchema = (schemaInput, key, value) => {
  const conf = schemaInput[key]
  if (!conf) return value
  return Math.min(conf.max, Math.max(conf.min, Number(value)))
}

const makeRange = (key, conf, value, onChange) => {
  const row = document.createElement('div')
  row.className = 'row'

  const label = document.createElement('label')
  label.textContent = key

  const input = document.createElement('input')
  input.type = 'range'
  input.min = String(conf.min)
  input.max = String(conf.max)
  input.step = String(conf.step)
  input.value = String(value)

  const num = document.createElement('input')
  num.type = 'number'
  num.min = String(conf.min)
  num.max = String(conf.max)
  num.step = String(conf.step)
  num.value = String(value)

  const sync = (raw) => {
    const next = clampBySchema(schema, key, raw)
    input.value = String(next)
    num.value = String(next)
    onChange(next)
  }

  input.addEventListener('input', () => sync(input.value))
  num.addEventListener('input', () => sync(num.value))

  row.append(label, input, num)
  return row
}

export const mountControlPanel = ({ container, params, onParamsChange }) => {
  container.innerHTML = ''
  let currentParams = { ...params }

  const grouped = Object.entries(schema).reduce((acc, [key, conf]) => {
    const g = conf.group || 'other'
    const list = acc[g] ?? []
    return { ...acc, [g]: [...list, [key, conf]] }
  }, {})

  Object.entries(grouped).forEach(([group, items]) => {
    const wrap = document.createElement('section')
    wrap.className = 'group'
    const title = document.createElement('h3')
    title.textContent = group
    wrap.appendChild(title)

    items.forEach(([key, conf]) => {
      const row = makeRange(key, conf, currentParams[key], (next) => {
        currentParams = clampParams({ ...currentParams, [key]: next })
        onParamsChange(currentParams)
      })
      wrap.appendChild(row)
    })

    container.appendChild(wrap)
  })
}
