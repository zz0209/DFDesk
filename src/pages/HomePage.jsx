import { useState } from 'react'
import { ArrowRight, Boxes, CalendarDays, Check, Copy, Crosshair, Gamepad2, ShieldCheck, Target } from 'lucide-react'
import { SectionHead } from '../components/AppShell'
import { currentSeason } from '../data'
import { sourceLabel, useDataset } from '../api'

const tools = [
  ['gear', '卡战备', '输入门槛和预算，计算成本更低的方案。', ShieldCheck],
  ['blacksite', '特勤处生产', '比较配方成本、收益和生产时间。', Boxes],
  ['builds', '改枪码', '按武器与定位查找可用构筑。', Crosshair],
  ['missions', '赛季任务', '查看任务要求和需要保留的物品。', Target],
  ['events', '活动信息', '按时间查看正在进行和即将开始的活动。', CalendarDays],
  ['puzzle', '骇爪美图', '牢区等待时玩的图片拼图。', Gamepad2],
]

function CopyButton({ code }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard?.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }
  return <button className="copy-code" onClick={copy} aria-label={`复制密码 ${code}`}>{copied ? <Check /> : <Copy />}</button>
}

export default function HomePage({ onNavigate, server = 'level-infinite' }) {
  const passwordData = useDataset('/api/v1/passwords/today', server, [])
  return (
    <div className="home-page">
      <section className="season-hero">
        <img src="/assets/season-banner.png" alt="原创雪山工业区战术场景" />
        <div className="hero-copy">
          <h1>{currentSeason.id}：{currentSeason.name}</h1>
          <p>赛季任务、活动与 AZ3 资料已整理。</p>
          <button onClick={() => onNavigate('missions')}>查看赛季任务 <ArrowRight /></button>
        </div>
      </section>

      <section className="home-section">
        <SectionHead title="今日密码" meta={`${sourceLabel(passwordData.meta)}${passwordData.meta.observedAt ? ` · ${new Date(passwordData.meta.observedAt).toLocaleString('zh-CN')}` : ''}`} />
        <div className="password-strip">
          {passwordData.data.map((item) => (
            <div className={`password-cell map-${item.tone}`} key={item.map}>
              <span>{item.map}</span>
              <div><b>{item.code}</b><CopyButton code={item.code} /></div>
              <small>{item.date || '更新时间待上游确认'}{item.refreshLabel ? ` · ${item.refreshLabel}` : ''}</small>
            </div>
          ))}
          {!passwordData.data.length && <p className="password-empty">当前服务器暂无已验证的今日密码来源。{passwordData.meta.note}</p>}
        </div>
      </section>

      <section className="home-section tools-section">
        <SectionHead title="实用工具" />
        <div className="tool-list">
          {tools.map(([id, title, description, Icon]) => (
            <button key={id} onClick={() => onNavigate(id)}>
              <Icon />
              <span><b>{title}</b><small>{description}</small></span>
              <ArrowRight />
            </button>
          ))}
        </div>
      </section>

      <footer className="app-footer">烽火作战台 · 数据来源和新鲜度以各模块标记为准</footer>
    </div>
  )
}
