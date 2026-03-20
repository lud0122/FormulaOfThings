import test from 'node:test'
import assert from 'node:assert/strict'
import { createAppState } from '../../src/app/main.js'

test('createAppState returns initial status', () => {
  const state = createAppState()
  assert.equal(state.status, 'idle')
  assert.equal(state.hasReference, false)
})
