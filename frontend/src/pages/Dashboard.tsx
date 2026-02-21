import { useState } from 'react'
import { Zap, Target, TrendingUp, Coffee, RefreshCw } from 'lucide-react'
import { streamPost } from '../api'
import StreamingText from '../components/StreamingText'

interface DashboardProps {
  stats: { leads: number; conversations: number; emails: number; style_samples: number }
}

export default function Dashboard({ stats }: DashboardProps) {
  const [goals, setGoals] = useState('10 dials, 3 meetings booked')
  const [brief, setBrief] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const generateBrief = async () => {
    setBrief('')
    setIsStreaming(true)
    try {
      for await (const chunk of streamPost('/dashboard/brief', { goals })) {
        setBrief(prev => prev + chunk)
      }
    } catch (e) {
      setBrief('Error generating brief. Check your API key.')
    } finally {
      setIsStreaming(false)
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })

  return (
    <div className="page-transition space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 right-4 w-40 h-40 bg-amber-400 rounded-full blur-3xl" />
          <div className="absolute bottom-4 left-4 w-32 h-32 bg-amber-600 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <p className="text-slate-400 text-sm">{today}</p>
          <h1 className="text-2xl font-bold mt-1">
            Ready to <span className="text-amber-400">crush it?</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Artemis Distribution · SDR Command Center
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<Target size={20} />} label="Leads Saved" value={stats.leads} color="blue" />
        <StatCard icon={<Coffee size={20} />} label="Convos Logged" value={stats.conversations} color="purple" />
        <StatCard icon={<Zap size={20} />} label="Emails Written" value={stats.emails} color="amber" />
        <StatCard icon={<TrendingUp size={20} />} label="Style Samples" value={stats.style_samples} color="green" />
      </div>

      {/* Daily Brief */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Daily Brief</h2>
            <p className="text-slate-500 text-sm">Your AI-powered morning game plan</p>
          </div>
          <button
            onClick={generateBrief}
            disabled={isStreaming}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <RefreshCw size={15} className={isStreaming ? 'animate-spin' : ''} />
            {isStreaming ? 'Generating...' : brief ? 'Regenerate' : 'Generate Brief'}
          </button>
        </div>

        {/* Goals input */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Today's Goals
          </label>
          <input
            value={goals}
            onChange={e => setGoals(e.target.value)}
            placeholder="e.g. 10 dials, 3 meetings booked"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
          />
        </div>

        {/* Brief output */}
        <div className="p-6">
          {brief ? (
            <StreamingText text={brief} isStreaming={isStreaming} />
          ) : (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap size={28} className="text-amber-500" />
              </div>
              <p className="text-slate-700 font-semibold">Start your day right</p>
              <p className="text-slate-400 text-sm mt-1">
                Hit "Generate Brief" to get your AI-powered daily game plan
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick tips */}
      <div className="grid grid-cols-3 gap-4">
        <TipCard
          title="The 10/2/1 Rule"
          body="For every 10 dials: 2 conversations, 1 qualified meeting. Track it daily to spot gaps."
        />
        <TipCard
          title="Power Hour"
          body="Best call times: 8-9am and 4-5pm. Decision makers pick up 40% more during these windows."
        />
        <TipCard
          title="The 5-Touch Rule"
          body="80% of meetings are booked after the 5th touch. Most reps quit after 2. Don't be most reps."
        />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-slate-500 text-sm mt-0.5">{label}</p>
    </div>
  )
}

function TipCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
        <p className="font-semibold text-slate-900 text-sm">{title}</p>
      </div>
      <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
    </div>
  )
}
