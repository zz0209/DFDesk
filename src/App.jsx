import { useEffect, useState } from 'react'
import AppShell, { serverOptions } from './components/AppShell'
import HomePage from './pages/HomePage'
import GearPage from './pages/GearPage'
import BlackSitePage from './pages/BlackSitePage'
import BuildsPage from './pages/BuildsPage'
import MissionsPage from './pages/MissionsPage'
import EventsPage from './pages/EventsPage'
import PuzzlePage from './pages/PuzzlePage'
import MarketPage from './pages/MarketPage'

const pageMap = {
  home: HomePage,
  market: MarketPage,
  gear: GearPage,
  blacksite: BlackSitePage,
  builds: BuildsPage,
  missions: MissionsPage,
  events: EventsPage,
  puzzle: PuzzlePage,
}

export default function App() {
  const [page, setPage] = useState(() => location.hash.slice(1) || 'home')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [server, setServer] = useState(() => {
    const saved = localStorage.getItem('operations-server')
    return serverOptions.some((item) => item.id === saved) ? saved : 'level-infinite'
  })

  useEffect(() => {
    const sync = () => setPage(location.hash.slice(1) || 'home')
    addEventListener('hashchange', sync)
    return () => removeEventListener('hashchange', sync)
  }, [])

  useEffect(() => localStorage.setItem('operations-server', server), [server])

  const navigate = (next) => {
    location.hash = next === 'home' ? '' : next
    setPage(next)
    scrollTo({ top: 0, behavior: 'smooth' })
  }

  const Page = pageMap[page] || HomePage
  return (
    <AppShell page={page} onNavigate={navigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} server={server} setServer={setServer}>
      <Page onNavigate={navigate} server={server} />
    </AppShell>
  )
}
