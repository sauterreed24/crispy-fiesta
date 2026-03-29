import { useState, useCallback } from 'react'
import { BookOpen, Sparkles, Search, ChevronRight, Cpu, Brain, Database, Layers, Shield, Zap, GitBranch, Eye, ArrowLeft } from 'lucide-react'
import { streamPost } from '../api'
import StreamingText from '../components/StreamingText'

interface KnowledgeHubProps {
  onProgressUpdate: () => void
}

type Mode = 'ask' | 'compare'

const TOPIC_CATEGORIES = [
  {
    name: 'Foundations',
    icon: Cpu,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    topics: [
      'How do Transformer architectures work?',
      'Explain attention mechanisms and why they matter',
      'How does tokenization work and why does it affect prompting?',
      'What are context windows and how do they affect model behavior?',
      'How does temperature affect model outputs?',
      'What is the difference between top-p and top-k sampling?',
    ],
  },
  {
    name: 'Training & Alignment',
    icon: Brain,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    topics: [
      'What is RLHF and how does it shape model behavior?',
      "How does Anthropic's Constitutional AI work?",
      'What is DPO (Direct Preference Optimization)?',
      'How does instruction fine-tuning change a base model?',
      'What is RLAIF and how does it differ from RLHF?',
      'What are scaling laws and what do they predict?',
    ],
  },
  {
    name: 'Model Families',
    icon: Layers,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    topics: [
      'What makes Claude different from GPT-4?',
      'How do Llama/Mistral open models compare to frontier models?',
      "What is unique about Google Gemini's architecture?",
      'What are mixture-of-experts (MoE) models?',
      'How do multimodal models like GPT-4V process images?',
      'What is speculative decoding and how does it speed up inference?',
    ],
  },
  {
    name: 'RAG & Agents',
    icon: Database,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    topics: [
      'How does RAG (Retrieval-Augmented Generation) work?',
      'What chunking strategies work best for RAG?',
      'How do AI agents use tools and function calling?',
      'What is the ReAct architecture for agents?',
      'How do multi-agent systems coordinate?',
      'What are vector databases and how do embeddings work?',
    ],
  },
  {
    name: 'Safety & Alignment',
    icon: Shield,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    topics: [
      'What is prompt injection and how do you defend against it?',
      'How does jailbreaking work and why is it hard to prevent?',
      'What is reward hacking in RLHF?',
      'What is superposition in neural networks?',
      'How does interpretability research work?',
      'What are the main AI safety concerns at frontier labs?',
    ],
  },
  {
    name: 'Capabilities & Evals',
    icon: Zap,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    topics: [
      'What are emergent capabilities and when do they appear?',
      'How is MMLU used to evaluate models?',
      'What is HumanEval and what does it measure?',
      'Why are benchmarks often misleading?',
      'What is in-context learning and why is it surprising?',
      'How do models handle long-context retrieval?',
    ],
  },
]

const MODEL_PAIRS = [
  { label: 'Claude vs GPT-4o', models: ['Claude 3.5 Sonnet', 'GPT-4o'] },
  { label: 'Claude vs Gemini', models: ['Claude 3.5 Sonnet', 'Gemini 1.5 Pro'] },
  { label: 'GPT-4o vs Gemini', models: ['GPT-4o', 'Gemini 1.5 Pro'] },
  { label: 'Claude vs Llama 3', models: ['Claude 3.5 Sonnet', 'Llama 3.1 405B'] },
  { label: 'All Frontier Models', models: ['Claude 3.5 Sonnet', 'GPT-4o', 'Gemini 1.5 Pro'] },
]

const COMPARE_TASKS = [
  'complex reasoning', 'code generation', 'creative writing',
  'instruction following', 'long-context tasks', 'mathematical reasoning',
  'prompt engineering', 'safety and refusals',
]

export default function KnowledgeHub({ onProgressUpdate }: KnowledgeHubProps) {
  const [mode, setMode] = useState<Mode>('ask')
  const [question, setQuestion] = useState('')
  const [depth, setDepth] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate')
  const [compareModels, setCompareModels] = useState(['Claude 3.5 Sonnet', 'GPT-4o'])
  const [compareTask, setCompareTask] = useState('complex reasoning')
  const [customTask, setCustomTask] = useState('')
  const [output, setOutput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [mobileShowOutput, setMobileShowOutput] = useState(false)

  const runStream = useCallback(async (path: string, body: unknown) => {
    setOutput('')
    setError('')
    setIsStreaming(true)
    setMobileShowOutput(true)
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

  const handleAsk = () => {
    if (!question.trim()) return
    runStream('/knowledge/ask', { question: question.trim(), depth })
  }

  const handleCompare = () => {
    runStream('/knowledge/compare-models', { models: compareModels, task: customTask.trim() || compareTask })
  }

  const handleTopicClick = (topic: string) => {
    setQuestion(topic)
    setMode('ask')
    setOutput('')
    setError('')
    setMobileShowOutput(false)
  }

  return (
    <div className="flex flex-col md:flex-row md:h-full">
      {/* ── Left panel ── */}
      <div className={`flex flex-col border-b border-gray-800 md:border-b-0 md:border-r md:w-[420px] md:flex-shrink-0 ${mobileShowOutput ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 md:p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h1 className="text-white font-bold text-lg">Knowledge Hub</h1>
          </div>
          <p className="text-gray-500 text-xs">Deep-dive into AI/ML concepts. Ask anything.</p>
        </div>

        {/* Mode toggle */}
        <div className="flex border-b border-gray-800">
          {([
            { id: 'ask' as Mode, label: 'Ask & Learn', icon: Search },
            { id: 'compare' as Mode, label: 'Compare Models', icon: GitBranch },
          ]).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setMode(id); setOutput(''); setError(''); setMobileShowOutput(false) }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-all border-b-2 ${
                mode === id ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-5 space-y-4 md:flex-1 md:overflow-y-auto">
          {mode === 'ask' && (
            <>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Your Question</label>
                <textarea value={question} onChange={e => setQuestion(e.target.value)}
                  placeholder="Ask anything about AI, ML, LLMs, prompt engineering..."
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-600"
                  rows={3} />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-medium mb-2 block">Explanation Depth</label>
                <div className="flex gap-2">
                  {(['beginner', 'intermediate', 'expert'] as const).map(d => (
                    <button key={d} onClick={() => setDepth(d)}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all border ${
                        depth === d ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300' : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                      }`}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic browser */}
              <div>
                <p className="text-xs text-gray-400 font-medium mb-2">Browse by Topic</p>
                <div className="space-y-1.5">
                  {TOPIC_CATEGORIES.map(({ name, icon: Icon, color, bg, topics }) => (
                    <div key={name}>
                      <button onClick={() => setActiveCategory(activeCategory === name ? null : name)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border ${bg} transition-all`}>
                        <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0`} />
                        <span className="text-xs font-medium text-gray-300 flex-1 text-left">{name}</span>
                        <ChevronRight className={`w-3 h-3 text-gray-600 transition-transform ${activeCategory === name ? 'rotate-90' : ''}`} />
                      </button>
                      {activeCategory === name && (
                        <div className="mt-1 ml-2 space-y-0.5">
                          {topics.map(topic => (
                            <button key={topic} onClick={() => handleTopicClick(topic)}
                              className="w-full text-left text-xs text-gray-400 hover:text-white py-2 px-3 rounded-lg hover:bg-gray-800 transition-all flex items-start gap-2">
                              <span className="text-gray-700 mt-0.5 flex-shrink-0">›</span>
                              {topic}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === 'compare' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-medium mb-2 block">Quick Comparisons</label>
                <div className="space-y-1.5">
                  {MODEL_PAIRS.map(({ label, models }) => (
                    <button key={label} onClick={() => setCompareModels(models)}
                      className={`w-full text-left text-xs px-3 py-2.5 rounded-lg border transition-all ${
                        JSON.stringify(compareModels) === JSON.stringify(models)
                          ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-medium mb-2 block">Compare For Task</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMPARE_TASKS.map(task => (
                    <button key={task} onClick={() => setCompareTask(task)}
                      className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${
                        compareTask === task ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300' : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'
                      }`}>
                      {task}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Or custom task</label>
                <input value={customTask} onChange={e => setCustomTask(e.target.value)}
                  placeholder="e.g. summarizing legal documents"
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 placeholder-gray-600" />
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Comparing:</p>
                <p className="text-xs text-white font-medium">{compareModels.join(' vs ')}</p>
                <p className="text-xs text-cyan-400 mt-1">For: {customTask || compareTask}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 md:p-5 border-t border-gray-800">
          {mode === 'ask' ? (
            <button onClick={handleAsk} disabled={isStreaming || !question.trim()}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 text-sm flex items-center justify-center gap-2 transition-colors">
              <Search className="w-4 h-4" />
              {isStreaming ? 'Thinking...' : 'Get Expert Answer (+5 XP)'}
            </button>
          ) : (
            <button onClick={handleCompare} disabled={isStreaming}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 text-sm flex items-center justify-center gap-2 transition-colors">
              <Eye className="w-4 h-4" />
              {isStreaming ? 'Comparing...' : 'Compare Models'}
            </button>
          )}
        </div>
      </div>

      {/* ── Right panel: output ── */}
      <div className={`flex-1 flex flex-col min-h-0 ${mobileShowOutput ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
          <button onClick={() => setMobileShowOutput(false)} className="md:hidden mr-1 -ml-1 p-1 text-gray-500 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-gray-300 text-sm font-medium">
            {mode === 'ask' ? 'Expert Knowledge' : 'Model Comparison'}
          </span>
          {depth && mode === 'ask' && (
            <span className={`text-xs px-2 py-0.5 rounded-full ml-1 ${
              depth === 'beginner' ? 'bg-emerald-500/20 text-emerald-400' :
              depth === 'intermediate' ? 'bg-amber-500/20 text-amber-400' :
              'bg-rose-500/20 text-rose-400'
            }`}>{depth}</span>
          )}
          {isStreaming && (
            <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full animate-pulse ml-auto">
              Streaming...
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-96 md:min-h-0">
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm mb-4">{error}</div>
          )}
          {!output && !isStreaming && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <BookOpen className="w-10 h-10 text-gray-700 mb-4" />
              <p className="text-gray-500 text-sm">
                {mode === 'ask' ? 'Ask any AI/ML question for an expert answer' : 'Compare models to understand when to use each'}
              </p>
              <p className="text-gray-700 text-xs mt-2">+5 XP per question answered</p>
            </div>
          )}
          {(output || isStreaming) && <StreamingText text={output} isStreaming={isStreaming} />}
        </div>
      </div>
    </div>
  )
}
