import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2, Loader2, ChevronRight } from 'lucide-react'
import { streamPost, get, post, del } from '../api'
import StreamingText from '../components/StreamingText'

interface KnowledgeNote {
  id: number
  category: string
  content: string
  created_at: string
}

const QUICK_QUESTIONS = [
  'Give me the 30-second pitch for T-Shape 2',
  'What are the top 3 objections for NeoGen and how to handle them?',
  'Who is the ideal customer for Artemis products?',
  'How do I position us vs the competition?',
  'What ROI metrics can I use for T-Shape 2?',
  'What industries should I be targeting?',
]

const CATEGORIES = ['T-Shape 2', 'NeoGen', 'Competitors', 'Pricing', 'ROI', 'Other']

export default function Knowledge() {
  const [question, setQuestion] = useState('')
  const [output, setOutput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [lastQuestion, setLastQuestion] = useState('')

  const [notes, setNotes] = useState<KnowledgeNote[]>([])
  const [noteContent, setNoteContent] = useState('')
  const [noteCategory, setNoteCategory] = useState('T-Shape 2')
  const [savingNote, setSavingNote] = useState(false)
  const [showAddNote, setShowAddNote] = useState(false)

  useEffect(() => { loadNotes() }, [])

  const loadNotes = async () => {
    const data = await get<KnowledgeNote[]>('/knowledge/notes')
    setNotes(data)
  }

  const handleAsk = async (q?: string) => {
    const q_ = q || question
    if (!q_.trim()) return
    setLastQuestion(q_)
    setOutput('')
    setIsStreaming(true)
    if (q) setQuestion(q)
    try {
      for await (const chunk of streamPost('/knowledge/ask', { question: q_ })) {
        setOutput(prev => prev + chunk)
      }
    } catch (e: any) {
      setOutput(`Error: ${e.message}`)
    } finally {
      setIsStreaming(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteContent.trim()) return
    setSavingNote(true)
    try {
      await post('/knowledge/notes', { category: noteCategory, content: noteContent })
      setNoteContent('')
      await loadNotes()
      setShowAddNote(false)
    } finally {
      setSavingNote(false)
    }
  }

  const handleDeleteNote = async (id: number) => {
    await del(`/knowledge/notes/${id}`)  // This would need a delete endpoint
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="page-transition grid grid-cols-5 gap-6">
      {/* Left: Q&A */}
      <div className="col-span-3 space-y-4">
        {/* Ask */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
            <BookOpen size={18} className="text-amber-500" />
            Product Knowledge Base
          </h2>
          <p className="text-slate-500 text-sm mb-4">
            Ask anything about T-Shape 2, NeoGen, competitors, or Artemis Distribution. Get answers you can use on a call right now.
          </p>

          <div className="flex gap-2">
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              placeholder="e.g. How do I handle the 'we have a vendor' objection?"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
            />
            <button
              onClick={() => handleAsk()}
              disabled={!question.trim() || isStreaming}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
            >
              {isStreaming ? <Loader2 size={15} className="animate-spin" /> : 'Ask'}
            </button>
          </div>

          {/* Quick questions */}
          <div className="mt-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick Questions</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => handleAsk(q)}
                  className="text-xs bg-slate-100 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Answer */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {lastQuestion && (
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Question</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{lastQuestion}</p>
            </div>
          )}
          <div className="p-5 min-h-48">
            {output ? (
              <StreamingText text={output} isStreaming={isStreaming} />
            ) : (
              <div className="h-40 flex items-center justify-center text-center">
                <div>
                  <BookOpen size={32} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Ask a question to get instant product intelligence</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: My Notes */}
      <div className="col-span-2 space-y-4">
        {/* Products overview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-3">Products at a Glance</h3>
          <div className="space-y-3">
            <ProductCard
              name="T-Shape 2"
              tagline="Premium Distribution Solution"
              bullet1="Scalable & efficient"
              bullet2="Faster deployment, lower maintenance"
              color="amber"
            />
            <ProductCard
              name="NeoGen"
              tagline="Next-Gen Performance Line"
              bullet1="35% better performance"
              bullet2="6-month ROI payback"
              color="blue"
            />
          </div>
        </div>

        {/* My Notes */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">My Knowledge Notes</h3>
            <button
              onClick={() => setShowAddNote(!showAddNote)}
              className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-semibold"
            >
              <Plus size={14} />
              Add Note
            </button>
          </div>

          {showAddNote && (
            <div className="px-5 py-4 border-b border-slate-100 bg-amber-50">
              <div className="space-y-3">
                <select
                  value={noteCategory}
                  onChange={e => setNoteCategory(e.target.value)}
                  className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-amber-400 transition-colors"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <textarea
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  placeholder="Add your product knowledge, pricing details, or internal info..."
                  rows={3}
                  className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-amber-400 transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddNote}
                    disabled={!noteContent.trim() || savingNote}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    {savingNote ? 'Saving...' : 'Save Note'}
                  </button>
                  <button
                    onClick={() => setShowAddNote(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {notes.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-slate-400 text-sm">No notes yet.</p>
                <p className="text-slate-400 text-xs mt-1">Add product details, pricing, or internal knowledge.</p>
              </div>
            ) : (
              notes.map(note => (
                <div key={note.id} className="px-5 py-3 hover:bg-slate-50 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium mb-1">
                      {note.category}
                    </span>
                    <p className="text-sm text-slate-700 leading-relaxed">{note.content}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductCard({ name, tagline, bullet1, bullet2, color }: {
  name: string; tagline: string; bullet1: string; bullet2: string; color: string
}) {
  const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  }
  const c = colorMap[color]
  return (
    <div className={`${c.bg} rounded-xl p-3`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 ${c.dot} rounded-full`} />
        <p className={`text-sm font-bold ${c.text}`}>{name}</p>
      </div>
      <p className="text-xs text-slate-600 mb-2">{tagline}</p>
      <div className="space-y-1">
        <p className="text-xs text-slate-600 flex items-center gap-1.5"><ChevronRight size={10} />{bullet1}</p>
        <p className="text-xs text-slate-600 flex items-center gap-1.5"><ChevronRight size={10} />{bullet2}</p>
      </div>
    </div>
  )
}
