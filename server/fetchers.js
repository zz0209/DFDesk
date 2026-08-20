import { cached } from './cache.js'

const userAgent = 'OperationsDesk/0.1 (+data-source-audit; cached public data client)'

function decodeHtml(value = '') {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchResponse(url, { timeoutMs = 12_000, method = 'GET', headers = {}, body } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      method,
      body,
      headers: { Accept: 'application/json,text/html;q=0.9', 'User-Agent': userAgent, ...headers },
    })
    if (!response.ok) throw new Error(`upstream ${response.status} ${response.statusText}`)
    return response
  } finally {
    clearTimeout(timer)
  }
}

async function fetchJson(url) {
  return (await fetchResponse(url)).json()
}

async function postJson(url, payload, headers = {}) {
  const response = await fetchResponse(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  })
  return response.json()
}

export function parseJavascriptData(source) {
  const start = Math.min(...['[', '{'].map((token) => {
    const index = source.indexOf(token)
    return index < 0 ? Number.POSITIVE_INFINITY : index
  }))
  const end = Math.max(source.lastIndexOf(']'), source.lastIndexOf('}'))
  if (!Number.isFinite(start) || end < start) throw new Error('official static data wrapper is invalid')
  return JSON.parse(source.slice(start, end + 1))
}

const officialStaticFiles = {
  items: { directory: 'basic_info', file: 'collections' },
  weapons: { directory: 'basic_info', file: 'guns' },
  slots: { directory: 'basic_info', file: 'slots' },
  recipes: { directory: 'basic_info', file: 'craft_recipes' },
  maps: { directory: 'basic_info', file: 'maps' },
  operators: { directory: 'basic_info', file: 'operators' },
  seasons: { directory: 'basic_info', file: 'seasons' },
}

export async function fetchOfficialStaticData(kind, locale = 'zh') {
  const target = officialStaticFiles[kind]
  if (!target) throw new Error(`unsupported official static dataset: ${kind}`)
  const safeLocale = locale === 'zh-TW' ? 'zh-TW' : locale === 'en' ? 'en' : 'zh'
  return cached(`playdeltaforce-static-${kind}-${safeLocale}`, 12 * 60 * 60_000, async () => {
    const url = `https://www.playdeltaforce.com/${target.directory}/${target.file}_${safeLocale}.js`
    const response = await fetchResponse(url, { timeoutMs: 20_000 })
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('javascript') && !contentType.includes('text/plain')) {
      throw new Error(`official ${kind} locale ${safeLocale} is unavailable`)
    }
    const data = parseJavascriptData(await response.text())
    return { fetchedAt: new Date().toISOString(), sourceUrl: url, items: data }
  })
}

export async function fetchOfficialGunCodes(server = 'level-infinite') {
  const channel = server === 'garena' ? 'ga' : 'li'
  return cached(`playdeltaforce-gun-codes-${channel}`, 60 * 60_000, async () => {
    const suffix = channel === 'ga' ? '_ga' : ''
    const files = [
      { mode: '烽火地带', file: `op_sol${suffix}_zh.js` },
      { mode: '全面战场', file: `op_mp${suffix}_zh.js` },
    ]
    const groups = await Promise.all(files.map(async ({ mode, file }) => {
      const url = `https://www.playdeltaforce.com/gun-codes/${file}`
      const response = await fetchResponse(url, { timeoutMs: 20_000 })
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('javascript') && !contentType.includes('text/plain')) throw new Error(`official gun codes ${file} unavailable`)
      return { mode, url, data: parseJavascriptData(await response.text()) }
    }))
    return { fetchedAt: new Date().toISOString(), items: groups }
  })
}

const hqApiBase = 'https://sg-act.playerinfinite.com/api/proxy_direct/logicial/DfTools'

async function fetchHqTool(path, payload) {
  const result = await postJson(`${hqApiBase}/${path}`, payload)
  if (Number(result?.code) !== 0 || !result?.data) throw new Error(result?.msg || `HQ ${path} request failed`)
  return result.data
}

function dateInTimeZone(timeZone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

function passwordCacheTtl(timeZone, publishMinute = 0) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]))
  const minuteOfDay = parts.hour * 60 + parts.minute
  if (minuteOfDay >= publishMinute && minuteOfDay < publishMinute + 30) return 5 * 60_000
  const minutesToPublish = (24 * 60 + publishMinute - minuteOfDay) % (24 * 60) || 24 * 60
  return (minutesToPublish + 5) * 60_000
}

export async function fetchOfficialPasswords(server = 'level-infinite') {
  return cached(`playdeltaforce-hq-passwords-${server}`, passwordCacheTtl('UTC'), async () => {
    const data = await fetchHqTool('GetPrivateRoomKey', { needLogin: false })
    const today = dateInTimeZone('UTC')
    const maps = [
      ['zero_dam', '零号大坝', 'dam'],
      ['longbow_valley', '长弓溪谷', 'grove'],
      ['spaceport', '航天基地', 'space'],
      ['bakshe', '巴克什', 'brakkesh'],
      ['tide_prison', '潮汐监狱', 'prison'],
      ['az3', 'AZ3', 'az3'],
    ]
    return {
      fetchedAt: new Date().toISOString(),
      items: maps
        .filter(([key]) => data[key] != null)
        .map(([key, map, tone]) => ({
          map, tone, code: String(data[key]), date: today, operationalDate: today, hint: '',
          operationalTimeZone: 'UTC', resetAt: '00:00', refreshLabel: '北京时间 08:00 刷新',
        })),
    }
  })
}

export async function fetchOfficialManufactureDetail(itemId) {
  if (!/^\d{6,20}$/.test(String(itemId))) throw new Error('invalid manufacture item id')
  return cached(`playdeltaforce-manufacture-${itemId}`, 5 * 60_000, async () => ({
    fetchedAt: new Date().toISOString(),
    items: await fetchHqTool('GetManufactureDetail', { needLogin: false, item_id: String(itemId) }),
  }))
}

export async function fetchOfficialManufactureRecommendations() {
  return cached('playdeltaforce-manufacture-recommendations', 5 * 60_000, async () => {
    const data = await fetchHqTool('GetManufactureRecommendationList', { needLogin: false })
    const recommendations = data.workbench_list || []
    const details = await Promise.all(recommendations.map(async (item) => {
      try {
        const detail = await fetchOfficialManufactureDetail(item.item_id)
        return { ...item, ...detail.items }
      } catch (error) {
        return { ...item, detailError: error.message }
      }
    }))
    return {
      fetchedAt: new Date(Number(data.timestamp || 0) * 1000).toISOString(),
      items: details,
    }
  })
}

function deltaForceApiConfig() {
  const apiKey = process.env.DELTA_FORCE_API_KEY
  const baseUrl = (process.env.DELTA_FORCE_API_BASE_URL || 'https://apiv2.deltaforceapi.com').replace(/\/$/, '')
  if (!apiKey) throw new Error('DELTA_FORCE_API_KEY is not configured')
  return { apiKey, baseUrl }
}

async function fetchDeltaForceApi(operation, payload) {
  const { apiKey, baseUrl } = deltaForceApiConfig()
  return postJson(`${baseUrl}/deltaforceapi.gateway.ApiService/${operation}`, payload, {
    'Connect-Protocol-Version': '1',
    'deltaforceapi-gateway-key': apiKey,
  })
}

export async function fetchDeltaForceApiItems({ pageSize = 100, pageToken = '', language = 'LANGUAGE_ZH_HANS' } = {}) {
  const size = Math.max(1, Math.min(100, Number(pageSize) || 100))
  return cached(`deltaforceapi-items-${language}-${size}-${pageToken}`, 60 * 60_000, async () => ({
    fetchedAt: new Date().toISOString(),
    items: await fetchDeltaForceApi('ListItems', { language, pageSize: size, pageToken }),
  }))
}

export async function fetchDeltaForceApiAuctionPrice(itemId, durability) {
  if (!itemId) throw new Error('itemId is required')
  const payload = { itemId }
  if (durability != null && durability !== '') payload.durability = Number(durability)
  return cached(`deltaforceapi-price-${itemId}-${payload.durability ?? 'any'}`, 60_000, async () => ({
    fetchedAt: new Date().toISOString(),
    items: await fetchDeltaForceApi('GetItemAuctionPrice', payload),
  }))
}

export async function fetchSteamAnnouncements() {
  return cached('steam-announcements', 15 * 60_000, async () => {
    const url = new URL('https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/')
    url.searchParams.set('appid', '2507950')
    url.searchParams.set('count', '20')
    url.searchParams.set('maxlength', '700')
    url.searchParams.set('feeds', 'steam_community_announcements')
    const payload = await fetchJson(url)
    const items = payload?.appnews?.newsitems || []
    return {
      fetchedAt: new Date().toISOString(),
      items: items.map((item) => ({
        id: `steam-${item.gid}`,
        title: decodeHtml(item.title),
        summary: decodeHtml(item.contents),
        type: '官方公告',
        mode: '全模式',
        status: 'info',
        publishedAt: new Date(item.date * 1000).toISOString(),
        time: new Date(item.date * 1000).toLocaleDateString('zh-CN'),
        url: item.url,
        author: item.author,
      })),
    }
  })
}

export async function fetchGarenaAnnouncements() {
  return cached('garena-announcements', 30 * 60_000, async () => {
    const response = await fetchResponse('https://deltaforce.garena.com/en/news/announcement')
    const html = await response.text()
    const cardPattern = /<a href="(\/en\/news\/(?:announcement|all|system|event)\/[A-Z0-9]+)"[^>]*class="category-list-item"[\s\S]*?<img src="([^"]+)"[\s\S]*?<div class="info__date"[^>]*>([^<]+)<\/div>[\s\S]*?<div class="info__title"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<div class="info__summary"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<\/a>/g
    const items = []
    for (const match of html.matchAll(cardPattern)) {
      const [, path, image, date, title, summary] = match
      items.push({
        id: `garena-${path.split('/').pop()}`,
        title: decodeHtml(title),
        summary: decodeHtml(summary),
        type: '官方公告',
        mode: '全模式',
        status: 'info',
        publishedAt: new Date(`${date} 00:00:00 GMT+0800`).toISOString(),
        time: date,
        image,
        url: `https://deltaforce.garena.com${path}`,
      })
    }
    if (!items.length) throw new Error('Garena public page schema changed')
    return { fetchedAt: new Date().toISOString(), items }
  })
}

function orziceUrl(path, params = {}) {
  const token = process.env.ORZICE_TOKEN
  if (!token) throw new Error('ORZICE_TOKEN is not configured')
  const url = new URL(`https://orzice.com/workApi/v1/sjz_api/${path}`)
  url.searchParams.set('token', token)
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') url.searchParams.set(key, String(value))
  })
  return url
}

async function fetchOrzice(path, params) {
  const payload = await fetchJson(orziceUrl(path, params))
  if (Number(payload?.code) !== 0) throw new Error(payload?.msg || payload?.message || 'Orzice request failed')
  return payload.data
}

export async function fetchOrzicePasswords() {
  return cached('orzice-passwords', passwordCacheTtl('Asia/Shanghai', 5), async () => {
    const data = await fetchOrzice('map_pwd')
    const maps = [
      ['a', '零号大坝', 'dam'], ['b', '长弓溪谷', 'grove'], ['c', '巴克什', 'brakkesh'],
      ['d', '航天基地', 'space'], ['e', '潮汐监狱', 'prison'], ['f', 'AZ3', 'az3'],
    ]
    return {
      fetchedAt: new Date().toISOString(),
      items: maps.map(([key, map, tone]) => ({
        map, tone, code: data?.[key]?.[0] || '-', date: data?.[key]?.[1] || null, operationalDate: data?.[key]?.[1] || null, hint: '',
        operationalTimeZone: 'Asia/Shanghai', resetAt: '00:00', refreshLabel: '北京时间 00:05 前后可用',
      })),
    }
  })
}

export async function fetchOrziceBuilds() {
  return cached('orzice-builds', 6 * 60 * 60_000, async () => {
    const items = await fetchOrzice('gun_gqm')
    return {
      fetchedAt: new Date().toISOString(),
      items: (items || []).map((item) => ({
        id: `orzice-build-${item.id}`,
        weapon: item.objectName,
        code: item.solutionCode,
        role: item.name,
        author: item.authorNickname || '匿名玩家',
        cost: 0,
        heat: 0,
        verified: false,
        category: item.m_type,
        image: item.pic,
        preview: item.pic,
        properties: item.properties_data || [],
        updatedAt: item.updatedAt || item.update_time || item.updateTime || item.updated_at || item.create_time || item.created_at || null,
      })),
    }
  })
}

async function fetchOrziceItemInfo() {
  return cached('orzice-item-info', 24 * 60 * 60_000, async () => ({ items: await fetchOrzice('item_info_all') }))
}

async function fetchOrzicePrices() {
  return cached('orzice-item-prices', 10 * 60_000, async () => ({ items: await fetchOrzice('item_price_all') }))
}

export async function fetchOrziceMarket() {
  return cached('orzice-market', 10 * 60_000, async () => {
    const [infoResult, priceResult] = await Promise.all([fetchOrziceItemInfo(), fetchOrzicePrices()])
    const info = infoResult.items
    const prices = priceResult.items
    const byOid = new Map((info || []).map((item) => [Number(item.oid), item]))
    const items = (prices || []).map((price) => {
      const item = byOid.get(Number(price.id)) || {}
      return {
        id: `orzice-item-${price.id}`,
        name: item.objectName || item.name || `物品 ${price.id}`,
        price: Number(price.price || 0),
        change24h: Number(price.bl || 0),
        gearValue: Number(price.zb_price || 0),
        observedAt: price.is_get_time ? new Date(Number(price.is_get_time) * 1000).toISOString() : null,
        image: item.pic || null,
        category: item.primaryClass || null,
      }
    }).filter((item) => item.price > 0)
    return { fetchedAt: new Date().toISOString(), items }
  })
}

const orziceFacilityNames = { 1: '技术中心', 2: '工作台', 3: '制药台', 4: '防具台' }

export async function fetchOrziceManufacture() {
  return cached('orzice-manufacture-pro', 30 * 60_000, async () => {
    const requests = []
    for (const facility of [1, 2, 3, 4]) {
      for (const level of [1, 2, 3]) requests.push({ facility, level })
    }
    const groups = await Promise.all(requests.map(async ({ facility, level }) => ({
      facility, level, items: await fetchOrzice('manufacturePro', { t: facility, l: level }),
    })))
    const items = groups.flatMap(({ facility, level, items: rows }) => (rows || []).map((item) => {
      const output = Math.max(0, Number(item.priceMax || 0) - Number(item.sxf || 0))
      const profit = Number(item.price || 0)
      return {
        id: `orzice-recipe-${facility}-${level}-${item.id}`,
        itemId: String(item.objectID || item.oid || item.id),
        name: item.name,
        facilityId: String(facility),
        facility: orziceFacilityNames[facility],
        level,
        input: Math.max(0, output - profit),
        output,
        profit,
        hours: Number(item.period || 0),
        hourlyIncome: Number(item.price_hour || 0),
        roi: output - profit > 0 ? Math.round((profit / (output - profit)) * 100) : 0,
        image: item.pic || null,
        materials: [],
        live: true,
      }
    }))
    return { fetchedAt: new Date().toISOString(), items }
  })
}
