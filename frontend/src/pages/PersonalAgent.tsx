import { useState } from 'react'
import { Bot, Loader2, Sparkles } from 'lucide-react'
import { streamPost } from '../api'
import StreamingText from '../components/StreamingText'

export default function PersonalAgent() {
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('')
  const [topGoals, setTopGoals] = useState('')
  const [tools, setTools] = useState('ChatGPT, Cursor')
  const [researchDomains, setResearchDomains] = useState('')
  const [shoppingPreferences, setShoppingPreferences] = useState('')
  const [codingStack, setCodingStack] = useState('')
  const [privacyBoundaries, setPrivacyBoundaries] = useState('')
  const [output, setOutput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const handleGenerate = async () => {
    if (!fullName || !topGoals) return
    setOutput('')
    setIsStreaming(true)

    try {
      for await (const chunk of streamPost('/personal-agent/blueprint', {
        full_name: fullName,
        role,
        top_goals: topGoals,
        tools,
        research_domains: researchDomains,
        shopping_preferences: shoppingPreferences,
        coding_stack: codingStack,
        privacy_boundaries: privacyBoundaries,
      })) {
        setOutput(prev => prev + chunk)
      }
    } catch (e: any) {
      setOutput(`Error: ${e.message}`)
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="page-transition grid grid-cols-5 gap-6 h-full">
      <div className="col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h2 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Bot size={18} className="text-amber-500" />
            Personal Agent Builder
          </h2>
          <p className="text-xs text-slate-500">
            Build your ChatGPT-powered personal operating system for research, shopping, and better coding prompts.
          </p>

          <FormField label="Full Name *" value={fullName} onChange={setFullName} placeholder="e.g. Alex Carter" />
          <FormField label="Role" value={role} onChange={setRole} placeholder="e.g. Founder / Engineer" />

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Top Goals *</label>
            <textarea
              value={topGoals}
              onChange={e => setTopGoals(e.target.value)}
              rows={3}
              placeholder="What outcomes do you want this agent to drive over the next 90 days?"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
            />
          </div>

          <FormField label="Tools" value={tools} onChange={setTools} placeholder="ChatGPT, Cursor, Notion, Gmail..." />
          <FormField label="Research Domains" value={researchDomains} onChange={setResearchDomains} placeholder="e.g. AI tools, biotech, market trends" />
          <FormField label="Shopping Preferences" value={shoppingPreferences} onChange={setShoppingPreferences} placeholder="e.g. premium quality, low total cost" />
          <FormField label="Coding Stack" value={codingStack} onChange={setCodingStack} placeholder="e.g. TS/React/FastAPI, Rust" />

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Privacy Boundaries</label>
            <textarea
              value={privacyBoundaries}
              onChange={e => setPrivacyBoundaries(e.target.value)}
              rows={2}
              placeholder="What should never be stored/shared? Any compliance constraints?"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!fullName || !topGoals || isStreaming}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isStreaming ? <><Loader2 size={15} className="animate-spin" /> Building...</> : <><Sparkles size={15} /> Build My Agent System</>}
          </button>
        </div>
      </div>

      <div className="col-span-3">
        <div className="bg-white rounded-2xl border border-slate-200 h-full flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Personal Agent Blueprint</h3>
            <p className="text-slate-500 text-sm">Includes setup pack, operating model, coding prompt engine, and 30-day rollout plan.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {output ? (
              <StreamingText text={output} isStreaming={isStreaming} />
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bot size={32} className="text-amber-400" />
                  </div>
                  <p className="text-slate-700 font-semibold">Design your personal AI operating system</p>
                  <p className="text-slate-400 text-sm mt-1 max-w-md">
                    You&apos;ll get copy/paste prompts for research, shopping, and coding workflows plus realistic constraints for cross-app memory.
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
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
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
