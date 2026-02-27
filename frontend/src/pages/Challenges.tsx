import { useState, useCallback } from 'react'
import { Target, Sparkles, Send, Trophy, Clock, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
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
  { id: 'adversarial', label: 'Adversarial / Defense', icon: '🛡️' },
  { id: 'code', label: 'Code Generation', icon: '💻' },
  { id: 'creative', label: 'Creative', icon: '✨' },
  { id: 'analysis', label: 'Analysis & Reasoning', icon: '🔍' },
]

type Phase = 'setup' | 'challenge' | 'scoring' | 'results'

const difficultyColorMap: Record<string, string> = {
  emerald: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
  amber: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
  orange: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
  rose: 'bg-rose-500/20 border-rose-500/30 text-rose-300',
}

const difficultyActiveBg: Record<string, string> = {
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

  const generateChallenge = useCallback(async () => {
    setChallengeText('')
    setUserResponse('')
    setScoreOutput('')
    setError('')
    setShowHint(false)
    setChallengeStreaming(true)
    setPhase('challenge')
    try {
      for await (const chunk of streamPost('/challenge/generate', { difficulty, focus })) {
        setChallengeText(prev => prev + chunk)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate challenge')
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
        challenge: challengeText,
        user_response: userResponse,
        difficulty,
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
  }

  const selectedDiff = DIFFICULTIES.find(d => d.id === difficulty)

  return (
    <div className="flex h-full">
      {/* Left panel: controls */}
      <div className="w-[380px] flex-shrink-0 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-emerald-400" />
            <h1 className="text-white font-bold text-lg">Challenges</h1>
          </div>
          <p className="text-gray-500 text-sm">Test your skills. Earn XP. Get better every day.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Difficulty */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-2 block">Difficulty</label>
            <div className="space-y-2">
              {DIFFICULTIES.map(({ id, label, desc, xp, color }) => (
                <button
                  key={id}
                  onClick={() => setDifficulty(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                    difficulty === id
                      ? difficultyActiveBg[id]
                      : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex-1">
                    <span className="text-sm font-medium text-white">{label}</span>
                    <span className="text-xs text-gray-500 ml-2">{desc}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${difficultyColorMap[color]}`}>
                    {xp}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Focus area */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-2 block">Focus Area</label>
            <div className="flex flex-wrap gap-1.5">
              {FOCUS_AREAS.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setFocus(id)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                    focus === id
                      ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                      : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Phase indicator */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-widest">Status</p>
            <div className="flex items-center gap-2">
              {(['setup', 'challenge', 'scoring', 'results'] as Phase[]).map((p, i) => (
                <div key={p} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full transition-colors ${
                    phase === p ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' :
                    ['setup', 'challenge', 'scoring'].indexOf(p) < ['setup', 'challenge', 'scoring', 'results'].indexOf(phase)
                      ? 'bg-gray-500' : 'bg-gray-700'
                  }`} />
                  {i < 3 && <div className="w-4 h-px bg-gray-700" />}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {['Setup', 'Challenge', 'Scoring', 'Results'].map((label, i) => (
                <span key={label} className={`text-xs ${
                  ['setup', 'challenge', 'scoring', 'results'][i] === phase ? 'text-emerald-400' : 'text-gray-600'
                }`}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gray-800/30 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium mb-2">💡 Pro Tips</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Read the success criteria carefully before writing</li>
              <li>• Think about which technique fits best</li>
              <li>• Constraints aren't limitations — they guide you</li>
              <li>• Check the hint only after a genuine attempt</li>
            </ul>
          </div>
        </div>

        <div className="p-5 border-t border-gray-800 space-y-2">
          {(phase === 'setup' || phase === 'results') && (
            <button
              onClick={generateChallenge}
              disabled={challengeStreaming}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Target className="w-4 h-4" />
              {phase === 'results' ? 'New Challenge' : 'Generate Challenge'}
            </button>
          )}
          {phase === 'results' && (
            <button
              onClick={reset}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Back to Setup
            </button>
          )}
        </div>
      </div>

      {/* Right panel: challenge + response */}
      <div className="flex-1 flex flex-col min-w-0">
        {phase === 'setup' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center mb-6 shadow-xl shadow-emerald-900/30">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Ready to Level Up?</h2>
            <p className="text-gray-400 text-sm max-w-md mb-6">
              Challenges test your prompt engineering skills with real-world scenarios.
              Each challenge is scored by AI with expert-level feedback.
              Earn XP and track your mastery.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
              {DIFFICULTIES.map(({ id, label, xp, color }) => (
                <div key={id} className={`px-4 py-3 rounded-xl border ${difficultyColorMap[color]} text-center`}>
                  <p className="font-bold text-sm">{label}</p>
                  <p className="text-xs opacity-80 mt-0.5">{xp}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-6">
              Select difficulty and focus area, then click Generate Challenge
            </p>
          </div>
        )}

        {(phase === 'challenge' || phase === 'scoring' || phase === 'results') && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Challenge display */}
            <div className="flex-1 overflow-y-auto p-6 border-b border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-medium text-sm">Challenge</span>
                {selectedDiff && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColorMap[selectedDiff.color]}`}>
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
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm mb-4">
                  {error}
                </div>
              )}

              <StreamingText text={challengeText} isStreaming={challengeStreaming} />

              {challengeText && !challengeStreaming && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-amber-400 transition-colors"
                  >
                    {showHint ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showHint ? 'Hide hint' : 'Show hint (only if truly stuck)'}
                  </button>
                  {showHint && (
                    <div className="mt-2 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                      <p className="text-xs text-amber-300/80">Hint: Look for the hint in the challenge text above — it explains the technique direction without revealing the full solution.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Response area */}
            {(phase === 'challenge' || phase === 'scoring') && !challengeStreaming && (
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <label className="text-xs text-gray-400 font-medium">Your Prompt Response</label>
                </div>
                <textarea
                  value={userResponse}
                  onChange={e => setUserResponse(e.target.value)}
                  placeholder="Write your prompt here. Take your time — think about the technique, constraints, and success criteria..."
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-emerald-500 transition-colors placeholder-gray-600"
                  rows={6}
                  disabled={phase === 'scoring'}
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-600">
                    {userResponse.length} chars
                  </span>
                  <button
                    onClick={submitForScoring}
                    disabled={!userResponse.trim() || phase === 'scoring'}
                    className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-5 py-2 text-sm flex items-center gap-2 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    {phase === 'scoring' ? 'Scoring...' : `Submit for Scoring (${selectedDiff?.xp || '+25 XP'})`}
                  </button>
                </div>
              </div>
            )}

            {/* Score output */}
            {(phase === 'scoring' || phase === 'results') && scoreOutput && (
              <div className="border-t border-gray-800 overflow-y-auto" style={{ maxHeight: '40%' }}>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
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
                    <div className="mt-5 pt-4 border-t border-gray-800">
                      <button
                        onClick={generateChallenge}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg px-5 py-2.5 text-sm flex items-center gap-2 transition-colors"
                      >
                        <Target className="w-4 h-4" />
                        Next Challenge
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
