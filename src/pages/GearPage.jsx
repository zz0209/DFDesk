import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, Copy } from 'lucide-react'
import { PageHeader, serverOptions } from '../components/AppShell'
import { CurrencyAmount, ItemThumb } from '../components/GameAssets'
import TacticalSelect from '../components/TacticalSelect'
import { getOperationMaps, optimizeGear, slotLabels } from '../gearRules'
import { sourceLabel, useDataset } from '../api'

const strategies = [
  { id: 'cheap', name: '最低花费', hint: '不限枪位' },
  { id: 'single', name: '单枪', hint: '必须一把主武器' },
  { id: 'dual', name: '双枪', hint: '必须两把主武器' },
  { id: 'rig', name: '胸挂优先', hint: '保证大容量胸挂' },
  { id: 'backpack', name: '背包优先', hint: '保证大容量背包' },
  { id: 'practical', name: '实用优先', hint: '兼顾防护与容量' },
]

const initialSlots = { weapon: true, attachment: true, helmet: true, armor: true, rig: true, backpack: true, pistol: false }
const format = (number) => Number(number || 0).toLocaleString('zh-CN')

export default function GearPage({ server = 'level-infinite' }) {
  const [mapId, setMapId] = useState('zero-dam')
  const [queueId, setQueueId] = useState('normal')
  const [currentGear, setCurrentGear] = useState(0)
  const [budget, setBudget] = useState('')
  const [allowExchange, setAllowExchange] = useState(false)
  const [allowedSlots, setAllowedSlots] = useState(initialSlots)
  const [strategy, setStrategy] = useState('cheap')
  const [copied, setCopied] = useState(false)
  const fallbackMaps = useMemo(() => getOperationMaps(server), [server])
  const mapData = useDataset('/api/v1/maps', server, fallbackMaps)
  const operationMaps = mapData.data
  const selectedMap = operationMaps.find((map) => map.id === mapId) || operationMaps[0]
  const selectedQueue = selectedMap.queues.find((queue) => queue.id === queueId) || selectedMap.queues[0]
  const deficit = Math.max(0, selectedQueue.minGear - Math.max(0, currentGear))
  const plans = useMemo(() => Object.fromEntries(strategies.map(({ id }) => [id, optimizeGear({
    deficit,
    budget: Number(budget) || 0,
    allowedSlots,
    allowExchange,
    strategy: id,
  })])), [deficit, budget, allowedSlots, allowExchange])
  const plan = plans[strategy]
  const planItems = useMemo(() => [...(plan?.items || [])].sort((a, b) => {
    const order = { helmet: 1, armor: 2, rig: 3, backpack: 4, weapon: 5, attachment: 6, pistol: 7 }
    return order[a.slot] - order[b.slot]
  }), [plan])
  const finalGear = Math.max(0, currentGear) + (plan?.value || 0)
  const saving = plan ? plan.value - plan.cost : 0
  const serverName = serverOptions.find((item) => item.id === server)?.name || 'Level Infinite'

  useEffect(() => {
    if (mapId !== selectedMap.id) setMapId(selectedMap.id)
    if (queueId !== selectedQueue.id) setQueueId(selectedQueue.id)
  }, [mapId, queueId, selectedMap.id, selectedQueue.id])

  const changeMap = (value) => {
    const nextMap = operationMaps.find((map) => map.id === value)
    setMapId(nextMap.id)
    setQueueId(nextMap.queues[0].id)
  }
  const toggleSlot = (slot) => setAllowedSlots((current) => ({ ...current, [slot]: !current[slot] }))
  const copy = async () => {
    if (!plan) return
    const heading = `${selectedMap.name} · ${selectedQueue.label}`
    const lines = plan.items.map((item) => `${slotLabels[item.slot]}：${item.name}（${format(item.cost)}）`)
    await navigator.clipboard?.writeText([heading, `门槛：${format(selectedQueue.minGear)}`, ...lines].join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return <div className="page-pad gear-page">
    <PageHeader title="鼠鼠卡战备" description={`按 ${serverName} 地图与难度计算入场缺口，在允许的槽位内寻找更省的补值组合。`} />

    <div className="gear-workspace">
      <aside className="gear-config" aria-label="战备计算条件">
        <div className="config-title">
          <div><h2>自定义配置</h2></div>
        </div>
        <div className="config-fields">
          <label>地图<TacticalSelect value={selectedMap.id} onChange={changeMap} ariaLabel="选择地图" options={operationMaps.map((map) => ({ value: map.id, label: map.name }))} /></label>
          <label>难度<TacticalSelect value={selectedQueue.id} onChange={setQueueId} ariaLabel="选择难度" options={selectedMap.queues.map((queue) => ({ value: queue.id, label: queue.label }))} /></label>
        </div>
        <div className="queue-readout">
          <span><small>入场门槛</small><b>{selectedQueue.minGear ? <CurrencyAmount value={selectedQueue.minGear} /> : '无最低要求'}</b></span>
          <em className={`difficulty ${selectedQueue.difficulty.toLowerCase()}`}>{selectedQueue.label}</em>
          <small>{selectedQueue.availability}规则 · 开放状态随赛季轮换</small>
        </div>
        <div className="config-fields single-column">
          <label>当前战备值<span className="currency-input"><img src="/assets/currency-havoc.png" alt="哈夫币" /><input min="0" type="number" value={currentGear} onChange={(event) => setCurrentGear(Number(event.target.value))} /></span></label>
          <label>预算上限 <small>可不填</small><span className="currency-input"><img src="/assets/currency-havoc.png" alt="哈夫币" /><input min="0" type="number" placeholder="不限预算" value={budget} onChange={(event) => setBudget(event.target.value)} /></span></label>
        </div>
        <div className="config-block">
          <div className="config-label">允许补入的槽位</div>
          <div className="slot-grid">{Object.keys(initialSlots).map((slot) => <label key={slot} className={allowedSlots[slot] ? 'checked' : ''}>
            <input type="checkbox" checked={allowedSlots[slot]} onChange={() => toggleSlot(slot)} /><span>{slotLabels[slot]}</span>
          </label>)}</div>
        </div>
        <label className="exchange-toggle"><input type="checkbox" checked={allowExchange} onChange={(event) => setAllowExchange(event.target.checked)} /><span><b>允许部门兑换物</b><small>把限购/兑换装备加入候选</small></span></label>
      </aside>

      <section className="gear-results" aria-live="polite">
        <div className="result-heading gear-result-heading">
          <div><h2>{selectedMap.name} · {selectedQueue.label}</h2><p>缺口 <CurrencyAmount value={deficit} />，结果使用演示市场价格</p></div>
          <button className="secondary-button" onClick={copy} disabled={!plan}>{copied ? <Check /> : <Copy />}{copied ? '已复制' : '复制清单'}</button>
        </div>
        <div className="strategy-tabs gear-strategies" role="tablist" aria-label="推荐策略">
          {strategies.map((item) => <button role="tab" aria-selected={strategy === item.id} className={strategy === item.id ? 'active' : ''} onClick={() => setStrategy(item.id)} key={item.id}><span>{item.name}</span><small>{item.hint}</small></button>)}
        </div>
        {plan ? <>
          <div className="result-summary gear-summary">
            <span><small>预计花费</small><b><CurrencyAmount value={plan.cost} /></b></span>
            <span><small>补入战备</small><b><CurrencyAmount value={plan.value} /></b></span>
            <span><small>最终战备</small><b className="positive"><CurrencyAmount value={finalGear} /></b></span>
            <span><small>价格差</small><b><CurrencyAmount value={saving} signed /></b></span>
          </div>
          {plan.items.length ? <div className="table-scroll"><table className="data-table gear-table">
            <thead><tr><th>槽位</th><th>推荐物品</th><th>参考花费</th><th>计入战备</th><th>差值</th></tr></thead>
            <tbody>{planItems.map((item) => <tr key={item.id} className={item.slot === 'attachment' ? 'attachment-row' : ''}><td><span className="slot-tag">{slotLabels[item.slot]}</span></td><td><span className="gear-item"><ItemThumb name={item.name} category={item.slot} /><span><b>{item.name}</b>{item.exchange && <small className="exchange-mark">兑换</small>}</span></span></td><td><CurrencyAmount value={item.cost} /></td><td><CurrencyAmount value={item.value} /></td><td className={item.value >= item.cost ? 'positive' : 'negative'}><CurrencyAmount value={item.value - item.cost} signed /></td></tr>)}</tbody>
          </table></div> : <div className="gear-empty success"><Check /><div><h3>当前战备已满足要求</h3><p>无需再补装备，可直接准备进入该队列。</p></div></div>}
        </> : <div className="gear-empty"><AlertTriangle /><div><h3>当前限制下没有可用组合</h3><p>提高预算，或开放更多槽位后再试。</p></div></div>}
        <div className="algorithm-note"><b>计算口径</b><p>先用当前战备抵扣地图门槛，再枚举允许槽位中的装备组合。最低花费按总成本排序；单枪、双枪限制主武器数量；胸挂或背包优先会强制保留对应的大容量装备。</p></div>
      </section>
    </div>
    <p className="data-note">规则基线：{serverName} · {sourceLabel(mapData.meta)}。市场价格为界面演示数据，正式接入后按服务器与更新时间标记。</p>
  </div>
}
