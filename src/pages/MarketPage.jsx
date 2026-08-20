import { useState } from 'react'
import { Search } from 'lucide-react'
import { PageHeader } from '../components/AppShell'
import { CurrencyAmount, ItemName } from '../components/GameAssets'
import { marketRows } from '../data'
import { sourceLabel, useDataset } from '../api'

export default function MarketPage({ server = 'level-infinite' }) {
  const [query, setQuery] = useState('')
  const market = useDataset('/api/v1/market/overview', server, marketRows)
  const rows = market.data.map((item) => Array.isArray(item) ? {
    name: item[0], price: item[1], change24h: Number.parseFloat(item[2]), direction: item[3],
  } : item).filter((item) => item.name.includes(query))
  return <div className="page-pad">
    <PageHeader title="物价参考" description="按当前服务器显示；没有授权上游时不会伪装成实时价格。" />
    <div className="toolbar"><label className="search-field"><Search /><input placeholder="搜索物品" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
    <section className="list-section"><div className="table-scroll"><table className="data-table"><thead><tr><th>物品</th><th>当前价格</th><th>24小时</th><th>数据状态</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id || row.name}><td><ItemName name={row.name} image={row.image} /></td><td><CurrencyAmount value={row.price} /></td><td className={(row.direction === 'up' || row.change24h > 0) ? 'positive' : 'negative'}>{Number(row.change24h || 0) > 0 ? '+' : ''}{Number(row.change24h || 0).toFixed(2)}%</td><td>{sourceLabel(market.meta)}</td></tr>)}</tbody></table></div>{!rows.length && <p className="empty-copy">当前服务器暂无已授权的市场概览。{market.meta.note}</p>}</section>
    <p className="data-note">{market.meta.note || sourceLabel(market.meta)}{market.meta.observedAt ? ` · ${new Date(market.meta.observedAt).toLocaleString('zh-CN')}` : ''}</p>
  </div>
}
