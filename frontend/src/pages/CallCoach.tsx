import { useState } from 'react'
import { Phone, Mic, FileText, Loader2, AlertCircle } from 'lucide-react'
import { streamPost } from '../api'
import StreamingText from '../components/StreamingText'

const EXAMPLE_TRANSCRIPT = `Rep: Hey, is this Mike from Acme Corp?
Prospect: Yeah, who's this?
Rep: Hey Mike, this is Alex from Artemis Distribution. Hope I'm not catching you at a bad time. Um, so the reason I'm calling is we have some really great products that I think could really benefit your company...
Prospect: Look, we're not interested. We have vendors already.
Rep: Oh okay, I totally understand. But uh, maybe I could just send you some information and you could take a look?
Prospect: Sure, just send it over to our general inbox.
Rep: Okay great! Thank you so much for your time. Have a great day!`

export default function CallCoach() {
  const [transcript, setTranscript] = useState('')
  const [prospectName, setProspectName] = useState('')
  const [company, setCompany] = useState('')
  const [output, setOutput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState('')

  const handleCoach = async () => {
    if (!transcript.trim()) return
    setOutput('')
    setError('')
    setIsStreaming(true)
    try {
      for await (const chunk of streamPost('/calls/coach', {
        transcript,
        prospect_name: prospectName || 'Prospect',
        company: company || 'Unknown Company'
      })) {
        setOutput(prev => prev + chunk)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsStreaming(false)
    }
  }

  const useExample = () => {
    setTranscript(EXAMPLE_TRANSCRIPT)
    setProspectName('Mike')
    setCompany('Acme Corp')
  }

  return (
    <div className="page-transition grid grid-cols-5 gap-6 h-full">
      {/* Left: Input */}
      <div className="col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Phone size={18} className="text-amber-500" />
            Call Coach
          </h2>
          <p className="text-slate-500 text-sm mb-4">
            Paste your call transcript and get expert-level coaching with specific line-by-line feedback.
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Prospect Name
                </label>
                <input
                  value={prospectName}
                  onChange={e => setProspectName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Company
                </label>
                <input
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Call Transcript *
                </label>
                <button
                  onClick={useExample}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  Load example
                </button>
              </div>
              <textarea
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="Paste your call transcript here...&#10;&#10;Rep: [what you said]&#10;Prospect: [what they said]&#10;..."
                rows={12}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors font-mono"
              />
            </div>

            <button
              onClick={handleCoach}
              disabled={!transcript.trim() || isStreaming}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isStreaming ? (
                <><Loader2 size={15} className="animate-spin" /> Analyzing...</>
              ) : (
                <><Phone size={15} /> Coach This Call</>
              )}
            </button>
          </div>
        </div>

        {/* Tips card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <FileText size={15} className="text-slate-500" />
            Getting a Transcript
          </h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p>• <strong>Otter.ai</strong> — free auto-transcription</p>
            <p>• <strong>Gong / Chorus</strong> — if your company uses them</p>
            <p>• <strong>Rev.com</strong> — upload audio, get transcript</p>
            <p>• <strong>Manual</strong> — write notes from memory</p>
          </div>
        </div>
      </div>

      {/* Right: Coaching Output */}
      <div className="col-span-3">
        <div className="bg-white rounded-2xl border border-slate-200 h-full flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex-shrink-0">
            <h3 className="font-bold text-slate-900">Coaching Report</h3>
            <p className="text-slate-500 text-sm">Expert analysis of your call performance</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <AlertCircle size={16} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {output ? (
              <StreamingText text={output} isStreaming={isStreaming} />
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mic size={32} className="text-amber-400" />
                  </div>
                  <p className="text-slate-700 font-semibold">Ready to coach you</p>
                  <p className="text-slate-400 text-sm mt-1 max-w-xs">
                    Paste a call transcript and get detailed, line-by-line coaching from an elite sales coach.
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-3 max-w-sm mx-auto">
                    {['Talk ratio', 'Objection handling', 'Opener quality'].map(m => (
                      <div key={m} className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                        <div className="w-8 h-1.5 bg-slate-200 rounded-full mb-1.5" />
                        <p className="text-xs text-slate-500">{m}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
