import { useCallback, useEffect, useRef, useState } from 'react'
import { Bot, Loader2, Sparkles, X } from 'lucide-react'
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
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!fullName.trim() || !topGoals.trim()) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setOutput('')
    setIsStreaming(true)

    try {
      for await (const chunk of streamPost(
        '/personal-agent/blueprint',
        {
          full_name: fullName.trim(),
          role: role.trim(),
          top_goals: topGoals.trim(),
          tools: tools.trim(),
          research_domains: researchDomains.trim(),
          shopping_preferences: shoppingPreferences.trim(),
          coding_stack: codingStack.trim(),
          privacy_boundaries: privacyBoundaries.trim(),
        },
        controller.signal,
      )) {
        setOutput(prev => prev + chunk)
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setOutput(`Error: ${e.message}`)
      }
    } finally {
      setIsStreaming(false)
      if (abortRef.current === controller) abortRef.current = null
    }
  }, [codingStack, fullName, privacyBoundaries, researchDomains, role, shoppingPreferences, tools, topGoals])

  const handleCancel = () => abortRef.current?.abort()

  return (
    <div className="flex flex-col md:flex-row md:h-full">
      {/* Left panel: form */}
      <div className="flex flex-col border-b border-gray-800 md:border-b-0 md:border-r md:w-80 md:flex-shrink-0">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-5 h-5 text-amber-400" />
            <h1 className="text-white font-bold text-lg">Personal Agent</h1>
          </div>
          <p className="text-gray-500 text-xs">
            Build your ChatGPT-powered personal AI operating system — research, shopping, coding prompts, and a 30-day rollout plan.
          </p>
        </div>

        <div className="p-4 space-y-3 md:flex-1 md:overflow-y-auto">
          <Field label="Full Name *" value={fullName} onChange={setFullName} placeholder="e.g. Alex Carter" />
          <Field label="Role" value={role} onChange={setRole} placeholder="e.g. Founder / Engineer" />

          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">
              Top Goals * <span className="text-gray-600">(90-day outcomes)</span>
            </label>
            <textarea
              value={topGoals}
              onChange={e => setTopGoals(e.target.value)}
              rows={3}
              placeholder="What outcomes do you want this agent to drive over the next 90 days?"
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-amber-500 transition-colors placeholder-gray-600"
            />
          </div>

          <Field label="Tools" value={tools} onChange={setTools} placeholder="ChatGPT, Cursor, Notion, Gmail..." />
          <Field label="Research Domains" value={researchDomains} onChange={setResearchDomains} placeholder="e.g. AI tools, biotech, market trends" />
          <Field label="Shopping Preferences" value={shoppingPreferences} onChange={setShoppingPreferences} placeholder="e.g. premium quality, low total cost" />
          <Field label="Coding Stack" value={codingStack} onChange={setCodingStack} placeholder="e.g. TS/React/FastAPI, Rust" />

          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Privacy Boundaries</label>
            <textarea
              value={privacyBoundaries}
              onChange={e => setPrivacyBoundaries(e.target.value)}
              rows={2}
              placeholder="What should never be stored/shared? Any compliance constraints?"
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-amber-500 transition-colors placeholder-gray-600"
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <button
            onClick={handleGenerate}
            disabled={!fullName.trim() || !topGoals.trim() || isStreaming}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {isStreaming
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Building Agent System...</>
              : <><Sparkles className="w-4 h-4" /> Build My Agent System</>}
          </button>
          {isStreaming && (
            <button
              onClick={handleCancel}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <X className="w-4 h-4" /> Stop Generation
            </button>
          )}
        </div>
      </div>

      {/* Right panel: output */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2 flex-wrap">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-gray-300 text-sm font-medium">Personal Agent Blueprint</span>
          <span className="text-gray-500 text-xs hidden sm:inline">— Setup pack, prompts &amp; 30-day plan</span>
          {isStreaming && (
            <span className="ml-auto text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse">
              Building...
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-96 md:min-h-0">
          {output ? (
            <StreamingText text={output} isStreaming={isStreaming} />
          ) : (
            <div className="flex items-center justify-center text-center py-16">
              <div>
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-amber-400" />
                </div>
                <p className="text-white font-semibold mb-1">Design your personal AI operating system</p>
                <p className="text-gray-500 text-sm max-w-sm">
                  You'll get copy/paste prompts for research, shopping, and coding workflows — plus a realistic 30-day rollout plan.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label className="text-xs text-gray-400 font-medium mb-1.5 block">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder-gray-600"
      />
    </div>
  )
}
