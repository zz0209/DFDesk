import test from 'node:test'
import assert from 'node:assert/strict'
import { handleApi } from './api.js'

async function request(url) {
  let body = ''
  const headers = new Map()
  const response = {
    statusCode: 0,
    setHeader(name, value) { headers.set(name, value) },
    end(value = '') { body = value },
  }
  const handled = await handleApi({ method: 'GET', url }, response)
  return { handled, status: response.statusCode, headers, body: JSON.parse(body) }
}

test('rejects unknown server instead of silently using another region', async () => {
  const result = await request('/api/v1/items?server=unknown')
  assert.equal(result.status, 400)
  assert.equal(result.body.error, 'unsupported_server')
})

test('never substitutes demo passwords when the shared Garena source is unavailable', async () => {
  const result = await request('/api/v1/passwords/today?server=garena')
  assert.equal(result.status, 200)
  assert.notEqual(result.body.meta.status, 'demo')
  if (result.body.meta.status === 'unavailable') assert.deepEqual(result.body.data, [])
  if (result.body.meta.status === 'live') {
    assert.ok(result.body.data.length > 0)
    assert.equal(result.body.data[0].operationalTimeZone, 'UTC')
  }
})

test('validates manufacture detail ids before calling upstream', async () => {
  const result = await request('/api/v1/black-site/detail?server=level-infinite&itemId=bad')
  assert.equal(result.status, 400)
  assert.equal(result.body.error, 'invalid_item_id')
})
