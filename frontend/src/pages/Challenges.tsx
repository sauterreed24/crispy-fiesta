import { useState, useCallback } from 'react'
import { Target, Sparkles, Send, Trophy, ChevronDown, ChevronUp, RefreshCw, ArrowLeft } from 'lucide-react'
import { streamPost } from '../api'
import StreamingText from '../components/StreamingText'

interface ChallengesProps {
  onProgressUpdate: () => void
}

const DIFFICULTIES = [
  { id: 'beginner', label: 'Beginner', desc: 'Core techniques, clear goals', xp: '+15 XP', color: 'emerald' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Multi-technique, nuanced', xp: '+25 XP', color: 'amber' },
  { id: 'expert', label: 'Expert', desc: 'Complex, production-grade', xp: '+50 XP', color: 'orange' },
  { id: 'master', label: 'Master', desc: 'Frontier-level challenges', xp: '+100 XP', color: 'rose' },
]

const FOCUS_AREAS = [
  { id: 'general', label: 'General', icon: '🎯' },
  { id: 'chain-of-thought', label: 'Chain of Thought', icon: '🧠' },
  { id: 'few-shot', label: 'Few-Shot', icon: '📚' },
  { id: 'system-design', label: 'System Prompts', icon: '🏗️' },
  { id: 'output-format', label: 'Structured Output', icon: '📋' },
  { id: 'persona', label: 'Persona Design', icon: '🎭' },
  { id: 'adversarial', label: 'Defense', icon: '🛡️' },
  { id: 'code', label: 'Code', icon: '💻' },
  { id: 'creative', label: 'Creative', icon: '✨' },
  { id: 'analysis', label: 'Analysis', icon: '🔍' },
]

type Phase = 'setup' | 'challenge' | 'scoring' | 'results'

const diffColorMap: Record<string, string> = {
  emerald: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
  amber: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
  orange: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
  rose: 'bg-rose-500/20 border-rose-500/30 text-rose-300',
}

const diffActiveBg: Record<string, string> = {
  beginner: 'bg-emerald-600/20 border-emerald-500',
  intermediate: 'bg-amber-600/20 border-amber-500',
  expert: 'bg-orange-600/20 border-orange-500',
  master: 'bg-rose-600/20 border-rose-500',
}

export default function Challenges({ onProgressUpdate }: ChallengesProps) {
  const [phase, setPhase] = useState<Phase>('setup')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [focus, setFocus] = useState('general')
  const [challengeText, setChallengeText] = useState('')
  const [userResponse, setUserResponse] = useState('')
  const [challengeStreaming, setChallengeStreaming] = useState(false)
  const [scoreStreaming, setScoreStreaming] = useState(false)
  const [scoreOutput, setScoreOutput] = useState('')
  const [error, setError] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [mobileShowChallenge, setMobileShowChallenge] = useState(false)

  const generateChallenge = useCallback(async () => {
    setChallengeText('')
    setUserResponse('')
    setScoreOutput('')
    setError('')
    setShowHint(false)
    setChallengeStreaming(true)
    setPhase('challenge')
    setMobileShowChallenge(true)
    try {
      for await (const chunk of streamPost('/challenge/generate', { difficulty, focus })) {
        setChallengeText(prev => prev + chunk)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate')
    } finally {
      setChallengeStreaming(false)
    }
  }, [difficulty, focus])

  const submitForScoring = useCallback(async () => {
    if (!userResponse.trim() || !challengeText) return
    setScoreOutput('')
    setError('')
    setScoreStreaming(true)
    setPhase('scoring')
    try {
      for await (const chunk of streamPost('/challenge/score', {
        challenge: challengeText, user_response: userResponse, difficulty,
      })) {
        setScoreOutput(prev => prev + chunk)
      }
      setPhase('results')
      onProgressUpdate()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scoring failed')
      setPhase('challenge')
    } finally {
      setScoreStreaming(false)
    }
  }, [challengeText, userResponse, difficulty, onProgressUpdate])

  const reset = () => {
    setPhase('setup')
    setChallengeText('')
    setUserResponse('')
    setScoreOutput('')
    setError('')
    setShowHint(false)
    setMobileShowChallenge(false)
  }

  const selectedDiff = DIFFICULTIES.find(d => d.id === difficulty)

  return (
    <div className="flex flex-col md:flex-row md:h-full">
      {/* ── Left panel: controls ── */}
      <div className={`flex flex-col border-b border-gray-800 md:border-b-0 md:border-r md:w-[360px] md:flex-shrink-0 ${mobileShowChallenge && phase !== 'setup' ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 md:p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-emerald-400" />
            <h1 className="text-white font-bold text-lg">Challenges</h1>
          </div>
          <p className="text-gray-500 text-xs">Test your skills. Earn XP. Get better every day.</p>
        </div>

        <div className="p-4 md:p-5 space-y-4 md:flex-1 md:overflow-y-auto">
          {/* Difficulty */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-2 block">Difficulty</label>
            <div className="space-y-1.5">
              {DIFFICULTIES.map(({ id, label, desc, xp, color }) => (
                <button key={id} onClick={() => setDifficulty(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                    difficulty === id ? diffActiveBg[id] : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                  }`}>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-white">{label}</span>
                    <span className="text-xs text-gray-500 ml-2 hidden sm:inline">{desc}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${diffColorMap[color]}`}>{xp}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Focus area */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-2 block">Focus Area</label>
            <div className="flex flex-wrap gap-1.5">
              {FOCUS_AREAS.map(({ id, label, icon }) => (
                <button key={id} onClick={() => setFocus(id)}
                  className={`text-xs px-2 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                    focus === id ? 'bg-violet-600/20 border-violet-500 text-violet-300' : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                  }`}>
                  <span className="text-xs">{icon}</span>{label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-5 border-t border-gray-800 space-y-2">
          {(phase === 'setup' || phase === 'results') && (
            <button onClick={generateChallenge} disabled={challengeStreaming}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold rounded-lg py-3 text-sm flex items-center justify-center gap-2 transition-colors">
              <Target className="w-4 h-4" />
              {phase === 'results' ? 'New Challenge' : 'Generate Challenge'}
            </button>
          )}
          {phase !== 'setup' && (
            <button onClick={reset}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Right panel: challenge + response ── */}
      <div className={`flex-1 flex flex-col min-h-0 ${mobileShowChallenge && phase !== 'setup' ? 'flex' : 'hidden md:flex'}`}>
        {phase === 'setup' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center mb-5 shadow-xl shadow-emerald-900/30">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Ready to Level Up?</h2>
            <p className="text-gray-400 text-sm max-w-sm mb-5">
              Select a difficulty and focus area, then generate a challenge. Submit your prompt for expert scoring and earn XP.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
              {DIFFICULTIES.map(({ id, label, xp, color }) => (
                <div key={id} className={`px-3 py-2.5 rounded-xl border ${diffColorMap[color]} text-center`}>
                  <p className="font-bold text-sm">{label}</p>
                  <p className="text-xs opacity-80">{xp}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(phase === 'challenge' || phase === 'scoring' || phase === 'results') && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Challenge display */}
            <div className="overflow-y-auto p-4 md:p-6 border-b border-gray-800" style={{ flex: '1 1 auto', minHeight: '200px' }}>
              <div className="flex items-center gap-2 mb-3">
                {/* Mobile back */}
                <button onClick={() => setMobileShowChallenge(false)} className="md:hidden mr-1 -ml-1 p-1 text-gray-500 hover:text-white">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-medium text-sm">Challenge</span>
                {selectedDiff && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${diffColorMap[selectedDiff.color]}`}>
                    {selectedDiff.label}
                  </span>
                )}
                {challengeStreaming && (
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full animate-pulse ml-auto">
                    Generating...
                  </span>
                )}
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm mb-4">{error}</div>
              )}
              <StreamingText text={challengeText} isStreaming={challengeStreaming} />

              {challengeText && !challengeStreaming && (
                <div className="mt-3">
                  <button onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-amber-400 transition-colors">
                    {showHint ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showHint ? 'Hide hint' : 'Show hint (only if truly stuck)'}
                  </button>
                  {showHint && (
                    <div className="mt-2 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                      <p className="text-xs text-amber-300/80">The hint is included in the challenge text above — it points toward the technique without giving away the answer.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Response area */}
            {(phase === 'challenge' || phase === 'scoring') && !challengeStreaming && (
              <div className="p-4 md:p-5 border-b border-gray-800 flex-shrink-0">
                <label className="text-xs text-gray-400 font-medium mb-2 block">Your Prompt Response</label>
                <textarea value={userResponse} onChange={e => setUserResponse(e.target.value)}
                  placeholder="Write your prompt here. Think about the technique, constraints, and success criteria..."
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-emerald-500 transition-colors placeholder-gray-600"
                  rows={5} disabled={phase === 'scoring'} />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-600">{userResponse.length} chars</span>
                  <button onClick={submitForScoring} disabled={!userResponse.trim() || phase === 'scoring'}
                    className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2 text-sm flex items-center gap-2 transition-colors">
                    <Send className="w-3.5 h-3.5" />
                    {phase === 'scoring' ? 'Scoring...' : `Submit (${selectedDiff?.xp || '+25 XP'})`}
                  </button>
                </div>
              </div>
            )}

            {/* Score output */}
            {(phase === 'scoring' || phase === 'results') && scoreOutput && (
              <div className="overflow-y-auto p-4 md:p-5 flex-shrink-0" style={{ maxHeight: '45%' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-white font-medium text-sm">Expert Feedback</span>
                  {scoreStreaming && (
                    <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full animate-pulse ml-auto">
                      Scoring...
                    </span>
                  )}
                </div>
                <StreamingText text={scoreOutput} isStreaming={scoreStreaming} />
                {!scoreStreaming && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <button onClick={generateChallenge}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg px-5 py-2.5 text-sm flex items-center gap-2 transition-colors">
                      <Target className="w-4 h-4" /> Next Challenge
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
