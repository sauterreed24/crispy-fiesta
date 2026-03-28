import { useState, useEffect, useCallback } from 'react'
import Sidebar, { Page } from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import EmailStudio from './pages/EmailStudio'
import CallCoach from './pages/CallCoach'
import Knowledge from './pages/Knowledge'
import Memory from './pages/Memory'
import PersonalAgent from './pages/PersonalAgent'
import { get } from './api'

interface Stats {
  leads: number
  conversations: number
  emails: number
  style_samples: number
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [stats, setStats] = useState<Stats>({ leads: 0, conversations: 0, emails: 0, style_samples: 0 })

  const loadStats = useCallback(async () => {
    try {
      const data = await get<Stats>('/stats')
      setStats(data)
    } catch {
      // Backend not ready yet
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const renderPage = () => {
    const key = page // force remount on page change for animation
    switch (page) {
      case 'dashboard':
        return <Dashboard key={key} stats={stats} />
      case 'leads':
        return <Leads key={key} onStatsRefresh={loadStats} />
      case 'email':
        return <EmailStudio key={key} onStatsRefresh={loadStats} />
      case 'calls':
        return <CallCoach key={key} />
      case 'knowledge':
        return <Knowledge key={key} />
      case 'memory':
        return <Memory key={key} onStatsRefresh={loadStats} />
      case 'personal-agent':
        return <PersonalAgent key={key} />
    }
  }

  const pageTitle: Record<Page, string> = {
    dashboard: 'Command Center',
    leads: 'Lead Intelligence',
    email: 'Email Studio',
    calls: 'Call Coach',
    knowledge: 'Product Knowledge',
    memory: 'Memory & CRM',
    'personal-agent': 'Personal Agent Builder',
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentPage={page} onNavigate={setPage} stats={stats} />

      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-slate-900">{pageTitle[page]}</h1>
            <p className="text-slate-400 text-xs">Powered by Claude Opus · Artemis Distribution</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-slate-500 font-medium">AI Online</span>
          </div>
        </div>

        {/* Page content */}
        <div className="p-6">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}
