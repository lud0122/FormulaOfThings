import { schema, defaultParams, clampParams } from '../formula/params.js'

const randomBetween = (min, max) => min + Math.random() * (max - min)

const randomParams = () =>
  Object.fromEntries(
    Object.entries(schema).map(([k, conf]) => [k, randomBetween(conf.min, conf.max)])
  )

const mutate = (params, scale = 0.12) =>
  clampParams(
    Object.fromEntries(
      Object.entries(schema).map(([k, conf]) => {
        const span = conf.max - conf.min
        const delta = (Math.random() * 2 - 1) * span * scale
        return [k, params[k] + delta]
      })
    )
  )

export const optimizeParams = async ({ iterations, evaluate, onProgress }) => {
  let best = { params: { ...defaultParams }, score: -Infinity }

  for (let i = 0; i < iterations; i += 1) {
    const seed = i % 10 === 0 ? randomParams() : mutate(best.params)
    const score = await evaluate(seed)
    if (score > best.score) {
      best = { params: seed, score }
    }
    if (onProgress) onProgress({ step: i + 1, total: iterations, bestScore: best.score })
  }

  return { bestParams: best.params, bestScore: best.score }
}
