import { useState, useEffect } from 'react'
import { Search, Save, Trash2, ChevronDown, ChevronUp, Loader2, UserPlus } from 'lucide-react'
import { streamPost, get, post, del } from '../api'
import StreamingText from '../components/StreamingText'

interface Lead {
  id: number
  name: string
  company: string
  title: string
  notes: string
  research: string
  created_at: string
}

export default function Leads({ onStatsRefresh }: { onStatsRefresh: () => void }) {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [title, setTitle] = useState('')
  const [context, setContext] = useState('')
  const [output, setOutput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadLeads() }, [])

  const loadLeads = async (q = '') => {
    const data = await get<Lead[]>(`/leads${q ? `?search=${encodeURIComponent(q)}` : ''}`)
    setLeads(data)
  }

  const handleResearch = async () => {
    if (!name || !company) return
    setOutput('')
    setIsStreaming(true)
    try {
      for await (const chunk of streamPost('/leads/research', { name, company, title, context })) {
        setOutput(prev => prev + chunk)
      }
    } catch (e: any) {
      setOutput(`Error: ${e.message}`)
    } finally {
      setIsStreaming(false)
    }
  }

  const handleSave = async () => {
    if (!name || !company) return
    setSaving(true)
    try {
      await post('/leads/save', { name, company, title, notes: context, research: output })
      await loadLeads()
      onStatsRefresh()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    await del(`/leads/${id}`)
    setLeads(prev => prev.filter(l => l.id !== id))
    onStatsRefresh()
  }

  return (
    <div className="page-transition grid grid-cols-5 gap-6 h-full">
      {/* Left: Research Form */}
      <div className="col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-amber-500" />
            Research a Lead
          </h2>

          <div className="space-y-3">
            <FormField label="Full Name *" value={name} onChange={setName} placeholder="e.g. Sarah Johnson" />
            <FormField label="Company *" value={company} onChange={setCompany} placeholder="e.g. Acme Corp" />
            <FormField label="Title" value={title} onChange={setTitle} placeholder="e.g. VP of Operations" />
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Additional Context
              </label>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="LinkedIn notes, mutual connections, recent news, why they're a good fit..."
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
              />
            </div>

            <button
              onClick={handleResearch}
              disabled={!name || !company || isStreaming}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isStreaming ? <><Loader2 size={15} className="animate-spin" /> Researching...</> : '⚡ Research Lead'}
            </button>
          </div>
        </div>

        {/* Saved leads */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Saved Leads ({leads.length})</h3>
            <div className="mt-2 relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); loadLeads(e.target.value) }}
                placeholder="Search leads..."
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
              />
            </div>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {leads.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-6">No leads yet</p>
            ) : (
              leads.map(lead => (
                <div key={lead.id}>
                  <button
                    onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{lead.name}</p>
                      <p className="text-xs text-slate-500">{lead.company}{lead.title ? ` · ${lead.title}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(lead.id) }}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      {expandedId === lead.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </button>
                  {expandedId === lead.id && lead.research && (
                    <div className="px-4 pb-3 bg-slate-50 border-t border-slate-100">
                      <div className="text-xs text-slate-600 max-h-40 overflow-y-auto whitespace-pre-wrap pt-2">
                        {lead.research.slice(0, 500)}...
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right: Research Output */}
      <div className="col-span-3">
        <div className="bg-white rounded-2xl border border-slate-200 h-full flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="font-bold text-slate-900">Lead Intelligence Report</h3>
              {name && company && (
                <p className="text-slate-500 text-sm">{name} · {company}</p>
              )}
            </div>
            {output && !isStreaming && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Save size={14} />
                {saving ? 'Saving...' : 'Save Lead'}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {output ? (
              <StreamingText text={output} isStreaming={isStreaming} />
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search size={32} className="text-amber-400" />
                  </div>
                  <p className="text-slate-700 font-semibold">Enter a lead to research</p>
                  <p className="text-slate-400 text-sm mt-1 max-w-xs">
                    Get personalization hooks, pain points, talk tracks, and objection handles — all in seconds.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
      />
    </div>
  )
}
