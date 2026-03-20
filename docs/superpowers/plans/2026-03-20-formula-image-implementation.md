# Formula Image Canvas2D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser app that auto-derives interpretable formula parameters from `ideal/ideal_1.PNG`, renders a visually similar image in Canvas2D, and supports real-time parameter tuning/export.

**Architecture:** Use a four-layer pipeline: reference feature extraction → formula model evaluation → optimizer search loop → real-time Canvas2D rendering/UI control. Keep formula semantics explicit (radial base, polar wave, noise modulation, tone mapping), with no manual anchors. Optimize against proxy visual metrics aligned with subjective similarity.

**Tech Stack:** Vanilla HTML/CSS/ES Modules, Canvas2D, Node.js built-in test runner (`node:test`), GitHub Pages.

---

## File Map (planned)

- Create: `index.html`
- Create: `styles/main.css`
- Create: `src/app/main.js`
- Create: `src/formula/model.js`
- Create: `src/formula/params.js`
- Create: `src/fit/extractFeatures.js`
- Create: `src/fit/score.js`
- Create: `src/fit/optimizer.js`
- Create: `src/render/canvasRenderer.js`
- Create: `src/ui/controlPanel.js`
- Create: `src/io/referenceLoader.js`
- Create: `src/io/exporter.js`
- Create: `tests/formula/model.test.js`
- Create: `tests/fit/score.test.js`
- Create: `tests/fit/extractFeatures.test.js`
- Create: `scripts/run-tests.mjs`
- Modify: `README.md` (if absent, create minimal usage doc)

---

### Task 1: Bootstrap page shell and app entry

**Files:**
- Create: `index.html`
- Create: `styles/main.css`
- Create: `src/app/main.js`
- Test: `tests/app/smoke.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/app/smoke.test.js
import test from 'node:test'
import assert from 'node:assert/strict'
import { createAppState } from '../../src/app/main.js'

test('createAppState returns initial status', () => {
  const state = createAppState()
  assert.equal(state.status, 'idle')
  assert.equal(state.hasReference, false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/app/smoke.test.js`
Expected: FAIL with module/file not found.

- [ ] **Step 3: Write minimal implementation**

```js
// src/app/main.js
export const createAppState = () => ({ status: 'idle', hasReference: false })
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/app/smoke.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html styles/main.css src/app/main.js tests/app/smoke.test.js
git commit -m "feat: bootstrap canvas app shell"
```

---

### Task 2: Define interpretable formula schema and model

**Files:**
- Create: `src/formula/params.js`
- Create: `src/formula/model.js`
- Test: `tests/formula/model.test.js`

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultParams } from '../../src/formula/params.js'
import { sampleIntensity } from '../../src/formula/model.js'

test('intensity stays in [0,1]', () => {
  const value = sampleIntensity(0.2, -0.3, 0, defaultParams)
  assert.ok(value >= 0 && value <= 1)
})

test('radial frequency changes pattern', () => {
  const a = sampleIntensity(0.4, 0.1, 0, { ...defaultParams, radialFreq: 3 })
  const b = sampleIntensity(0.4, 0.1, 0, { ...defaultParams, radialFreq: 9 })
  assert.notEqual(a, b)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/formula/model.test.js`
Expected: FAIL with export not found.

- [ ] **Step 3: Write minimal implementation**

```js
// sample formula shape
const radialBase = Math.exp(-p.radialDecay * r * r)
const polarWave = 0.5 + 0.5 * Math.cos(p.radialFreq * r + p.angularFreq * theta + p.phase)
const noiseTerm = 0.5 + 0.5 * pseudoNoise(nx, ny, p.noiseSeed)
return clamp01(mix(radialBase, polarWave, p.waveMix) * (1 - p.noiseStrength + p.noiseStrength * noiseTerm))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/formula/model.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/formula/params.js src/formula/model.js tests/formula/model.test.js
git commit -m "feat: add interpretable formula model and param schema"
```

---

### Task 3: Implement reference loading and feature extraction

**Files:**
- Create: `src/io/referenceLoader.js`
- Create: `src/fit/extractFeatures.js`
- Test: `tests/fit/extractFeatures.test.js`

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { extractFeaturesFromGray } from '../../src/fit/extractFeatures.js'

test('extractFeaturesFromGray returns stable feature vector', () => {
  const gray = new Float32Array([0, 0.5, 1, 0.5])
  const out = extractFeaturesFromGray(gray, 2, 2)
  assert.equal(Array.isArray(out.hist), true)
  assert.equal(out.hist.length, 16)
  assert.ok(out.edgeEnergy >= 0)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/fit/extractFeatures.test.js`
Expected: FAIL with function not defined.

- [ ] **Step 3: Write minimal implementation**

```js
// output shape
{
  hist: number[16],
  radialProfile: number[32],
  orientationBins: number[8],
  edgeEnergy: number
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/fit/extractFeatures.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/io/referenceLoader.js src/fit/extractFeatures.js tests/fit/extractFeatures.test.js
git commit -m "feat: add reference loader and feature extraction"
```

---

### Task 4: Implement similarity scoring

**Files:**
- Create: `src/fit/score.js`
- Test: `tests/fit/score.test.js`

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { scoreFeatures } from '../../src/fit/score.js'

test('identical features score best', () => {
  const f = { hist:[1], radialProfile:[1], orientationBins:[1], edgeEnergy:1 }
  const s0 = scoreFeatures(f, f)
  const s1 = scoreFeatures(f, { ...f, edgeEnergy: 2 })
  assert.ok(s0 > s1)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/fit/score.test.js`
Expected: FAIL with missing module.

- [ ] **Step 3: Write minimal implementation**

```js
// weighted similarity in [0,1]
score = 1 - (
  wHist * l1(histA, histB) +
  wRadial * l1(radialA, radialB) +
  wOrient * l1(orientA, orientB) +
  wEdge * relDiff(edgeA, edgeB)
)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/fit/score.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/fit/score.js tests/fit/score.test.js
git commit -m "feat: add visual similarity scoring"
```

---

### Task 5: Build optimizer loop (auto-derive params)

**Files:**
- Create: `src/fit/optimizer.js`
- Modify: `src/formula/params.js`
- Test: `tests/fit/optimizer.test.js`

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { optimizeParams } from '../../src/fit/optimizer.js'

test('optimizer improves score over baseline', async () => {
  const baseline = { score: 0.2 }
  const result = await optimizeParams({ iterations: 20, target: {} })
  assert.ok(result.bestScore >= baseline.score)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/fit/optimizer.test.js`
Expected: FAIL with function missing.

- [ ] **Step 3: Write minimal implementation**

```js
// strategy: random restart + local perturb
for (let i = 0; i < iterations; i++) {
  const cand = mutate(current)
  const score = evaluate(cand)
  if (score > best.score) best = { params: cand, score }
}
return best
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/fit/optimizer.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/fit/optimizer.js src/formula/params.js tests/fit/optimizer.test.js
git commit -m "feat: add auto parameter optimizer"
```

---

### Task 6: Implement Canvas renderer and app integration

**Files:**
- Create: `src/render/canvasRenderer.js`
- Modify: `src/app/main.js`
- Test: `tests/render/canvasRenderer.test.js`

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { renderToBuffer } from '../../src/render/canvasRenderer.js'

test('renderer returns rgba buffer with expected size', () => {
  const out = renderToBuffer({ width: 16, height: 16, t: 0 })
  assert.equal(out.length, 16 * 16 * 4)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/render/canvasRenderer.test.js`
Expected: FAIL with missing export.

- [ ] **Step 3: Write minimal implementation**

```js
// render loop
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = sampleIntensity(nx, ny, t, params)
    writeRGBA(out, idx, toneMap(i, params))
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/render/canvasRenderer.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/render/canvasRenderer.js src/app/main.js tests/render/canvasRenderer.test.js
git commit -m "feat: integrate canvas renderer"
```

---

### Task 7: Build parameter control panel and IO export/import

**Files:**
- Create: `src/ui/controlPanel.js`
- Create: `src/io/exporter.js`
- Modify: `index.html`
- Test: `tests/ui/controlPanel.test.js`

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { clampBySchema } from '../../src/ui/controlPanel.js'

test('clampBySchema keeps param in allowed range', () => {
  const schema = { radialFreq: { min: 1, max: 20 } }
  assert.equal(clampBySchema(schema, 'radialFreq', 99), 20)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui/controlPanel.test.js`
Expected: FAIL with module not found.

- [ ] **Step 3: Write minimal implementation**

```js
export const clampBySchema = (schema, key, value) => {
  const conf = schema[key]
  return Math.min(conf.max, Math.max(conf.min, value))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ui/controlPanel.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/controlPanel.js src/io/exporter.js index.html tests/ui/controlPanel.test.js
git commit -m "feat: add parameter panel and import/export"
```

---

### Task 8: End-to-end integration check and docs

**Files:**
- Modify/Create: `README.md`
- Create: `scripts/run-tests.mjs`
- Test: all files under `tests/**/*.test.js`

- [ ] **Step 1: Write failing integration test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { runPipelineOnce } from '../src/app/main.js'

test('pipeline returns best params and frame stats', async () => {
  const result = await runPipelineOnce({ iterations: 5 })
  assert.ok(result.bestParams)
  assert.ok(result.bestScore >= 0)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/integration.pipeline.test.js`
Expected: FAIL with function missing.

- [ ] **Step 3: Write minimal implementation and docs**

- Implement `runPipelineOnce` orchestration in `src/app/main.js`
- Add README sections:
  - How to run locally (static server)
  - How fitting works (interpretable formula terms)
  - How to tune/export/import params

- [ ] **Step 4: Run full test suite**

Run: `node --test tests/**/*.test.js`
Expected: PASS all tests.

- [ ] **Step 5: Commit**

```bash
git add README.md scripts/run-tests.mjs src/app/main.js tests/integration.pipeline.test.js
git commit -m "docs: add usage and pipeline verification"
```

---

### Task 9: Publish workflow (default GitHub Pages)

**Files:**
- Modify/Create: `.github/workflows/pages.yml`
- Modify: `README.md`

- [ ] **Step 1: Write failing CI check expectation**

Document desired checks in PR description:
- Build/static validation passes
- Pages artifact uploads successfully

- [ ] **Step 2: Add Pages workflow**

- Trigger on push to `main`
- Use actions: checkout, configure-pages, upload-pages-artifact, deploy-pages
- Publish root site with `index.html` entry

- [ ] **Step 3: Validate locally before push**

Run:
- `node --test tests/**/*.test.js`
- `python3 -m http.server 4173` (manual open and verify)

Expected:
- Tests PASS
- App loads and renders generated image

- [ ] **Step 4: Git operations**

```bash
git checkout -b feat/formula-canvas-generator
git add .github/workflows/pages.yml README.md
git commit -m "ci: add github pages deployment workflow"
git push -u origin feat/formula-canvas-generator
```

- [ ] **Step 5: Create PR**

Use `gh pr create` with summary + test plan checklist.

---

## Verification Checklist (before merge)

- [ ] Formula terms are documented and visually interpretable
- [ ] No manual anchor points or hardcoded shape points introduced
- [ ] Parameter panel changes produce immediate visible effect
- [ ] Exported params can be imported to reproduce result
- [ ] Initial fitted result is subjectively close to `ideal/ideal_1.PNG`
- [ ] Tests pass locally
- [ ] GitHub Pages deploys and URL is accessible

## Risks and Mitigations

- **Risk:** Pure formula family may underfit complex details.
  - **Mitigation:** Expand noise basis and tone map controls without adding manual anchors.
- **Risk:** Optimizer runtime too slow in browser.
  - **Mitigation:** Two-stage resolution (low-res search, high-res final render) and iteration cap.
- **Risk:** Subjective similarity disputes.
  - **Mitigation:** Provide side-by-side compare mode and persistent presets.

## Suggested execution mode

Recommended: **Subagent-Driven** (`@superpowers:subagent-driven-development`) for per-task isolation and quick review gates.
