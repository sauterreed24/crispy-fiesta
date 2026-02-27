import { Brain, FlaskConical, BookOpen, Target, Hammer, Library, Zap, TrendingUp, Star, ChevronRight, Award } from 'lucide-react'
import type { Progress } from '../App'
import type { Page } from '../components/Sidebar'

interface DashboardProps {
  progress: Progress
  onNavigate: (page: Page) => void
}

const TECHNIQUES = [
  { name: 'Chain of Thought', tag: 'CoT', desc: 'Elicit step-by-step reasoning by asking the model to think through a problem before answering.', difficulty: 'Beginner', color: 'violet' },
  { name: 'Few-Shot Learning', tag: 'FSL', desc: 'Provide 2–5 input/output examples to demonstrate the exact behavior you want.', difficulty: 'Beginner', color: 'cyan' },
  { name: 'System Prompt Design', tag: 'SYS', desc: 'Architect the system prompt to set persona, constraints, and output conventions.', difficulty: 'Intermediate', color: 'amber' },
  { name: 'Tree of Thought', tag: 'ToT', desc: 'Have the model explore multiple reasoning paths and evaluate/select the best one.', difficulty: 'Advanced', color: 'emerald' },
  { name: 'Self-Consistency', tag: 'SC', desc: 'Sample multiple reasoning chains and pick the most common answer for higher accuracy.', difficulty: 'Intermediate', color: 'rose' },
  { name: 'ReAct', tag: 'ReAct', desc: 'Interleave reasoning (Thought) and action (Act) steps for agentic tasks with tool use.', difficulty: 'Advanced', color: 'orange' },
  { name: 'Structured Output', tag: 'JSON', desc: 'Constrain model output to JSON, XML, or custom formats for programmatic use.', difficulty: 'Beginner', color: 'teal' },
  { name: 'Meta-Prompting', tag: 'META', desc: 'Use the model to generate or improve prompts — prompt the prompter.', difficulty: 'Expert', color: 'purple' },
]

const QUICK_ACTIONS = [
  { page: 'prompt-lab' as Page, icon: FlaskConical, label: 'Evaluate a Prompt', desc: 'Get expert-level analysis of your prompt', color: 'from-violet-600 to-purple-700' },
  { page: 'challenges' as Page, icon: Target, label: 'Take a Challenge', desc: 'Test your skills, earn XP', color: 'from-cyan-600 to-blue-700' },
  { page: 'knowledge' as Page, icon: BookOpen, label: 'Learn a Concept', desc: 'Deep-dive into AI/ML topics', color: 'from-emerald-600 to-teal-700' },
  { page: 'skill-builder' as Page, icon: Hammer, label: 'Build a Skill', desc: 'Get a personalized learning roadmap', color: 'from-amber-600 to-orange-700' },
]

const LEVEL_TITLES = ['Novice', 'Apprentice', 'Practitioner', 'Specialist', 'Expert', 'Master', 'Grandmaster', 'Legend']
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 2000, 4000, 8000]

function getLevel(xp: number) {
  let idx = 0
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) idx = i
  }
  const nextXP = idx < LEVEL_THRESHOLDS.length - 1 ? LEVEL_THRESHOLDS[idx + 1] : LEVEL_THRESHOLDS[idx] + 10000
  const prevXP = LEVEL_THRESHOLDS[idx]
  const pct = Math.min(100, Math.round(((xp - prevXP) / (nextXP - prevXP)) * 100))
  return { level: idx + 1, title: LEVEL_TITLES[idx], nextXP, pct }
}

const tagColorMap: Record<string, string> = {
  violet: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rose: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  teal: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
}

const difficultyColor: Record<string, string> = {
  Beginner: 'text-emerald-400',
  Intermediate: 'text-amber-400',
  Advanced: 'text-orange-400',
  Expert: 'text-rose-400',
}

export default function Dashboard({ progress, onNavigate }: DashboardProps) {
  const { level, title, nextXP, pct } = getLevel(progress.total_xp)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">{greeting} — let's get smarter</p>
            <h1 className="text-2xl font-bold text-white mb-2">AI Mastery Hub</h1>
            <p className="text-gray-400 text-sm max-w-lg">
              Your personal prompt engineering training ground. Learn techniques used by researchers at Anthropic, OpenAI, and Google — then practice until you're better than them.
            </p>
          </div>
          <div className="flex-shrink-0 ml-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center min-w-[120px]">
              <div className="text-3xl font-black text-white mb-1">Lv.{level}</div>
              <div className="text-violet-400 text-sm font-semibold mb-2">{title}</div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">{progress.total_xp} / {nextXP} XP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total XP', value: progress.total_xp, icon: Zap, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { label: 'Prompts Evaluated', value: progress.prompts_evaluated, icon: FlaskConical, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
          { label: 'Challenges Won', value: progress.challenges_completed, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Day Streak', value: progress.current_streak, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} border rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-gray-400 text-xs">{label}</span>
            </div>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-amber-400" />
          <h2 className="text-white font-bold">Quick Start</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(({ page, icon: Icon, label, desc, color }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 text-left transition-all group hover:shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-semibold text-sm">{label}</p>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Techniques reference */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-400" />
            <h2 className="text-white font-bold">Core Techniques</h2>
          </div>
          <button
            onClick={() => onNavigate('prompt-lab')}
            className="text-violet-400 text-xs hover:text-violet-300 transition-colors flex items-center gap-1"
          >
            Practice in Lab <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {TECHNIQUES.map((t) => (
            <div
              key={t.name}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${tagColorMap[t.color]}`}>
                  {t.tag}
                </span>
                <span className={`text-xs ${difficultyColor[t.difficulty]}`}>{t.difficulty}</span>
              </div>
              <p className="text-white font-semibold text-sm mb-1">{t.name}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mastery path */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-4 h-4 text-amber-400" />
          <h2 className="text-white font-bold">Your Mastery Path</h2>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {LEVEL_TITLES.map((lvlTitle, i) => {
            const isCompleted = level > i + 1
            const isCurrent = level === i + 1
            return (
              <div key={lvlTitle} className="flex items-center gap-2 flex-shrink-0">
                <div className={`flex flex-col items-center gap-1 ${isCompleted || isCurrent ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    isCompleted ? 'bg-violet-600 border-violet-500 text-white' :
                    isCurrent ? 'bg-gray-800 border-violet-500 text-violet-400' :
                    'bg-gray-800 border-gray-700 text-gray-500'
                  }`}>
                    {isCompleted ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs ${isCurrent ? 'text-violet-400 font-semibold' : 'text-gray-500'}`}>
                    {lvlTitle}
                  </span>
                </div>
                {i < LEVEL_TITLES.length - 1 && (
                  <div className={`w-8 h-0.5 flex-shrink-0 ${isCompleted ? 'bg-violet-600' : 'bg-gray-700'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation shortcuts */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { page: 'knowledge' as Page, icon: BookOpen, label: 'Knowledge Hub', desc: 'Ask any AI/ML question', xp: '+5 XP' },
          { page: 'challenges' as Page, icon: Target, label: 'Daily Challenge', desc: 'Sharpen your prompting', xp: '+25 XP' },
          { page: 'library' as Page, icon: Library, label: 'Prompt Library', desc: 'Browse & save prompts', xp: 'Free' },
        ].map(({ page, icon: Icon, label, desc, xp }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 text-left transition-all group"
          >
            <Icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors mb-3" />
            <p className="text-white text-sm font-semibold">{label}</p>
            <p className="text-gray-500 text-xs mb-2">{desc}</p>
            <span className="text-xs font-medium text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">{xp}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
