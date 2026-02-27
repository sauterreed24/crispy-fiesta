import { useState, useCallback } from 'react'
import { FlaskConical, Sparkles, Wand2, BookOpen, Copy, Check, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { streamPost, post } from '../api'
import StreamingText from '../components/StreamingText'

interface PromptLabProps {
  onProgressUpdate: () => void
}

const TECHNIQUES = [
  'Chain of Thought',
  'Few-Shot Learning',
  'Zero-Shot CoT',
  'Tree of Thought',
  'Self-Consistency',
  'Persona / Role',
  'System Prompt Design',
  'Structured Output',
  'ReAct',
  'Prompt Chaining',
  'Meta-Prompting',
  'Constitutional',
  'Least-to-Most',
  'Self-Critique',
]

const EXPLAIN_TECHNIQUES = [
  { name: 'Chain of Thought (CoT)', key: 'Chain of Thought' },
  { name: 'Zero-Shot CoT', key: 'Zero-Shot Chain of Thought' },
  { name: 'Few-Shot Learning', key: 'Few-Shot Learning' },
  { name: 'Tree of Thought (ToT)', key: 'Tree of Thought' },
  { name: 'Self-Consistency', key: 'Self-Consistency' },
  { name: 'ReAct', key: 'ReAct (Reason + Act)' },
  { name: 'System Prompt Design', key: 'System Prompt Architecture and Design' },
  { name: 'Structured Output', key: 'Structured Output Prompting' },
  { name: 'Prompt Chaining', key: 'Prompt Chaining' },
  { name: 'Meta-Prompting', key: 'Meta-Prompting' },
  { name: 'Constitutional', key: 'Constitutional Prompting' },
  { name: 'Least-to-Most', key: 'Least-to-Most Prompting' },
  { name: 'Directional Stimulus', key: 'Directional Stimulus Prompting' },
  { name: 'Self-Critique', key: 'Self-Critique and Reflection Prompting' },
  { name: 'Contrastive CoT', key: 'Contrastive Chain of Thought' },
  { name: 'Active Prompt', key: 'Active Prompt (Dynamic Few-Shot Selection)' },
  { name: 'Persona Design', key: 'Persona and Role Prompting' },
  { name: 'Negative Prompting', key: 'Negative Space and Exclusion Prompting' },
]

type Tab = 'evaluate' | 'improve' | 'explain'

export default function PromptLab({ onProgressUpdate }: PromptLabProps) {
  const [tab, setTab] = useState<Tab>('evaluate')
  const [prompt, setPrompt] = useState('')
  const [goal, setGoal] = useState('')
  const [context, setContext] = useState('')
  const [technique, setTechnique] = useState('')
  const [improveFeedback, setImproveFeedback] = useState('')
  const [explainTech, setExplainTech] = useState('')
  const [customExplain, setCustomExplain] = useState('')
  const [output, setOutput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveTitle, setSaveTitle] = useState('')
  const [saveTags, setSaveTags] = useState('')
  const [saveCategory, setSaveCategory] = useState('general')
  const [showOptions, setShowOptions] = useState(false)

  const runStream = useCallback(async (path: string, body: unknown) => {
    setOutput('')
    setError('')
    setIsStreaming(true)
    try {
      for await (const chunk of streamPost(path, body)) {
        setOutput(prev => prev + chunk)
      }
      onProgressUpdate()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setIsStreaming(false)
    }
  }, [onProgressUpdate])

  const handleEvaluate = () => {
    if (!prompt.trim()) return
    runStream('/prompt/evaluate', { prompt: prompt.trim(), goal, context })
  }

  const handleImprove = () => {
    if (!prompt.trim()) return
    runStream('/prompt/improve', { prompt: prompt.trim(), technique, feedback: improveFeedback })
  }

  const handleExplain = () => {
    const tech = customExplain.trim() || explainTech
    if (!tech) return
    runStream('/prompt/explain-technique', { technique: tech })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    if (!saveTitle.trim() || !prompt.trim()) return
    try {
      await post('/library/save', {
        title: saveTitle,
        prompt: prompt.trim(),
        category: saveCategory,
        technique,
        tags: saveTags,
        notes: output.slice(0, 300),
      })
      setShowSaveModal(false)
      setSaveTitle('')
      setSaveTags('')
    } catch {
      // silent
    }
  }

  return (
    <div className="flex h-full">
      {/* Left panel: inputs */}
      <div className="w-[420px] flex-shrink-0 border-r border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="w-5 h-5 text-violet-400" />
            <h1 className="text-white font-bold text-lg">Prompt Lab</h1>
          </div>
          <p className="text-gray-500 text-sm">Evaluate, improve, and master prompting techniques</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {([
            { id: 'evaluate' as Tab, label: 'Evaluate', icon: FlaskConical },
            { id: 'improve' as Tab, label: 'Improve', icon: Wand2 },
            { id: 'explain' as Tab, label: 'Learn Technique', icon: BookOpen },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setOutput(''); setError('') }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-all border-b-2 ${
                tab === id
                  ? 'border-violet-500 text-violet-400 bg-violet-500/5'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab !== 'explain' && (
            <>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Your Prompt</label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Paste or write your prompt here..."
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-violet-500 transition-colors placeholder-gray-600"
                  rows={8}
                />
              </div>

              <div>
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {showOptions ? 'Hide options' : 'Add context (optional)'}
                </button>
                {showOptions && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 font-medium mb-1.5 block">Goal / Use Case</label>
                      <input
                        value={goal}
                        onChange={e => setGoal(e.target.value)}
                        placeholder="What should this prompt accomplish?"
                        className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-gray-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-medium mb-1.5 block">Additional Context</label>
                      <input
                        value={context}
                        onChange={e => setContext(e.target.value)}
                        placeholder="Any relevant context..."
                        className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-gray-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'improve' && (
            <>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Apply Technique (optional)</label>
                <select
                  value={technique}
                  onChange={e => setTechnique(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                >
                  <option value="">Auto (let AI decide)</option>
                  {TECHNIQUES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Specific Goal (optional)</label>
                <input
                  value={improveFeedback}
                  onChange={e => setImproveFeedback(e.target.value)}
                  placeholder="e.g. make it more concise, add JSON output..."
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-gray-600"
                />
              </div>
            </>
          )}

          {tab === 'explain' && (
            <>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-2 block">Select a Technique to Master</label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPLAIN_TECHNIQUES.map(({ name, key }) => (
                    <button
                      key={key}
                      onClick={() => setExplainTech(key)}
                      className={`text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                        explainTech === key
                          ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Or type any technique</label>
                <input
                  value={customExplain}
                  onChange={e => setCustomExplain(e.target.value)}
                  placeholder="e.g. 'Emotional stimulus prompting'"
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-gray-600"
                />
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="p-5 border-t border-gray-800 space-y-2">
          {tab === 'evaluate' && (
            <button
              onClick={handleEvaluate}
              disabled={isStreaming || !prompt.trim()}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <FlaskConical className="w-4 h-4" />
              {isStreaming ? 'Analyzing...' : 'Evaluate Prompt (+10 XP)'}
            </button>
          )}
          {tab === 'improve' && (
            <button
              onClick={handleImprove}
              disabled={isStreaming || !prompt.trim()}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              {isStreaming ? 'Improving...' : 'Improve Prompt'}
            </button>
          )}
          {tab === 'explain' && (
            <button
              onClick={handleExplain}
              disabled={isStreaming || (!explainTech && !customExplain.trim())}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              {isStreaming ? 'Teaching...' : 'Teach Me This Technique'}
            </button>
          )}
          {output && !isStreaming && (
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2 text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              {tab !== 'explain' && (
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2 text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Prompt
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: output */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-gray-300 text-sm font-medium">
            {tab === 'evaluate' ? 'Expert Evaluation' : tab === 'improve' ? 'Improved Prompt' : 'Technique Deep-Dive'}
          </span>
          {isStreaming && (
            <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full animate-pulse ml-auto">
              Streaming...
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}
          {!output && !isStreaming && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FlaskConical className="w-12 h-12 text-gray-700 mb-4" />
              <p className="text-gray-500 text-sm font-medium">
                {tab === 'evaluate' && 'Paste a prompt and click Evaluate to get expert analysis'}
                {tab === 'improve' && 'Paste a prompt and click Improve to transform it into an elite version'}
                {tab === 'explain' && 'Select a technique to get an expert deep-dive with examples'}
              </p>
              <p className="text-gray-700 text-xs mt-2">Powered by Claude Opus</p>
            </div>
          )}
          {(output || isStreaming) && (
            <StreamingText text={output} isStreaming={isStreaming} className="ai-lab-output" />
          )}
        </div>
      </div>

      {/* Save modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-white font-bold mb-4">Save to Prompt Library</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Title *</label>
                <input
                  value={saveTitle}
                  onChange={e => setSaveTitle(e.target.value)}
                  placeholder="Give this prompt a name"
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Category</label>
                <select
                  value={saveCategory}
                  onChange={e => setSaveCategory(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                >
                  {['general', 'reasoning', 'coding', 'creative', 'analysis', 'system', 'few-shot', 'agent'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Tags (comma-separated)</label>
                <input
                  value={saveTags}
                  onChange={e => setSaveTags(e.target.value)}
                  placeholder="e.g. cot, few-shot, json"
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowSaveModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2 text-sm transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={!saveTitle.trim()} className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg py-2 text-sm font-semibold transition-colors">
                Save Prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
