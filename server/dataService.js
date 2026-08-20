import { builds, events, marketRows, missions, passwords, recipes } from '../src/data.js'
import { gearCatalog, getOperationMaps } from '../src/gearRules.js'
import {
  fetchDeltaForceApiAuctionPrice as fetchProviderAuctionPrice,
  fetchDeltaForceApiItems as fetchProviderItems,
  fetchGarenaAnnouncements,
  fetchOfficialManufactureDetail,
  fetchOfficialManufactureRecommendations,
  fetchOfficialPasswords,
  fetchOfficialGunCodes,
  fetchOfficialStaticData,
  fetchOrziceBuilds,
  fetchOrziceManufacture,
  fetchOrziceMarket,
  fetchOrzicePasswords,
  fetchSteamAnnouncements,
} from './fetchers.js'
import { publicSourceRegistry, sourceById } from './sourceRegistry.js'

export const supportedServers = ['cn', 'level-infinite', 'garena']

function normalizeServer(server) {
  return supportedServers.includes(server) ? server : 'level-infinite'
}

function meta(sourceId, { status = 'live', observedAt = new Date().toISOString(), stale = false, note } = {}) {
  const source = sourceById(sourceId)
  return {
    status,
    sourceId,
    sourceName: source?.name,
    sourceType: source?.type,
    sourceUrl: source?.url,
    ingestionMethod: source?.method,
    observedAt,
    stale,
    note: note || source?.note,
  }
}

function envelope(dataset, server, data, metadata) {
  return {
    ok: true,
    dataset,
    server: normalizeServer(server),
    generatedAt: new Date().toISOString(),
    meta: metadata,
    data,
  }
}

function demo(dataset, server, data, note) {
  return envelope(dataset, server, data, meta('demo-seed', { status: 'demo', note }))
}

function unavailable(dataset, server, note, data = []) {
  return envelope(dataset, server, data, meta('local-reviewed-rules', { status: 'unavailable', note }))
}

async function liveOrFallback(dataset, server, sourceId, loader, fallback, fallbackNote) {
  try {
    const result = await loader()
    return envelope(dataset, server, result.items, meta(sourceId, {
      observedAt: result.fetchedAt,
      stale: Boolean(result.stale),
      note: result.upstreamError ? `上游暂时失败，正在使用缓存：${result.upstreamError}` : undefined,
    }))
  } catch (error) {
    return demo(dataset, server, fallback, `${fallbackNote}；上游状态：${error.message}`)
  }
}

async function liveOrUnavailable(dataset, server, sourceId, loader, failureNote) {
  try {
    const result = await loader()
    return envelope(dataset, server, result.items, meta(sourceId, {
      observedAt: result.fetchedAt,
      stale: Boolean(result.stale),
      note: result.upstreamError ? `上游暂时失败，正在使用缓存：${result.upstreamError}` : undefined,
    }))
  } catch (error) {
    return unavailable(dataset, server, `${failureNote}；上游状态：${error.message}`)
  }
}

export async function getEvents(server) {
  const normalized = normalizeServer(server)
  if (normalized === 'level-infinite') {
    return liveOrFallback('events', normalized, 'steam-delta-force-news', fetchSteamAnnouncements, events, 'Steam 官方公告暂不可用')
  }
  if (normalized === 'garena') {
    return liveOrFallback('events', normalized, 'garena-official-news', fetchGarenaAnnouncements, events, 'Garena 官方公告暂不可用')
  }
  return demo('events', normalized, events, '尚未确认稳定的国服官方公告结构化入口')
}

export async function getPasswords(server) {
  const normalized = normalizeServer(server)
  if (normalized === 'cn' && process.env.ORZICE_TOKEN) {
    return liveOrUnavailable('passwords', normalized, 'orzice-open-platform', fetchOrzicePasswords, 'Orzice 今日密码暂不可用')
  }
  if (normalized === 'level-infinite' || normalized === 'garena') {
    return liveOrUnavailable('passwords', normalized, 'playdeltaforce-hq-shared-passwords', () => fetchOfficialPasswords(normalized), '官方 HQ 今日密码暂不可用')
  }
  return unavailable('passwords', normalized, '配置 ORZICE_TOKEN 后可接入国服今日密码；当前不展示跨服演示值。')
}

export async function getBuilds(server) {
  const normalized = normalizeServer(server)
  if (normalized === 'cn' && process.env.ORZICE_TOKEN) {
    return liveOrFallback('builds', normalized, 'orzice-open-platform', fetchOrziceBuilds, builds, 'Orzice 改枪码暂不可用')
  }
  if (normalized === 'level-infinite' || normalized === 'garena') {
    return liveOrFallback('builds', normalized, normalized === 'garena' ? 'playdeltaforce-hq-garena-gun-codes' : 'playdeltaforce-hq-public-data', async () => {
      const result = await fetchOfficialGunCodes(normalized)
      const items = result.items.flatMap(({ mode, data }) => (data || []).flatMap((weapon) => (weapon.schemes || []).map((scheme) => ({
        id: `official-build-${normalized}-${scheme.id}`,
        weapon: weapon.gun_name,
        weaponId: String(weapon.gun_id),
        image: weapon.gun_image_url || null,
        code: scheme.gun_code,
        role: scheme.name || (scheme.tags || []).map((tag) => tag.name).join(' · '),
        description: scheme.description || '',
        author: (scheme.authors || []).map((author) => author.name).join('、') || '官方精选',
        authorAvatar: scheme.authors?.[0]?.avatar_url || null,
        cost: 0,
        heat: 0,
        verified: true,
        official: true,
        mode,
        channel: scheme.channel,
        tags: (scheme.tags || []).map((tag) => tag.name),
        preview: scheme.image_url || null,
        updatedAt: scheme.updatedAt || scheme.update_time || scheme.updateTime || scheme.updated_at || scheme.publish_time || scheme.published_at || scheme.created_at || null,
        stats: {
          handling: Number(scheme.final_handling_speed || weapon.gun_handling_speed || 0),
          stability: Number(scheme.final_stability || weapon.gun_stability || 0),
          range: Number(scheme.final_range || weapon.gun_range || 0),
          damage: Number(scheme.final_base_damage || weapon.gun_base_damage || 0),
          hipFire: Number(scheme.final_hip_fire || weapon.gun_hip_fire || 0),
          recoilControl: Number(scheme.final_recoil_control || weapon.gun_recoil_control || 0),
        },
        attachments: scheme.config_data?.attachments || [],
      }))))
      return { ...result, items }
    }, builds, '官方 HQ 改枪码目录暂不可用')
  }
  return demo('builds', normalized, builds, '配置 ORZICE_TOKEN 后可接入国服改枪码')
}

export async function getMarket(server) {
  const normalized = normalizeServer(server)
  if (normalized === 'cn' && process.env.ORZICE_TOKEN) {
    return liveOrFallback('market', normalized, 'orzice-open-platform', fetchOrziceMarket, marketRows, 'Orzice 市场数据暂不可用')
  }
  if (normalized === 'level-infinite') {
    return unavailable('market', normalized, process.env.DELTA_FORCE_API_KEY
      ? 'DeltaForceAPI 已配置，但列表式市场概览需在完成供应商区服与批量价格契约测试后启用；当前可使用单物品价格接口。'
      : '配置 DELTA_FORCE_API_KEY 后可测试单物品实时价格；供应商区服覆盖与商用授权仍需确认。')
  }
  return unavailable('market', normalized, normalized === 'cn'
    ? '配置 ORZICE_TOKEN 后可接入国服交易行。'
    : '尚未取得 Garena 市场价格源，不会复用 Level Infinite 或国服价格。')
}

export async function getMaps(server) {
  const normalized = normalizeServer(server)
  return envelope('maps', normalized, getOperationMaps(normalized), meta('local-reviewed-rules', {
    status: 'manual-verified',
    observedAt: '2026-08-16T00:00:00.000Z',
    note: '按区服隔离的赛季规则快照；轮换与门槛变化仍需持续复核。',
  }))
}

export async function getRecipes(server) {
  const normalized = normalizeServer(server)
  if (normalized === 'cn' && process.env.ORZICE_TOKEN) {
    return liveOrFallback('recipes', normalized, 'orzice-open-platform', fetchOrziceManufacture, recipes, 'Orzice 特勤处 Pro 暂不可用')
  }
  if (normalized !== 'level-infinite') {
    return unavailable('recipes', normalized, normalized === 'cn'
      ? '国服实时生产成本仍需 Orzice 配方端点或人工维护。'
      : '尚未验证 Garena 的特勤处配方与实时成本，未复用 Level Infinite 数据。')
  }
  try {
    const [recommendations, recipeCatalog, itemCatalog] = await Promise.all([
      fetchOfficialManufactureRecommendations(),
      fetchOfficialStaticData('recipes', 'zh'),
      fetchOfficialStaticData('items', 'zh'),
    ])
    const normalizedItems = normalizeManufactureRecommendations(recommendations.items, recipeCatalog.items, itemCatalog.items)
    return envelope('recipes', normalized, normalizedItems, meta('playdeltaforce-hq-public-data', {
      observedAt: recommendations.fetchedAt,
      stale: Boolean(recommendations.stale || recipeCatalog.stale || itemCatalog.stale),
      note: '官方 HQ 当前四个设施推荐；成本、卖价与材料价格按页面更新时间缓存 5 分钟。',
    }))
  } catch (error) {
    return demo('recipes', normalized, recipes, `官方 HQ 生产推荐暂不可用；上游状态：${error.message}`)
  }
}

export async function getMissions(server) {
  return demo('missions', normalizeServer(server), missions, '任务结构已接口化，当前任务内容仍为演示数据')
}

export async function getItems(server) {
  const normalized = normalizeServer(server)
  if (normalized === 'cn' && process.env.ORZICE_TOKEN) {
    const market = await getMarket(normalized)
    return { ...market, dataset: 'items' }
  }
  if (normalized !== 'level-infinite') {
    return unavailable('items', normalized, normalized === 'cn'
      ? '配置 ORZICE_TOKEN 后可取得国服完整物品与图片。'
      : '尚未确认 Garena 可复用的官方物品静态库，暂不跨服复制。')
  }
  try {
    const result = await fetchOfficialStaticData('items', 'zh')
    return envelope('items', normalized, normalizeOfficialItems(result.items), meta('playdeltaforce-hq-public-data', {
      observedAt: result.fetchedAt,
      stale: Boolean(result.stale),
      note: `官方公开静态物品库，共 ${result.items.length} 条；不含实时市场价。`,
    }))
  } catch (error) {
    return envelope('items', normalized, gearCatalog, meta('local-reviewed-rules', {
      status: 'manual-verified',
      note: `官方物品库暂不可用，回退算法候选子集：${error.message}`,
    }))
  }
}

const workshopNames = {
  '1002': '技术中心',
  '1005': '防具台',
  '1006': '制药台',
  '1007': '工作台',
}

function localName(item = {}) {
  return item.language?.zh || item.name?.zh || item.item_name || item.language?.en || item.name?.en || `物品 ${item.prop_id || item.item_id || ''}`.trim()
}

function normalizeOfficialItems(items) {
  return (items || []).map((item) => ({
    id: String(item.prop_id),
    name: localName(item),
    grade: Number(item.grade || 0),
    referenceValue: item.value == null ? null : Number(item.value),
    image: item.image_url || null,
    size: item.length && item.width ? { length: Number(item.length), width: Number(item.width) } : null,
    weight: item.weight === '' ? null : Number(item.weight),
    mapId: item.map_id || null,
    collectible: Boolean(item.is_collectible),
    description: item.description_i18n?.zh || item.description_i18n?.en || '',
  }))
}

function normalizeOfficialRecipes(items) {
  return (items || []).map((item) => ({
    id: String(item.recipe_id),
    itemId: String(item.item_id),
    name: item.item_name,
    facilityId: String(item.workshop_id),
    facility: workshopNames[item.workshop_id] || `设施 ${item.workshop_id}`,
    level: Number(item.required_workshop_level || 0),
    quantity: Number(item.craft_quantity || 0),
    grade: Number(item.item_grade || 0),
    hours: Number(item.production_time || 0),
    upgradedHours: Number(item.upgraded_production_time || 0),
    image: item.item_image_url || null,
    materials: (item.materials || []).filter((material) => material.material_id).map((material) => ({
      id: String(material.material_id),
      name: material.material_name,
      count: Number(material.quantity || 0),
      grade: Number(material.material_grade || 0),
      image: material.material_image_url || null,
    })),
  }))
}

function normalizeManufactureRecommendations(recommendations, rawRecipes, rawItems) {
  const recipeCatalog = normalizeOfficialRecipes(rawRecipes)
  const recipesById = new Map(recipeCatalog.map((item) => [item.id, item]))
  const recipesByItem = new Map(recipeCatalog.map((item) => [item.itemId, item]))
  const itemsById = new Map(normalizeOfficialItems(rawItems).map((item) => [item.id, item]))
  return (recommendations || []).map((detail) => {
    const recipe = recipesById.get(String(detail.recommended_recipe_id)) || recipesByItem.get(String(detail.item_id)) || {}
    const input = Number(detail.manufacture_cost || 0)
    const output = Number(detail.total_sell_price || 0)
    const profit = Number(detail.total_income || output - input)
    const materials = (detail.material_list || []).map((material) => {
      const item = itemsById.get(String(material.material_id)) || {}
      return {
        id: String(material.material_id),
        name: item.name || `物品 ${material.material_id}`,
        count: Number(material.material_count || 0),
        unitPrice: Number(material.unit_price || 0),
        totalPrice: Number(material.total_price || 0),
        image: item.image || null,
      }
    })
    return {
      ...recipe,
      id: recipe.id || `recommendation-${detail.item_id}`,
      itemId: String(detail.item_id),
      name: recipe.name || itemsById.get(String(detail.item_id))?.name || `物品 ${detail.item_id}`,
      facilityId: String(detail.workbench_id),
      facility: workshopNames[detail.workbench_id] || `设施 ${detail.workbench_id}`,
      input,
      output,
      profit,
      hours: Number(detail.total_duration || 0) / 3600,
      hourlyIncome: Number(detail.hourly_income || 0),
      roi: input > 0 ? Math.round((profit / input) * 100) : 0,
      deposit: Number(detail.deposit || 0),
      handlingFee: Number(detail.handling_fee || 0),
      materials,
      priceHistory: (detail.price_fluctuation_list || []).map((point) => ({
        time: new Date(Number(point.hour_timestamp) * 1000).toISOString(),
        price: Number(point.price || 0),
      })),
      live: !detail.detailError,
      detailError: detail.detailError,
    }
  })
}

export async function getRecipeCatalog(server) {
  const normalized = normalizeServer(server)
  if (normalized !== 'level-infinite') return unavailable('recipe-catalog', normalized, '该区服的完整配方目录尚未验证。')
  return liveOrFallback(
    'recipe-catalog', normalized, 'playdeltaforce-hq-public-data',
    async () => {
      const result = await fetchOfficialStaticData('recipes', 'zh')
      return { ...result, items: normalizeOfficialRecipes(result.items) }
    }, [], '官方配方目录暂不可用',
  )
}

export async function getWeapons(server) {
  const normalized = normalizeServer(server)
  if (normalized !== 'level-infinite') return unavailable('weapons', normalized, '该区服的官方武器静态库尚未验证。')
  return liveOrFallback('weapons', normalized, 'playdeltaforce-hq-public-data', async () => {
    const result = await fetchOfficialStaticData('weapons', 'zh')
    const payload = result.items
    return {
      ...result,
      items: (payload.guns || []).map((gun) => ({
        id: String(gun.gun_id),
        name: localName(gun),
        categoryId: String(gun.category),
        category: payload.guncategory_map?.[gun.category] || null,
        image: gun.image_url || null,
        caliber: gun.caliber || null,
        fireMode: gun.fire_mode || '',
        stats: {
          handling: Number(gun.gun_handling_speed || 0), stability: Number(gun.gun_stability || 0),
          range: Number(gun.gun_range || 0), damage: Number(gun.gun_base_damage || 0),
          hipFire: Number(gun.gun_hip_fire || 0), recoilControl: Number(gun.gun_recoil_control || 0),
        },
        bareSlotIds: (gun.bare_slots || []).map((slot) => String(slot.slot_id)),
        fullSlotIds: (gun.full_slots || []).map((slot) => String(slot.slot_id)),
      })),
    }
  }, [], '官方武器静态库暂不可用')
}

export async function getSlots(server) {
  const normalized = normalizeServer(server)
  if (normalized !== 'level-infinite') return unavailable('slots', normalized, '该区服的官方配件槽位库尚未验证。')
  return liveOrFallback('slots', normalized, 'playdeltaforce-hq-public-data', async () => {
    const result = await fetchOfficialStaticData('slots', 'zh')
    return { ...result, items: result.items.map((slot) => ({ id: String(slot.slot_id), name: localName(slot) })) }
  }, [], '官方配件槽位库暂不可用')
}

export async function getMapCatalog(server) {
  const normalized = normalizeServer(server)
  if (normalized !== 'level-infinite') return unavailable('map-catalog', normalized, '该区服的官方地图百科静态库尚未验证。')
  return liveOrFallback('map-catalog', normalized, 'playdeltaforce-hq-public-data', async () => {
    const result = await fetchOfficialStaticData('maps', 'zh')
    const payload = result.items
    return {
      ...result,
      items: (payload.maps || []).map((map) => ({
        id: String(map.map_id),
        name: localName(map),
        baseName: payload.mapname_map?.[Number(map.map_name)] || null,
        mode: map.category === 'SOL' ? '烽火地带' : map.category === 'MP' ? '全面战场' : map.category,
        image: map.image_url || null,
        images: { desktop: map.image_w1280_url || null, tablet: map.image_w720_url || null, mobile: map.image_w480_url || null },
      })),
    }
  }, [], '官方地图百科暂不可用')
}

export async function getOperators(server) {
  const normalized = normalizeServer(server)
  if (normalized !== 'level-infinite') return unavailable('operators', normalized, '该区服的官方干员静态库尚未验证。')
  return liveOrFallback('operators', normalized, 'playdeltaforce-hq-public-data', async () => {
    const result = await fetchOfficialStaticData('operators', 'zh')
    return {
      ...result,
      items: result.items.map((operator) => ({
        id: String(operator.operator_id), name: localName(operator), image: operator.image_url || null, weeklyImage: operator.weekly_image_url || null,
      })),
    }
  }, [], '官方干员静态库暂不可用')
}

export async function getSeasons(server) {
  const normalized = normalizeServer(server)
  if (normalized !== 'level-infinite') return unavailable('seasons', normalized, '该区服的官方赛季静态库尚未验证。')
  return liveOrFallback('seasons', normalized, 'playdeltaforce-hq-public-data', async () => {
    const result = await fetchOfficialStaticData('seasons', 'zh')
    return { ...result, items: result.items.map((season) => ({ id: String(season.season_id), name: localName(season) })) }
  }, [], '官方赛季目录暂不可用')
}

export async function getManufactureDetail(server, searchParams) {
  const normalized = normalizeServer(server)
  if (normalized !== 'level-infinite') return unavailable('manufacture-detail', normalized, '该区服的官方生产详情上游尚未验证。', null)
  const itemId = searchParams?.get('itemId') || ''
  const result = await fetchOfficialManufactureDetail(itemId)
  return envelope('manufacture-detail', normalized, result.items, meta('playdeltaforce-hq-public-data', {
    observedAt: result.fetchedAt, stale: Boolean(result.stale),
  }))
}

export async function getDeltaForceApiItems(server, searchParams) {
  const normalized = normalizeServer(server)
  if (normalized !== 'level-infinite') return unavailable('deltaforceapi-items', normalized, 'DeltaForceAPI 当前未声明可覆盖该区服。', null)
  if (!process.env.DELTA_FORCE_API_KEY) return unavailable('deltaforceapi-items', normalized, '配置 DELTA_FORCE_API_KEY 后启用；供应商未公开明确区服字段，接入结果不能自动复用到 Garena。', null)
  const result = await fetchProviderItems({
    pageSize: searchParams?.get('pageSize'),
    pageToken: searchParams?.get('pageToken') || '',
    language: 'LANGUAGE_ZH_HANS',
  })
  return envelope('deltaforceapi-items', normalized, result.items, meta('deltaforceapi-commercial', {
    observedAt: result.fetchedAt, stale: Boolean(result.stale),
    note: '第三方 API 原始响应；当前供应商文档没有明确区服字段。',
  }))
}

export async function getDeltaForceApiAuctionPrice(server, searchParams) {
  const normalized = normalizeServer(server)
  if (normalized !== 'level-infinite') return unavailable('deltaforceapi-auction-price', normalized, 'DeltaForceAPI 当前未声明可覆盖该区服。', null)
  if (!process.env.DELTA_FORCE_API_KEY) return unavailable('deltaforceapi-auction-price', normalized, '配置 DELTA_FORCE_API_KEY 后启用。', null)
  const result = await fetchProviderAuctionPrice(searchParams?.get('itemId'), searchParams?.get('durability'))
  return envelope('deltaforceapi-auction-price', normalized, result.items, meta('deltaforceapi-commercial', {
    observedAt: result.fetchedAt, stale: Boolean(result.stale),
    note: '第三方 API 单物品实时价格；供应商区服覆盖范围需签约前确认。',
  }))
}

export async function getSources(server) {
  const normalized = normalizeServer(server)
  const data = publicSourceRegistry().filter((source) => source.server.includes(normalized))
  return envelope('sources', normalized, data, meta('local-reviewed-rules', { status: 'registry' }))
}

export async function getBootstrap(server) {
  const normalized = normalizeServer(server)
  const [eventData, passwordData, mapData, sourceData] = await Promise.all([
    getEvents(normalized), getPasswords(normalized), getMaps(normalized), getSources(normalized),
  ])
  return {
    ok: true,
    dataset: 'bootstrap',
    server: normalized,
    generatedAt: new Date().toISOString(),
    data: { events: eventData, passwords: passwordData, maps: mapData, sources: sourceData },
  }
}
