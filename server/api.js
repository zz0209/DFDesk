import { cacheStats } from './cache.js'
import {
  getBootstrap,
  getBuilds,
  getDeltaForceApiAuctionPrice,
  getDeltaForceApiItems,
  getEvents,
  getItems,
  getMaps,
  getMapCatalog,
  getManufactureDetail,
  getMarket,
  getMissions,
  getOperators,
  getPasswords,
  getRecipes,
  getRecipeCatalog,
  getSlots,
  getSources,
  getSeasons,
  getWeapons,
  supportedServers,
} from './dataService.js'

const routes = new Map([
  ['/api/v1/bootstrap', getBootstrap],
  ['/api/v1/sources', getSources],
  ['/api/v1/events', getEvents],
  ['/api/v1/passwords/today', getPasswords],
  ['/api/v1/market/overview', getMarket],
  ['/api/v1/black-site/recipes', getRecipes],
  ['/api/v1/black-site/catalog', getRecipeCatalog],
  ['/api/v1/black-site/detail', getManufactureDetail],
  ['/api/v1/builds', getBuilds],
  ['/api/v1/missions', getMissions],
  ['/api/v1/maps', getMaps],
  ['/api/v1/catalog/maps', getMapCatalog],
  ['/api/v1/operators', getOperators],
  ['/api/v1/seasons', getSeasons],
  ['/api/v1/items', getItems],
  ['/api/v1/weapons', getWeapons],
  ['/api/v1/slots', getSlots],
  ['/api/v1/providers/deltaforceapi/items', getDeltaForceApiItems],
  ['/api/v1/providers/deltaforceapi/auction-price', getDeltaForceApiAuctionPrice],
])

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', status === 200 ? 'public, max-age=30, stale-while-revalidate=300' : 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(JSON.stringify(body))
}

export async function handleApi(req, res) {
  const url = new URL(req.url, 'http://localhost')
  if (!url.pathname.startsWith('/api/')) return false
  if (req.method !== 'GET') {
    json(res, 405, { ok: false, error: 'method_not_allowed' })
    return true
  }

  if (url.pathname === '/api/v1/health') {
    json(res, 200, {
      ok: true,
      service: 'operations-desk-data',
      time: new Date().toISOString(),
      supportedServers,
      cache: cacheStats(),
    })
    return true
  }

  const route = routes.get(url.pathname)
  if (!route) {
    json(res, 404, { ok: false, error: 'not_found' })
    return true
  }

  try {
    const requestedServer = url.searchParams.get('server') || 'level-infinite'
    if (!supportedServers.includes(requestedServer)) {
      json(res, 400, { ok: false, error: 'unsupported_server', supportedServers })
      return true
    }
    if (url.pathname === '/api/v1/black-site/detail' && !/^\d{6,20}$/.test(url.searchParams.get('itemId') || '')) {
      json(res, 400, { ok: false, error: 'invalid_item_id' })
      return true
    }
    if (url.pathname === '/api/v1/providers/deltaforceapi/auction-price' && !url.searchParams.get('itemId')) {
      json(res, 400, { ok: false, error: 'item_id_required' })
      return true
    }
    json(res, 200, await route(requestedServer, url.searchParams))
  } catch (error) {
    json(res, 500, { ok: false, error: 'internal_error', message: error.message })
  }
  return true
}
