import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../components/AppShell'
import { CurrencyAmount, ItemName } from '../components/GameAssets'
import { recipes } from '../data'
import { sourceLabel, useDataset } from '../api'

export default function BlackSitePage({ server = 'level-infinite' }) {
  const [facility, setFacility] = useState('全部')
  const [selected, setSelected] = useState(recipes[0])
  const recipeData = useDataset('/api/v1/black-site/recipes', server, recipes)
  const visible = useMemo(() => facility === '全部' ? recipeData.data : recipeData.data.filter((item) => item.facility === facility), [facility, recipeData.data])
  const profit = selected ? (selected.profit ?? selected.output - selected.input) : 0

  useEffect(() => {
    if (!recipeData.data.length) {
      setSelected(null)
      return
    }
    if (!selected || !recipeData.data.some((item) => item.id === selected.id || item.name === selected.name)) setSelected(recipeData.data[0])
  }, [recipeData.data, selected])

  return <div className="page-pad">
    <PageHeader title="特勤处生产" description="比较材料成本、出售收益和生产时间。" />
    <div className="filter-tabs">
      {['全部', '技术中心', '工作台', '制药台', '防具台'].map((item) => <button className={facility === item ? 'active' : ''} onClick={() => setFacility(item)} key={item}>{item}</button>)}
    </div>
    <div className="content-split">
      <section className="list-section">
        <div className="table-scroll">
          <table className="data-table selectable-table">
            <thead><tr><th>产品</th><th>设施</th><th>材料成本</th><th>预估卖价</th><th>净利润</th><th>利润/时</th></tr></thead>
            <tbody>{visible.map((item) => {
              const itemProfit = item.profit ?? item.output - item.input
              const hourlyIncome = item.hourlyIncome ?? Math.round(itemProfit / item.hours)
              return <tr className={selected?.id === item.id || selected?.name === item.name ? 'selected' : ''} onClick={() => setSelected(item)} key={item.id || item.name}><td><ItemName name={item.name} image={item.image} detail={item.quantity ? `产出 ×${item.quantity}` : undefined} /></td><td>{item.facility} · {item.level}级</td><td><CurrencyAmount value={item.input} /></td><td><CurrencyAmount value={item.output} /></td><td className="positive"><CurrencyAmount value={itemProfit} signed /></td><td><CurrencyAmount value={hourlyIncome} signed /></td></tr>
            })}</tbody>
          </table>
        </div>
        {!visible.length && <p className="empty-copy">当前服务器没有已验证的实时生产推荐。{recipeData.meta.note}</p>}
      </section>
      {selected ? <aside className="detail-section">
        <p className="detail-type">{selected.facility} · {selected.level}级</p>
        <h2><ItemName name={selected.name} image={selected.image} /></h2>
        <div className="detail-total"><small>预计净利润</small><strong><CurrencyAmount value={profit} signed /></strong></div>
        <dl className="detail-data">
          <div><dt>材料成本</dt><dd><CurrencyAmount value={selected.input} /></dd></div>
          <div><dt>预估卖价</dt><dd><CurrencyAmount value={selected.output} /></dd></div>
          <div><dt>生产时间</dt><dd>{selected.hours} 小时</dd></div>
          <div><dt>回报率</dt><dd>{selected.roi}%</dd></div>
        </dl>
        <h3>材料构成</h3>
        <ul className="plain-list">{(selected.materials || []).map((item) => <li key={item.id || item.name}><ItemName name={item.name} image={item.image} detail={`×${item.count}`} />{item.totalPrice != null && <CurrencyAmount value={item.totalPrice} />}</li>)}</ul>
        {!selected.materials?.length && <p className="empty-copy">当前上游未返回材料明细。</p>}
        <button className="primary-button full">加入生产计划</button>
        <p className="data-note">{sourceLabel(recipeData.meta)} · {recipeData.meta.note || '未计入玩家持有材料'}</p>
      </aside> : <aside className="detail-section"><p className="empty-copy">选择有数据的服务器后查看生产详情。</p></aside>}
    </div>
  </div>
}
