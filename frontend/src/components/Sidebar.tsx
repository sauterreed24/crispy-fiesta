import {
  LayoutDashboard, Users, Mail, Phone, BookOpen, Brain, Bot, Zap, ChevronRight
} from 'lucide-react'

export type Page = 'dashboard' | 'leads' | 'email' | 'calls' | 'knowledge' | 'memory' | 'personal-agent'

interface NavItem {
  id: Page
  label: string
  icon: React.ReactNode
  badge?: string
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'leads', label: 'Lead Intel', icon: <Users size={20} /> },
  { id: 'email', label: 'Email Studio', icon: <Mail size={20} /> },
  { id: 'calls', label: 'Call Coach', icon: <Phone size={20} /> },
  { id: 'knowledge', label: 'Product KB', icon: <BookOpen size={20} /> },
  { id: 'memory', label: 'Memory / CRM', icon: <Brain size={20} /> },
  { id: 'personal-agent', label: 'Personal Agent', icon: <Bot size={20} />, badge: 'New' },
]

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
  stats: { leads: number; conversations: number; emails: number; style_samples: number }
}

export default function Sidebar({ currentPage, onNavigate, stats }: SidebarProps) {
  return (
    <div className="w-64 flex-shrink-0 bg-slate-900 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Artemis SDR</p>
            <p className="text-slate-400 text-xs">AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-3 mx-3 mt-3 bg-slate-800 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-xs font-semibold">LIVE 24/7</span>
        </div>
        <p className="text-slate-400 text-xs">Claude Opus · Always ready</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              currentPage === item.id
                ? 'bg-amber-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && currentPage !== item.id && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-200">{item.badge}</span>
            )}
            {currentPage === item.id && <ChevronRight size={14} />}
          </button>
        ))}
      </nav>

      {/* Stats strip */}
      <div className="px-4 py-4 border-t border-slate-800">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Your Stats</p>
        <div className="grid grid-cols-2 gap-2">
          <StatChip label="Leads" value={stats.leads} />
          <StatChip label="Convos" value={stats.conversations} />
          <StatChip label="Emails" value={stats.emails} />
          <StatChip label="Styles" value={stats.style_samples} />
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800">
        <p className="text-slate-600 text-xs text-center">Built to make you rich ⚡</p>
      </div>
    </div>
  )
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-800 rounded-lg px-2 py-1.5 text-center">
      <p className="text-amber-400 font-bold text-sm">{value}</p>
      <p className="text-slate-500 text-xs">{label}</p>
    </div>
  )
}
