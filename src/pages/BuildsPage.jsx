import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, Check, Copy, Maximize2, Search, SlidersHorizontal, X } from 'lucide-react'
import { PageHeader } from '../components/AppShell'
import { CurrencyAmount, ItemThumb } from '../components/GameAssets'
import TacticalSelect from '../components/TacticalSelect'
import { builds } from '../data'
import { sourceLabel, useDataset } from '../api'

const weaponTypes = ['全部', '突击步枪', '战斗步枪', '冲锋枪', '轻机枪', '精确射手步枪', '狙击步枪', '霰弹枪', '手枪', '特殊武器']

const creatorLabelRules = [
  { names: ['昊天'], labels: ['国服第一', '技术主播推荐'] },
  { names: ['林树'], labels: ['国服第一', '技术主播推荐'] },
  { names: ['天霸旺崽崽', '旺崽崽'], labels: ['技术主播推荐'] },
]

const creatorCases = [
  { author: '林树', caseWeapon: 'AS Val 突击步枪', caseRole: '消音近战案例' },
  { author: '昊天', caseWeapon: 'M7 战斗步枪', caseRole: '均衡控枪案例' },
  { author: '天霸旺崽崽', caseWeapon: 'PKM 通用机枪', caseRole: '持续压制案例' },
]

const statLabels = {
  handling: '操控',
  stability: '据枪稳定',
  range: '优势射程',
  damage: '伤害',
  hipFire: '腰射',
  recoilControl: '后坐力控制',
}

function inferWeaponType(item) {
  const value = `${item.category || ''} ${item.weapon || ''}`
  if (/突击步枪/.test(value)) return '突击步枪'
  if (/战斗步枪/.test(value)) return '战斗步枪'
  if (/冲锋枪/.test(value)) return '冲锋枪'
  if (/轻机枪|通用机枪|机枪/.test(value)) return '轻机枪'
  if (/精确射手步枪|射手步枪/.test(value)) return '精确射手步枪'
  if (/狙击步枪/.test(value)) return '狙击步枪'
  if (/霰弹枪/.test(value)) return '霰弹枪'
  if (/手枪/.test(value)) return '手枪'
  if (/弓|发射器|特殊/.test(value)) return '特殊武器'
  return '其他'
}

function getBuildLabels(item) {
  const author = String(item.author || '').toLowerCase()
  const creatorLabels = creatorLabelRules.flatMap((rule) => rule.names.some((name) => author.includes(name.toLowerCase())) ? rule.labels : [])
  const sourceLabels = [...(Array.isArray(item.labels) ? item.labels : []), ...(Array.isArray(item.tags) ? item.tags : [])]
    .filter((buildLabel) => typeof buildLabel === 'string' && buildLabel.length <= 12)
  if (item.official) sourceLabels.push('官方精选')
  if (item.verified) sourceLabels.push('已验证')
  if (item.caseStudy) sourceLabels.push('界面案例')
  return [...new Set([...creatorLabels, ...sourceLabels])]
}

function formatBuildDate(item) {
  const raw = item.updatedAt || item.updateDate || item.updated_at || item.update_time || item.updateTime || item.publishTime || item.publish_time || item.published_at || item.createdAt || item.created_at
  if (!raw) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(raw))) return String(raw)
  const numeric = Number(raw)
  const date = Number.isFinite(numeric) && String(raw).trim() !== ''
    ? new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric)
    : new Date(raw)
  if (Number.isNaN(date.getTime())) return String(raw).slice(0, 10)
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date).replaceAll('/', '-')
}

function getPerformanceNote(item) {
  const stats = Object.entries(item.stats || {})
    .filter(([, value]) => Number.isFinite(Number(value)) && Number(value) > 0)
    .sort((left, right) => Number(right[1]) - Number(left[1]))
    .slice(0, 2)
    .map(([key, value]) => `${statLabels[key] || key} ${value}`)
  if (stats.length) return stats.join(' · ')
  const properties = (item.properties || []).slice(0, 2).map((property) => property?.name || property?.propertyName || property?.key).filter(Boolean)
  return properties.length ? properties.join(' · ') : item.role || '性能说明待发布者补充'
}

function BuildPreview({ item, preview, large = false }) {
  if (preview) return <img src={preview} alt={`${item.weapon}改枪一图流`} loading="lazy" />
  return <div className="build-preview-fallback">
    <ItemThumb name={item.weapon} category="weapon" image={item.image} />
    <span>{large ? '暂无可放大的改枪一图流' : '暂无改枪一图流'}</span>
  </div>
}

function BuildCard({ item, copied, onCopy, onOpen }) {
  const labels = getBuildLabels(item)
  const type = inferWeaponType(item)
  const preview = item.preview || item.image
  const updatedAt = formatBuildDate(item)

  return <article className="build-card">
    <header className="build-card-author">
      <span className="build-avatar" aria-hidden="true">
        {item.authorAvatar ? <img src={item.authorAvatar} alt="" /> : String(item.author || '匿').slice(0, 1)}
      </span>
      <span className="build-author-copy">
        <b>{item.author || '匿名玩家'}</b>
        <span>{labels.map((buildLabel) => <em key={buildLabel}>{buildLabel}</em>)}</span>
      </span>
      <small>{type}</small>
    </header>

    <button type="button" className="build-preview" onClick={() => onOpen(item)} aria-label={`查看${item.weapon}改枪一图流大图`}>
      <BuildPreview item={item} preview={preview} />
      <span className="build-preview-action"><Maximize2 aria-hidden="true" />查看大图</span>
    </button>

    <div className="build-card-body">
      <div className="build-card-title">
        <div>
          <h2>{item.weapon}</h2>
          <p>{item.role || '构筑说明待补充'}</p>
        </div>
        {item.mode && <span>{item.mode}</span>}
      </div>

      <p className={`build-update-date${updatedAt ? '' : ' missing'}`}><CalendarDays aria-hidden="true" />{updatedAt ? `${item.caseStudy ? '案例日期' : '更新'} ${updatedAt}` : '更新日期待补充'}</p>

      <dl className="build-notes">
        <div><dt>性能</dt><dd>{getPerformanceNote(item)}</dd></div>
        <div><dt>预算</dt><dd>{Number(item.cost) > 0 ? <CurrencyAmount value={item.cost} /> : '导入后以游戏内价格为准'}</dd></div>
        {item.description && item.description !== item.role && <div><dt>说明</dt><dd>{item.description}</dd></div>}
      </dl>

      <div className="build-code-row">
        <div><span>改枪码</span><code>{item.code || '暂无可用枪码'}</code></div>
        <button type="button" onClick={() => onCopy(item.code)} disabled={!item.code} aria-live="polite">
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
    </div>
  </article>
}

function BuildDetail({ item, copied, onCopy, onClose }) {
  const labels = getBuildLabels(item)
  const updatedAt = formatBuildDate(item)
  const preview = item.preview || item.image
  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return <div className="build-detail-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="build-detail" role="dialog" aria-modal="true" aria-labelledby="build-detail-title">
      <header>
        <div>
          <span>{item.author || '匿名玩家'}</span>
          <span className="build-detail-labels">{labels.map((buildLabel) => <em key={buildLabel}>{buildLabel}</em>)}</span>
        </div>
        <button type="button" onClick={onClose} aria-label="关闭改枪详情"><X aria-hidden="true" /></button>
      </header>
      <div className="build-detail-layout">
        <div className="build-detail-preview"><BuildPreview item={item} preview={preview} large /></div>
        <aside>
          <p>{inferWeaponType(item)}</p>
          <h2 id="build-detail-title">{item.weapon}</h2>
          <strong>{item.role || '构筑说明待补充'}</strong>
          <dl>
            <div><dt>{item.caseStudy ? '界面案例日期' : '枪码更新日期'}</dt><dd>{updatedAt || '待发布者补充'}</dd></div>
            <div><dt>性能</dt><dd>{getPerformanceNote(item)}</dd></div>
            <div><dt>预算</dt><dd>{Number(item.cost) > 0 ? <CurrencyAmount value={item.cost} /> : '导入后以游戏内价格为准'}</dd></div>
          </dl>
          <div className="build-code-row build-detail-code">
            <div><span>改枪码</span><code>{item.code || '暂无可用枪码'}</code></div>
            <button type="button" onClick={() => onCopy(item.code)} disabled={!item.code}>
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? '已复制' : '复制'}
            </button>
          </div>
        </aside>
      </div>
    </section>
  </div>
}

export default function BuildsPage({ server = 'level-infinite' }) {
  const [query, setQuery] = useState('')
  const [weaponType, setWeaponType] = useState('全部')
  const [label, setLabel] = useState('全部标签')
  const [mode, setMode] = useState('全部模式')
  const [sort, setSort] = useState('综合排序')
  const [copiedCode, setCopiedCode] = useState('')
  const [selectedBuild, setSelectedBuild] = useState(null)
  const copyTimer = useRef(null)
  const buildData = useDataset('/api/v1/builds', server, builds)

  const enriched = useMemo(() => {
    const caseItems = creatorCases.map((creator, index) => {
      const source = buildData.data[index] || builds[index] || {}
      return {
        ...source,
        id: `creator-case-${creator.author}`,
        author: creator.author,
        weapon: creator.caseWeapon,
        role: creator.caseRole,
        code: '',
        updatedAt: '2026-08-16',
        verified: false,
        official: false,
        labels: [],
        tags: [],
        caseStudy: true,
      }
    })
    return [...caseItems, ...buildData.data].map((item) => ({
      ...item,
      _type: inferWeaponType(item),
      _labels: getBuildLabels(item),
    }))
  }, [buildData.data])

  const availableLabels = useMemo(() => [...new Set(enriched.flatMap((item) => item._labels))], [enriched])
  const activeLabel = label === '全部标签' || availableLabels.includes(label) ? label : '全部标签'
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const matches = enriched.filter((item) => {
      const haystack = [item.weapon, item.role, item.author, item.code, item.description, item._type, ...item._labels, ...(item.tags || [])].filter(Boolean).join(' ').toLowerCase()
      return (!normalizedQuery || haystack.includes(normalizedQuery))
        && (weaponType === '全部' || item._type === weaponType)
        && (activeLabel === '全部标签' || item._labels.includes(activeLabel))
        && (mode === '全部模式' || item.mode === mode)
    })
    if (sort === '预算从低到高') return [...matches].sort((left, right) => (Number(left.cost) || Number.MAX_SAFE_INTEGER) - (Number(right.cost) || Number.MAX_SAFE_INTEGER))
    if (sort === '热度从高到低') return [...matches].sort((left, right) => Number(right.heat || 0) - Number(left.heat || 0))
    return matches
  }, [activeLabel, enriched, mode, query, sort, weaponType])

  const copy = async (code) => {
    if (!code) return
    await navigator.clipboard?.writeText(code)
    setCopiedCode(code)
    window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => setCopiedCode(''), 1400)
  }

  return <div className="page-pad builds-page">
    <PageHeader title="改枪码" description="按发布者、枪械和用途筛选构筑，查看一图流后直接复制枪码。" />

    <section className="build-filters" aria-label="改枪码筛选">
      <div className="build-filter-primary">
        <label className="search-field build-search">
          <Search aria-hidden="true" />
          <input aria-label="搜索发布者或改枪名称" placeholder="搜索发布者 ID、枪械或构筑名称" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <TacticalSelect value={activeLabel} options={['全部标签', ...availableLabels]} onChange={setLabel} ariaLabel="按作者标签筛选" className="build-filter-select" />
        <TacticalSelect value={mode} options={['全部模式', '烽火地带', '全面战场']} onChange={setMode} ariaLabel="按游戏模式筛选" className="build-filter-select" />
        <TacticalSelect value={sort} options={['综合排序', '预算从低到高', '热度从高到低']} onChange={setSort} ariaLabel="改枪码排序" icon={SlidersHorizontal} className="build-filter-select build-sort" />
      </div>
      <div className="filter-tabs compact build-type-tabs" aria-label="按枪械种类筛选">
        {weaponTypes.map((item) => <button type="button" aria-pressed={weaponType === item} className={weaponType === item ? 'active' : ''} onClick={() => setWeaponType(item)} key={item}>{item}</button>)}
      </div>
    </section>

    <div className="build-results-head">
      <p>共 <b>{filtered.length}</b> 个构筑</p>
      <p>{sourceLabel(buildData.meta)}{buildData.meta.note ? ` · ${buildData.meta.note}` : ''}</p>
    </div>

    {filtered.length > 0 ? <section className="build-card-grid" aria-label="改枪码列表">
      {filtered.map((item, index) => <BuildCard item={item} copied={Boolean(item.code) && copiedCode === item.code} onCopy={copy} onOpen={setSelectedBuild} key={item.id || `${item.code}-${index}`} />)}
    </section> : <section className="build-empty">
      <Search aria-hidden="true" />
      <h2>没有匹配的改枪码</h2>
      <p>换一个发布者、枪械名称，或清除部分筛选条件。</p>
      <button type="button" className="secondary-button" onClick={() => { setQuery(''); setWeaponType('全部'); setLabel('全部标签'); setMode('全部模式'); setSort('综合排序') }}>清除筛选</button>
    </section>}

    {selectedBuild && <BuildDetail item={selectedBuild} copied={Boolean(selectedBuild.code) && copiedCode === selectedBuild.code} onCopy={copy} onClose={() => setSelectedBuild(null)} />}
  </div>
}
