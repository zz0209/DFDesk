import { useEffect, useState } from 'react'
import { Check, LockKeyhole, Target } from 'lucide-react'
import { PageHeader } from '../components/AppShell'
import { ItemName } from '../components/GameAssets'
import { missions } from '../data'
import { sourceLabel, useDataset } from '../api'

export default function MissionsPage({ server = 'level-infinite' }) {
  const missionData = useDataset('/api/v1/missions', server, missions)
  const [items, setItems] = useState(missions)
  const [selected, setSelected] = useState(missions[2])
  const toggle = (id) => setItems((current) => current.map((item) => item.id === id ? { ...item, state: item.state === 'done' ? 'active' : 'done' } : item))

  useEffect(() => {
    setItems(missionData.data)
    setSelected((current) => missionData.data.some((item) => item.id === current.id) ? current : missionData.data[0] || current)
  }, [missionData.data])

  return <div className="page-pad">
    <PageHeader title="赛季任务" description="查看任务要求、前置关系和需要保留的物品。" />
    <div className="content-split">
      <section className="simple-list mission-list">
        {items.map((item) => <button className={selected.id === item.id ? 'selected' : ''} onClick={() => setSelected(item)} key={item.id}>
          {item.state === 'done' ? <Check /> : item.state === 'locked' ? <LockKeyhole /> : <Target />}
          <span><b>{item.title}</b><small>{item.chapter} · {item.req}</small></span>
          <em>{item.state === 'done' ? '已完成' : item.state === 'locked' ? '未解锁' : '进行中'}</em>
        </button>)}
      </section>
      <aside className="detail-section">
        <p className="detail-type">{selected.chapter}</p>
        <h2>{selected.title}</h2>
        <p>{selected.req}</p>
        <dl className="detail-data">
          <div><dt>指定地图</dt><dd>{selected.id > 2 ? 'AZ3' : '零号大坝'}</dd></div>
          <div><dt>物品需求</dt><dd>{selected.item ? <ItemName name={selected.item.name} detail={`×${selected.item.count}`} /> : '无'}</dd></div>
          <div><dt>任务状态</dt><dd>{selected.state === 'done' ? '已完成' : selected.state === 'locked' ? '未解锁' : '进行中'}</dd></div>
        </dl>
        <h3>目标</h3>
        <ul className="check-list">{['进入指定区域', '完成主要行动目标', '成功撤离并上交情报'].map((item, index) => <li key={item}><input type="checkbox" defaultChecked={selected.state === 'done' || index === 0} />{item}</li>)}</ul>
        <button className="primary-button full" disabled={selected.state === 'locked'} onClick={() => toggle(selected.id)}>{selected.state === 'done' ? '标记为未完成' : '标记完成'}</button>
        <p className="data-note">{sourceLabel(missionData.meta)} · 正式版本按赛季数据校验</p>
      </aside>
    </div>
  </div>
}
