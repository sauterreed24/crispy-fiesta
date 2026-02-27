import { useState, useCallback } from 'react'
import { Hammer, Sparkles, Map, Lightbulb, ChevronRight } from 'lucide-react'
import { streamPost } from '../api'
import StreamingText from '../components/StreamingText'

type Mode = 'roadmap' | 'projects'

const SKILL_SUGGESTIONS = [
  { label: 'Python Programming', icon: '🐍' },
  { label: 'Machine Learning', icon: '🤖' },
  { label: 'React / Frontend Dev', icon: '⚛️' },
  { label: 'Data Analysis', icon: '📊' },
  { label: 'Prompt Engineering', icon: '✨' },
  { label: 'AI App Development', icon: '🔧' },
  { label: 'SQL & Databases', icon: '🗄️' },
  { label: 'System Design', icon: '🏗️' },
  { label: 'Deep Learning', icon: '🧠' },
  { label: 'API Development', icon: '🔌' },
  { label: 'DevOps & CI/CD', icon: '🚀' },
  { label: 'LLM Fine-tuning', icon: '🎯' },
]

const LEVELS = ['Complete beginner', 'Some exposure', 'Beginner', 'Intermediate', 'Advanced']

export default function SkillBuilder() {
  const [mode, setMode] = useState<Mode>('roadmap')
  const [skill, setSkill] = useState('')
  const [level, setLevel] = useState('Beginner')
  const [goal, setGoal] = useState('')
  const [output, setOutput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState('')

  const runStream = useCallback(async (path: string, body: unknown) => {
    setOutput('')
    setError('')
    setIsStreaming(true)
    try {
      for await (const chunk of streamPost(path, body)) {
        setOutput(prev => prev + chunk)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setIsStreaming(false)
    }
  }, [])

  const handleBuildRoadmap = () => {
    if (!skill.trim()) return
    runStream('/skill/build', { skill: skill.trim(), current_level: level, goal })
  }

  const handleProjectIdeas = () => {
    if (!skill.trim()) return
    runStream('/skill/projects', { skill: skill.trim(), level })
  }

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className="w-[380px] flex-shrink-0 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Hammer className="w-5 h-5 text-amber-400" />
            <h1 className="text-white font-bold text-lg">Skill Builder</h1>
          </div>
          <p className="text-gray-500 text-sm">AI-powered learning roadmaps and project ideas</p>
        </div>

        {/* Mode toggle */}
        <div className="flex border-b border-gray-800">
          {([
            { id: 'roadmap' as Mode, label: 'Learning Roadmap', icon: Map },
            { id: 'projects' as Mode, label: 'Project Ideas', icon: Lightbulb },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setMode(id); setOutput(''); setError('') }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-all border-b-2 ${
                mode === id
                  ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Skill input */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Skill to Master</label>
            <input
              value={skill}
              onChange={e => setSkill(e.target.value)}
              placeholder="e.g. Python, Machine Learning, Prompt Engineering..."
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder-gray-600"
            />
          </div>

          {/* Suggestions */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Quick select:</p>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_SUGGESTIONS.map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => setSkill(label)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                    skill === label
                      ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                      : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Current level */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-2 block">Current Level</label>
            <div className="flex flex-col gap-1.5">
              {LEVELS.map(l => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs transition-all ${
                    level === l
                      ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${level === l ? 'bg-amber-400' : 'bg-gray-700'}`} />
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          {mode === 'roadmap' && (
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Specific Goal (optional)</label>
              <input
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="e.g. build a production ML pipeline, get a job at Anthropic..."
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder-gray-600"
              />
            </div>
          )}

          {/* What you'll get */}
          <div className="bg-gray-800/30 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium mb-2">
              {mode === 'roadmap' ? "What you'll get:" : "What you'll get:"}
            </p>
            {mode === 'roadmap' ? (
              <ul className="text-xs text-gray-500 space-y-1">
                <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />Phase-by-phase learning roadmap</li>
                <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />AI-optimized learning prompts</li>
                <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />Mastery milestones & checkpoints</li>
                <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />Expert shortcuts & best resources</li>
              </ul>
            ) : (
              <ul className="text-xs text-gray-500 space-y-1">
                <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />5 high-impact project ideas</li>
                <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />AI-assisted build strategy</li>
                <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />Ready-to-use starter prompts</li>
                <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />Stretch goals for each project</li>
              </ul>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-gray-800">
          <button
            onClick={mode === 'roadmap' ? handleBuildRoadmap : handleProjectIdeas}
            disabled={isStreaming || !skill.trim()}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {mode === 'roadmap' ? <Map className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
            {isStreaming
              ? (mode === 'roadmap' ? 'Building roadmap...' : 'Generating ideas...')
              : (mode === 'roadmap' ? 'Build My Learning Roadmap' : 'Generate Project Ideas')
            }
          </button>
        </div>
      </div>

      {/* Right panel: output */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-gray-300 text-sm font-medium">
            {mode === 'roadmap' ? 'Personalized Learning Roadmap' : 'AI-Powered Project Ideas'}
          </span>
          {skill && (
            <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              {skill}
            </span>
          )}
          {isStreaming && (
            <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse ml-auto">
              Generating...
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center mb-5 shadow-lg shadow-amber-900/30">
                {mode === 'roadmap' ? <Map className="w-8 h-8 text-white" /> : <Lightbulb className="w-8 h-8 text-white" />}
              </div>
              <p className="text-gray-500 text-sm font-medium mb-2">
                {mode === 'roadmap'
                  ? 'Get a personalized, AI-accelerated learning roadmap for any skill'
                  : 'Get 5 high-impact project ideas that build real expertise'}
              </p>
              <p className="text-gray-700 text-xs">
                Includes AI-optimized learning prompts you can use right now
              </p>
            </div>
          )}
          {(output || isStreaming) && (
            <StreamingText text={output} isStreaming={isStreaming} />
          )}
        </div>
      </div>
    </div>
  )
}
