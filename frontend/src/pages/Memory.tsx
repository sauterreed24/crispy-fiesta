import { useState, useEffect } from 'react'
import { Brain, Plus, Trash2, Search, Sparkles, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react'
import { get, post, del, streamPost, formatDate } from '../api'
import StreamingText from '../components/StreamingText'

interface Conversation {
  id: number
  prospect_name: string
  company: string
  call_date: string
  outcome: string
  notes: string
  next_steps: string
  created_at: string
}

const OUTCOMES = [
  'Booked meeting ✅',
  'Not interested ❌',
  'Follow up needed 🔄',
  'Voicemail 📞',
  'Gatekeeper 🚧',
  'No answer 📵',
  'Callback requested ⏰',
  'Referral given 🤝',
]

export default function Memory({ onStatsRefresh }: { onStatsRefresh: () => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const [synthesisName, setSynthesisName] = useState('')
  const [synthesisCompany, setSynthesisCompany] = useState('')
  const [synthesisOutput, setSynthesisOutput] = useState('')
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [showSynthesis, setShowSynthesis] = useState(false)

  const [form, setForm] = useState({
    prospect_name: '',
    company: '',
    call_date: new Date().toISOString().split('T')[0],
    outcome: 'Not interested ❌',
    notes: '',
    next_steps: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadConversations() }, [])

  const loadConversations = async (q = '') => {
    const data = await get<Conversation[]>(`/memory/conversations${q ? `?search=${encodeURIComponent(q)}` : ''}`)
    setConversations(data)
  }

  const handleSave = async () => {
    if (!form.prospect_name || !form.company) return
    setSaving(true)
    try {
      await post('/memory/conversations', form)
      setForm({
        prospect_name: '',
        company: '',
        call_date: new Date().toISOString().split('T')[0],
        outcome: 'Not interested ❌',
        notes: '',
        next_steps: '',
      })
      setShowForm(false)
      await loadConversations()
      onStatsRefresh()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    await del(`/memory/conversations/${id}`)
    setConversations(prev => prev.filter(c => c.id !== id))
    onStatsRefresh()
  }

  const handleSynthesize = async () => {
    if (!synthesisName && !synthesisCompany) return
    setSynthesisOutput('')
    setIsSynthesizing(true)
    setShowSynthesis(true)
    try {
      for await (const chunk of streamPost('/memory/synthesize', {
        prospect_name: synthesisName,
        company: synthesisCompany
      })) {
        setSynthesisOutput(prev => prev + chunk)
      }
    } catch (e: any) {
      setSynthesisOutput(`Error: ${e.message}. Make sure you have conversations logged for this prospect.`)
    } finally {
      setIsSynthesizing(false)
    }
  }

  const outcomeColor = (outcome: string) => {
    if (outcome.includes('✅')) return 'bg-green-100 text-green-700'
    if (outcome.includes('❌')) return 'bg-red-100 text-red-700'
    if (outcome.includes('🔄')) return 'bg-blue-100 text-blue-700'
    return 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="page-transition space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Brain size={18} className="text-amber-500" />
            Memory & CRM
          </h2>
          <p className="text-slate-500 text-sm">{conversations.length} interactions logged</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          Log Interaction
        </button>
      </div>

      {/* AI Synthesis */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Sparkles size={15} className="text-amber-500" />
            AI Synthesis — Know Your Prospect Cold
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">Enter a prospect name to get a full synthesis of all past interactions</p>
        </div>
        <div className="p-4">
          <div className="flex gap-3">
            <input
              value={synthesisName}
              onChange={e => setSynthesisName(e.target.value)}
              placeholder="Prospect name"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
            />
            <input
              value={synthesisCompany}
              onChange={e => setSynthesisCompany(e.target.value)}
              placeholder="Company"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
            />
            <button
              onClick={handleSynthesize}
              disabled={(!synthesisName && !synthesisCompany) || isSynthesizing}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              {isSynthesizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Synthesize
            </button>
          </div>

          {showSynthesis && synthesisOutput && (
            <div className="mt-4 bg-slate-50 rounded-xl border border-slate-200 p-4 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Synthesis: {synthesisName} · {synthesisCompany}
                </p>
                <button onClick={() => setShowSynthesis(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              </div>
              <StreamingText text={synthesisOutput} isStreaming={isSynthesizing} />
            </div>
          )}
        </div>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-amber-200 p-5 amber-glow">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Log New Interaction</h3>
          <div className="grid grid-cols-2 gap-4">
            <LogField label="Prospect Name *" value={form.prospect_name} onChange={v => setForm({...form, prospect_name: v})} placeholder="Sarah Johnson" />
            <LogField label="Company *" value={form.company} onChange={v => setForm({...form, company: v})} placeholder="Acme Corp" />
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
              <input
                type="date"
                value={form.call_date}
                onChange={e => setForm({...form, call_date: e.target.value})}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Outcome</label>
              <select
                value={form.outcome}
                onChange={e => setForm({...form, outcome: e.target.value})}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
              >
                {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="What happened? Key things they said? Pain points discovered?"
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Next Steps</label>
              <input
                value={form.next_steps}
                onChange={e => setForm({...form, next_steps: e.target.value})}
                placeholder="e.g. Follow up Tuesday, send case study, book demo..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={!form.prospect_name || !form.company || saving}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              {saving ? 'Saving...' : 'Save Interaction'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-700 px-4 py-2.5 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); loadConversations(e.target.value) }}
          placeholder="Search by name, company, or notes..."
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
        />
      </div>

      {/* Conversations list */}
      <div className="space-y-2">
        {conversations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <Brain size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-600 font-semibold">No interactions logged yet</p>
            <p className="text-slate-400 text-sm mt-1">Log every call, email, and touchpoint to build your prospect memory.</p>
          </div>
        ) : (
          conversations.map(conv => (
            <div key={conv.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === conv.id ? null : conv.id)}
                className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition-colors flex items-center gap-4"
              >
                <div className="flex-1 grid grid-cols-4 items-center gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{conv.prospect_name}</p>
                    <p className="text-xs text-slate-500">{conv.company}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-fit ${outcomeColor(conv.outcome)}`}>
                    {conv.outcome}
                  </span>
                  <p className="text-xs text-slate-500">{formatDate(conv.call_date)}</p>
                  {conv.next_steps && (
                    <p className="text-xs text-slate-600 truncate">→ {conv.next_steps}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(conv.id) }}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  {expandedId === conv.id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </div>
              </button>

              {expandedId === conv.id && (
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{conv.notes || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Next Steps</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{conv.next_steps || '—'}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 flex gap-3">
                    <button
                      onClick={() => {
                        setSynthesisName(conv.prospect_name)
                        setSynthesisCompany(conv.company)
                        handleSynthesize()
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium"
                    >
                      <Sparkles size={12} />
                      Synthesize this prospect
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function LogField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
      />
    </div>
  )
}
