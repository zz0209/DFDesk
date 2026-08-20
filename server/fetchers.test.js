import test from 'node:test'
import assert from 'node:assert/strict'
import { parseJavascriptData } from './fetchers.js'

test('parses official array assignment without eval', () => {
  assert.deepEqual(parseJavascriptData('var basic_info_collection=[{"id":"1"}];'), [{ id: '1' }])
})

test('parses official object assignment without eval', () => {
  assert.deepEqual(parseJavascriptData('var basic_info_guns={"guns":[{"id":"1"}]};'), { guns: [{ id: '1' }] })
})

test('rejects wrappers without JSON payload', () => {
  assert.throws(() => parseJavascriptData('var broken=true;'), /wrapper is invalid/)
})
