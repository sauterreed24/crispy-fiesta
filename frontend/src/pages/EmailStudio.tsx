import { useState, useEffect } from 'react'
import { Mail, Plus, Trash2, Sparkles, BookMarked, Loader2, Copy, Check } from 'lucide-react'
import { streamPost, get, post, del } from '../api'
import StreamingText from '../components/StreamingText'

interface StyleSample {
  id: number
  sample_text: string
  label: string
  created_at: string
}

interface Email {
  id: number
  recipient_name: string
  company: string
  subject: string
  body: string
  email_type: string
  created_at: string
}

const EMAIL_TYPES = [
  { value: 'cold_outreach', label: '❄️ Cold Outreach' },
  { value: 'follow_up', label: '🔄 Follow-Up' },
  { value: 'post_call', label: '📞 Post-Call' },
  { value: 'nurture', label: '🌱 Nurture' },
  { value: 'breakup', label: '👋 Breakup' },
]

export default function EmailStudio({ onStatsRefresh }: { onStatsRefresh: () => void }) {
  const [tab, setTab] = useState<'compose' | 'style' | 'history'>('compose')
  const [recipientName, setRecipientName] = useState('')
  const [recipientTitle, setRecipientTitle] = useState('')
  const [company, setCompany] = useState('')
  const [industry, setIndustry] = useState('')
  const [context, setContext] = useState('')
  const [emailType, setEmailType] = useState('cold_outreach')
  const [output, setOutput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [copied, setCopied] = useState(false)

  const [styleSamples, setStyleSamples] = useState<StyleSample[]>([])
  const [newSample, setNewSample] = useState('')
  const [sampleLabel, setSampleLabel] = useState('')
  const [savingStyle, setSavingStyle] = useState(false)

  const [emails, setEmails] = useState<Email[]>([])

  useEffect(() => {
    loadStyleSamples()
    loadEmails()
  }, [])

  const loadStyleSamples = async () => {
    const data = await get<StyleSample[]>('/style/samples')
    setStyleSamples(data)
  }

  const loadEmails = async () => {
    const data = await get<Email[]>('/emails')
    setEmails(data)
  }

  const handleGenerate = async () => {
    if (!recipientName || !company) return
    setOutput('')
    setIsStreaming(true)
    try {
      for await (const chunk of streamPost('/emails/generate', {
        recipient_name: recipientName,
        recipient_title: recipientTitle,
        company,
        industry,
        context,
        email_type: emailType,
      })) {
        setOutput(prev => prev + chunk)
      }
    } catch (e: any) {
      setOutput(`Error: ${e.message}`)
    } finally {
      setIsStreaming(false)
    }
  }

  const handleSaveEmail = async () => {
    const lines = output.split('\n')
    const subjectLine = lines.find(l => l.startsWith('SUBJECT:'))
    const subject = subjectLine ? subjectLine.replace('SUBJECT:', '').trim() : '(No subject)'
    const body = lines.filter(l => !l.startsWith('SUBJECT:')).join('\n').trim()
    await post('/emails/save', {
      recipient_name: recipientName, company, subject, body, email_type: emailType
    })
    await loadEmails()
    onStatsRefresh()
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddStyle = async () => {
    if (!newSample.trim()) return
    setSavingStyle(true)
    try {
      await post('/style/samples', { sample_text: newSample, label: sampleLabel })
      setNewSample('')
      setSampleLabel('')
      await loadStyleSamples()
      onStatsRefresh()
    } finally {
      setSavingStyle(false)
    }
  }

  const handleDeleteStyle = async (id: number) => {
    await del(`/style/samples/${id}`)
    setStyleSamples(prev => prev.filter(s => s.id !== id))
    onStatsRefresh()
  }

  return (
    <div className="page-transition space-y-4">
      {/* Tab header */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-100">
          {[
            { id: 'compose', label: '✉️ Compose', icon: <Mail size={15} /> },
            { id: 'style', label: '✍️ My Style', icon: <Sparkles size={15} /> },
            { id: 'history', label: '📁 History', icon: <BookMarked size={15} /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                tab === t.id
                  ? 'border-amber-500 text-amber-600 bg-amber-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Compose tab */}
        {tab === 'compose' && (
          <div className="p-5">
            <div className="grid grid-cols-2 gap-6">
              {/* Form */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">Recipient Info</h3>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Name *" value={recipientName} onChange={setRecipientName} placeholder="Sarah Johnson" />
                  <FormField label="Title" value={recipientTitle} onChange={setRecipientTitle} placeholder="VP Operations" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Company *" value={company} onChange={setCompany} placeholder="Acme Corp" />
                  <FormField label="Industry" value={industry} onChange={setIndustry} placeholder="Manufacturing" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email Type
                  </label>
                  <select
                    value={emailType}
                    onChange={e => setEmailType(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
                  >
                    {EMAIL_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Context / Research
                  </label>
                  <textarea
                    value={context}
                    onChange={e => setContext(e.target.value)}
                    placeholder="Anything you know about them: pain points, recent news, mutual connections, call notes..."
                    rows={4}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={!recipientName || !company || isStreaming}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {isStreaming ? <><Loader2 size={15} className="animate-spin" /> Writing...</> : '⚡ Generate Email'}
                  </button>
                </div>
                {styleSamples.length > 0 && (
                  <p className="text-xs text-green-600 font-medium">
                    ✓ {styleSamples.length} style sample{styleSamples.length > 1 ? 's' : ''} loaded — writing in your voice
                  </p>
                )}
              </div>

              {/* Output */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm">Generated Email</h3>
                  {output && !isStreaming && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={handleSaveEmail}
                        className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-4 min-h-64 overflow-y-auto">
                  {output ? (
                    <StreamingText text={output} isStreaming={isStreaming} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-center">
                      <div>
                        <Mail size={32} className="text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">Your email will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Style tab */}
        {tab === 'style' && (
          <div className="p-5 space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 text-sm font-semibold">How style learning works</p>
              <p className="text-amber-700 text-sm mt-1">
                Paste examples of your best emails or messages. The AI will analyze your tone, structure, and vocabulary — then write new emails that sound exactly like you.
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Paste Your Email / Message Sample
                  </label>
                  <textarea
                    value={newSample}
                    onChange={e => setNewSample(e.target.value)}
                    placeholder="Paste one of your actual emails or LinkedIn messages here..."
                    rows={5}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Label (optional)
                  </label>
                  <input
                    value={sampleLabel}
                    onChange={e => setSampleLabel(e.target.value)}
                    placeholder="e.g. Cold email"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
                  />
                  <button
                    onClick={handleAddStyle}
                    disabled={!newSample.trim() || savingStyle}
                    className="mt-3 w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={15} />
                    {savingStyle ? 'Saving...' : 'Add Sample'}
                  </button>
                </div>
              </div>
            </div>

            {/* Existing samples */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                Saved Samples ({styleSamples.length}/10)
              </h3>
              {styleSamples.length === 0 ? (
                <p className="text-slate-400 text-sm">No samples yet. Add your first one above.</p>
              ) : (
                <div className="space-y-2">
                  {styleSamples.map(s => (
                    <div key={s.id} className="flex items-start gap-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="flex-1 min-w-0">
                        {s.label && <p className="text-xs font-semibold text-amber-600 mb-1">{s.label}</p>}
                        <p className="text-sm text-slate-600 line-clamp-2">{s.sample_text}</p>
                      </div>
                      <button onClick={() => handleDeleteStyle(s.id)} className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* History tab */}
        {tab === 'history' && (
          <div className="p-5">
            {emails.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-10">No saved emails yet</p>
            ) : (
              <div className="space-y-3">
                {emails.map(email => (
                  <div key={email.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{email.subject || '(No subject)'}</p>
                        <p className="text-xs text-slate-500">
                          {email.recipient_name} · {email.company} · {EMAIL_TYPES.find(t => t.value === email.email_type)?.label}
                        </p>
                      </div>
                      <p className="text-xs text-slate-400">
                        {new Date(email.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-3">{email.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
