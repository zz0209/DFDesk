import { useEffect, useState } from 'react'
import { PageHeader } from '../components/AppShell'
import { events } from '../data'
import { sourceLabel, useDataset } from '../api'

export default function EventsPage({ server = 'level-infinite' }) {
  const [filter, setFilter] = useState('全部')
  const [selected, setSelected] = useState(events[0])
  const eventData = useDataset('/api/v1/events', server, events)
  const visible = eventData.data.filter((item) => filter === '全部' || item.type === filter)

  useEffect(() => {
    if (eventData.data.length && !eventData.data.some((item) => (item.id || item.title) === (selected.id || selected.title))) setSelected(eventData.data[0])
  }, [eventData.data, selected.id, selected.title])

  return <div className="page-pad">
    <PageHeader title="活动信息" description="按时间查看进行中和即将开始的活动。" />
    <div className="filter-tabs">{['全部', '进行中', '即将结束', '即将开始', '官方公告'].map((item) => <button className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>
    <div className="content-split">
      <section className="simple-list event-list">
        {visible.map((item) => <button className={(selected.id || selected.title) === (item.id || item.title) ? 'selected' : ''} onClick={() => setSelected(item)} key={item.id || item.title}>
          <span><b>{item.title}</b><small>{item.type} · {item.mode}</small></span>
          <em>{item.time}</em>
        </button>)}
        {visible.length === 0 && <p className="empty-copy">当前分类暂无活动。</p>}
      </section>
      <aside className="detail-section">
        <p className="detail-type">{selected.type}</p>
        <h2>{selected.title}</h2>
        <p>{selected.summary || '活动期间完成指定行动，可获得对应奖励。'}</p>
        <dl className="detail-data">
          <div><dt>时间</dt><dd>{selected.time}</dd></div>
          <div><dt>影响模式</dt><dd>{selected.mode}</dd></div>
        </dl>
        {selected.url && <a className="secondary-button full source-link" href={selected.url} target="_blank" rel="noreferrer">查看原始公告</a>}
        <p className="data-note">{sourceLabel(eventData.meta)}{eventData.meta.observedAt ? ` · ${new Date(eventData.meta.observedAt).toLocaleString('zh-CN')}` : ''}</p>
      </aside>
    </div>
  </div>
}
