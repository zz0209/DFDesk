import {
  Boxes,
  CalendarDays,
  Crosshair,
  Gamepad2,
  Home,
  Languages,
  Menu,
  Server,
  ShieldCheck,
  Target,
  X,
} from 'lucide-react'
import TacticalSelect from './TacticalSelect'

const navItems = [
  ['home', '首页', Home],
  ['gear', '卡战备', ShieldCheck],
  ['blacksite', '特勤处', Boxes],
  ['builds', '改枪码', Crosshair],
  ['missions', '赛季任务', Target],
  ['events', '活动', CalendarDays],
  ['puzzle', '休息区', Gamepad2],
]

export const serverOptions = [
  { id: 'cn', name: '国服' },
  { id: 'level-infinite', name: 'Level Infinite' },
  { id: 'garena', name: 'Garena' },
]

export function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><i /><i /></span>
}

function Navigation({ page, onNavigate, mobile = false }) {
  return (
    <nav className={mobile ? 'mobile-navigation' : 'rail-navigation'} aria-label="主要导航">
      {navItems.map(([id, label, Icon]) => (
        <button
          key={id}
          className={page === id ? 'active' : ''}
          onClick={() => onNavigate(id)}
          aria-current={page === id ? 'page' : undefined}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

export default function AppShell({ page, onNavigate, children, mobileOpen, setMobileOpen, server, setServer }) {
  const currentLabel = navItems.find(([id]) => id === page)?.[1] || '首页'
  const navigate = (next) => {
    onNavigate(next)
    setMobileOpen(false)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" onClick={() => navigate('home')}>
            <BrandMark /><span>烽火作战台</span>
          </button>
          <span className="current-section">{currentLabel}</span>
          <TacticalSelect className="server-picker" icon={Server} meta="服务器" value={server} onChange={setServer} ariaLabel="选择服务器" options={serverOptions.map((item) => ({ value: item.id, label: item.name }))} />
          <TacticalSelect className="language-button" icon={Languages} value="zh-CN" ariaLabel="选择语言" options={[{ value: 'zh-CN', label: '简体中文' }]} />
          <button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? '关闭导航' : '打开导航'} aria-expanded={mobileOpen}>
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <aside className="desktop-rail">
        <Navigation page={page} onNavigate={navigate} />
      </aside>

      <div className={`mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        <Navigation page={page} onNavigate={navigate} mobile />
      </div>

      <main className="main-content">{children}</main>
    </div>
  )
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="page-header">
      <div><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

export function SectionHead({ title, meta, action }) {
  return (
    <div className="section-head">
      <div><h2>{title}</h2>{meta && <span>{meta}</span>}</div>
      {action}
    </div>
  )
}
