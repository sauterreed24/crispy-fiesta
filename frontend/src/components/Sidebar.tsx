import { Brain, FlaskConical, BookOpen, Target, Hammer, Library, ChevronRight, Zap, Flame } from 'lucide-react'
import type { Progress } from '../App'

export type Page = 'dashboard' | 'prompt-lab' | 'knowledge' | 'challenges' | 'skill-builder' | 'library'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
  progress: Progress
}

const navItems: { id: Page; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Brain },
  { id: 'prompt-lab', label: 'Prompt Lab', icon: FlaskConical },
  { id: 'knowledge', label: 'Knowledge Hub', icon: BookOpen },
  { id: 'challenges', label: 'Challenges', icon: Target },
  { id: 'skill-builder', label: 'Skill Builder', icon: Hammer },
  { id: 'library', label: 'Prompt Library', icon: Library },
]

interface LevelInfo {
  level: number
  title: string
  currentXP: number
  nextXP: number
}

function getLevel(xp: number): LevelInfo {
  const thresholds = [
    { xp: 0, title: 'Novice' },
    { xp: 100, title: 'Apprentice' },
    { xp: 300, title: 'Practitioner' },
    { xp: 600, title: 'Specialist' },
    { xp: 1000, title: 'Expert' },
    { xp: 2000, title: 'Master' },
    { xp: 4000, title: 'Grandmaster' },
    { xp: 8000, title: 'Legend' },
  ]
  let idx = 0
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i].xp) idx = i
  }
  const nextXP = idx < thresholds.length - 1 ? thresholds[idx + 1].xp : thresholds[idx].xp + 10000
  return { level: idx + 1, title: thresholds[idx].title, currentXP: xp, nextXP }
}

export default function Sidebar({ currentPage, onNavigate, progress }: SidebarProps) {
  const { level, title, currentXP, nextXP } = getLevel(progress.total_xp)
  const xpPct = Math.min(100, Math.round((currentXP / nextXP) * 100))

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0 flex-shrink-0">
      {/* Brand */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-900/40">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">AI Mastery Hub</p>
            <p className="text-gray-500 text-xs">Prompt Engineer Pro</p>
          </div>
        </div>

        {/* XP / Level card */}
        <div className="bg-gray-800/80 rounded-xl p-3 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-violet-400">Lv.{level}</span>
              <span className="text-xs text-gray-400">{title}</span>
            </div>
            <span className="text-xs text-gray-500">{currentXP} XP</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2.5">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-700"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-gray-400">{progress.current_streak} day streak</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-gray-400">{progress.challenges_completed} done</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
              currentPage === id
                ? 'bg-violet-600/90 text-white shadow-lg shadow-violet-900/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Icon className={`w-4 h-4 flex-shrink-0 transition-transform ${currentPage === id ? '' : 'group-hover:scale-110'}`} />
            <span className="flex-1 text-left">{label}</span>
            {currentPage === id && <ChevronRight className="w-3 h-3 opacity-70" />}
          </button>
        ))}
      </nav>

      {/* Stats strip */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-gray-600 text-xs font-semibold uppercase tracking-widest mb-3">Activity</p>
        <div className="grid grid-cols-3 gap-2">
          <StatChip label="Prompts" value={progress.prompts_evaluated} color="violet" />
          <StatChip label="Queries" value={progress.knowledge_queries} color="cyan" />
          <StatChip label="Wins" value={progress.challenges_completed} color="emerald" />
        </div>
      </div>

      <div className="px-4 pb-4">
        <p className="text-gray-700 text-xs text-center">Level up every day ⚡</p>
      </div>
    </aside>
  )
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    violet: 'text-violet-400',
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
  }
  return (
    <div className="bg-gray-800 rounded-lg p-2 text-center">
      <p className={`font-bold text-sm ${colorMap[color] || 'text-white'}`}>{value}</p>
      <p className="text-gray-500 text-xs">{label}</p>
    </div>
  )
}
