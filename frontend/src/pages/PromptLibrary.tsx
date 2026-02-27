import { useState, useEffect, useCallback } from 'react'
import { Library, Search, Plus, Copy, Check, Trash2, Tag, BookMarked, X } from 'lucide-react'
import { get, post, del } from '../api'

interface SavedPrompt {
  id: number
  title: string
  prompt: string
  category: string
  technique: string
  tags: string
  notes: string
  created_at: string
}

const TEMPLATE_PROMPTS: Omit<SavedPrompt, 'id' | 'created_at'>[] = [
  {
    title: 'Expert Chain of Thought',
    category: 'reasoning',
    technique: 'Chain of Thought',
    tags: 'cot, reasoning, step-by-step',
    notes: 'Elicits structured, step-by-step reasoning for complex problems.',
    prompt: `You are an expert in [domain]. I need you to solve the following problem carefully.

Problem: [INSERT PROBLEM]

Think through this step by step:
1. First, identify what information is given and what needs to be found
2. Consider which approach or framework applies
3. Work through the solution methodically
4. Check your reasoning at each step
5. State the final answer clearly

Show all your reasoning. Do not skip steps.`,
  },
  {
    title: 'Few-Shot Classifier',
    category: 'few-shot',
    technique: 'Few-Shot Learning',
    tags: 'few-shot, classification, examples',
    notes: 'Demonstrates classification behavior with curated examples before the actual input.',
    prompt: `Classify the following text into one of these categories: [CATEGORY_1], [CATEGORY_2], [CATEGORY_3].

Here are examples:

Input: "[EXAMPLE_1]"
Category: [CATEGORY_1]
Reason: [WHY]

Input: "[EXAMPLE_2]"
Category: [CATEGORY_2]
Reason: [WHY]

Input: "[EXAMPLE_3]"
Category: [CATEGORY_3]
Reason: [WHY]

Now classify:
Input: "[YOUR_TEXT]"
Category:`,
  },
  {
    title: 'System Prompt: Expert Persona',
    category: 'system',
    technique: 'System Prompt Design',
    tags: 'system, persona, expert, instruction',
    notes: 'A well-structured system prompt template for creating expert personas with clear behavioral guidelines.',
    prompt: `You are [EXPERT_ROLE] with [N] years of experience in [DOMAIN].

Your expertise includes:
- [SPECIFIC_SKILL_1]
- [SPECIFIC_SKILL_2]
- [SPECIFIC_SKILL_3]

Communication style:
- Be direct and precise — no filler phrases or unnecessary hedging
- Use technical terminology correctly, but explain it when context requires
- Cite specific examples and data when making claims
- When uncertain, say so explicitly and explain what additional information would help

Constraints:
- Stay strictly within your domain of expertise
- Do not speculate beyond available evidence
- If asked about something outside your expertise, redirect to what you CAN help with

Your goal is to provide [OUTCOME] for the user.`,
  },
  {
    title: 'Structured JSON Output',
    category: 'output-format',
    technique: 'Structured Output',
    tags: 'json, structured, output, format',
    notes: 'Forces consistent JSON output with schema definition and example.',
    prompt: `Extract the following information from the text and return ONLY valid JSON matching this exact schema:

{
  "field_1": "string | description of what goes here",
  "field_2": "number | description",
  "field_3": ["array", "of", "strings"],
  "field_4": {
    "nested_field": "string"
  }
}

Rules:
- Return ONLY the JSON object, no explanation or markdown
- If a field cannot be determined, use null
- Do not add fields not in the schema
- Ensure valid JSON (proper quotes, commas, brackets)

Text to extract from:
[INSERT TEXT HERE]`,
  },
  {
    title: 'Self-Critique Refiner',
    category: 'reasoning',
    technique: 'Self-Critique',
    tags: 'self-critique, refinement, quality, iteration',
    notes: 'Makes the model generate then critique and improve its own output.',
    prompt: `Task: [DESCRIBE TASK]

Step 1 - Initial attempt:
[Write your first attempt at the task]

Step 2 - Self-critique:
Review your response above. Identify:
- Weaknesses or gaps in the response
- Assumptions that might be wrong
- Missing important considerations
- Ways to make it clearer, more precise, or more useful

Step 3 - Improved version:
Based on your critique, write an improved version that addresses all the issues you identified.

Step 4 - Final check:
In one sentence, describe what makes the improved version better than the initial attempt.`,
  },
  {
    title: 'Tree of Thought Problem Solver',
    category: 'reasoning',
    technique: 'Tree of Thought',
    tags: 'tot, tree-of-thought, exploration, reasoning',
    notes: 'Explores multiple reasoning paths and selects the best approach.',
    prompt: `Problem: [INSERT PROBLEM]

Explore this problem using multiple reasoning approaches:

**Approach A: [First strategy name]**
- How this approach works for this problem:
- Key steps:
- Potential issues:
- Likelihood of success: [Low/Medium/High]

**Approach B: [Second strategy name]**
- How this approach works for this problem:
- Key steps:
- Potential issues:
- Likelihood of success: [Low/Medium/High]

**Approach C: [Third strategy name]**
- How this approach works for this problem:
- Key steps:
- Potential issues:
- Likelihood of success: [Low/Medium/High]

**Best approach selection:**
After evaluating all approaches, the best choice is [APPROACH] because [REASONING].

**Final solution using best approach:**
[Execute the selected approach to solve the problem]`,
  },
  {
    title: 'Code Review Expert',
    category: 'coding',
    technique: 'Persona / Role',
    tags: 'code, review, debugging, expert',
    notes: 'Expert code review with structured feedback and specific improvements.',
    prompt: `You are a senior software engineer conducting a code review. Analyze the following code with the rigor you would apply to a production pull request.

Language/Framework: [SPECIFY]

Code:
\`\`\`
[PASTE CODE HERE]
\`\`\`

Provide your review in this format:

## Overall Assessment
[1-2 sentence verdict]

## Critical Issues (must fix)
For each issue: location → problem → fix with corrected code snippet

## Improvements (should fix)
For each: what, why, how

## Positive Observations
What's done well (important for learning)

## Refactored Version
\`\`\`
[Provide improved version of the code]
\`\`\``,
  },
  {
    title: 'Socratic Learning Tutor',
    category: 'general',
    technique: 'Persona / Role',
    tags: 'learning, socratic, teaching, education',
    notes: 'A tutor that builds genuine understanding through questioning rather than direct answers.',
    prompt: `You are a Socratic tutor helping me deeply understand [TOPIC].

Your method:
1. Never give direct answers — always respond with guiding questions
2. Build on what I say to reveal gaps in my understanding
3. Use analogies and concrete examples to make abstract concepts tangible
4. Celebrate correct reasoning, gently challenge incorrect reasoning
5. Move from concrete to abstract, from simple to complex

Important: When I arrive at the correct understanding myself, confirm it and deepen it — don't just move on.

My current understanding of [TOPIC]: [DESCRIBE YOUR CURRENT UNDERSTANDING]

Let's start: [FIRST QUESTION OR CONCEPT TO EXPLORE]`,
  },
  {
    title: 'Prompt Optimizer (Meta)',
    category: 'meta',
    technique: 'Meta-Prompting',
    tags: 'meta, optimizer, improve, prompt-engineering',
    notes: 'Uses the model to generate optimized prompts for specific tasks.',
    prompt: `I need you to generate an optimal prompt for the following task.

Task description: [DESCRIBE WHAT YOU NEED THE AI TO DO]
Target model: [Claude / GPT-4 / etc.]
Desired output format: [DESCRIBE]
Key constraints: [LIST ANY CONSTRAINTS]
Examples of good outputs: [OPTIONAL: 1-2 examples]

Generate a prompt that:
1. Uses the most appropriate prompting technique(s) for this task
2. Is specific about format, constraints, and expectations
3. Includes any necessary context or persona
4. Will consistently produce high-quality outputs

Explain which techniques you used and why, then provide the final prompt.`,
  },
  {
    title: 'Research Synthesizer',
    category: 'analysis',
    technique: 'Structured Output',
    tags: 'research, synthesis, analysis, summary',
    notes: 'Synthesizes information from multiple sources into structured insights.',
    prompt: `Synthesize the following information into clear, actionable insights.

[PASTE YOUR SOURCE MATERIAL HERE]

Structure your synthesis as:

## Core Thesis
[1-2 sentences: the central argument or finding across all sources]

## Key Findings (top 3-5)
For each:
- **Finding**: [Clear statement]
- **Evidence**: [What supports this]
- **Implication**: [What this means practically]

## Points of Agreement
Where sources converge — this is most reliable

## Points of Tension or Contradiction
Where sources disagree and why it might matter

## What's Missing
Important questions not answered by available sources

## Actionable Conclusions
Based on this synthesis, what should someone DO differently?`,
  },
]

const CATEGORIES = ['all', 'general', 'reasoning', 'coding', 'system', 'few-shot', 'output-format', 'meta', 'analysis', 'creative', 'agent']

export default function PromptLibrary() {
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<'saved' | 'templates'>('templates')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newPrompt, setNewPrompt] = useState({ title: '', prompt: '', category: 'general', technique: '', tags: '', notes: '' })

  const loadPrompts = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      const data = await get<SavedPrompt[]>(`/library?${params}`)
      setSavedPrompts(data)
    } catch { /* silent */ }
  }, [search, categoryFilter])

  useEffect(() => {
    loadPrompts()
  }, [loadPrompts])

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (id: number) => {
    try {
      await del(`/library/${id}`)
      setSavedPrompts(prev => prev.filter(p => p.id !== id))
    } catch { /* silent */ }
  }

  const handleSaveNew = async () => {
    if (!newPrompt.title.trim() || !newPrompt.prompt.trim()) return
    try {
      await post('/library/save', newPrompt)
      setShowAddModal(false)
      setNewPrompt({ title: '', prompt: '', category: 'general', technique: '', tags: '', notes: '' })
      loadPrompts()
    } catch { /* silent */ }
  }

  const handleSaveTemplate = async (template: typeof TEMPLATE_PROMPTS[0]) => {
    try {
      await post('/library/save', template)
      setActiveTab('saved')
      loadPrompts()
    } catch { /* silent */ }
  }

  const filteredTemplates = TEMPLATE_PROMPTS.filter(t => {
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.toLowerCase().includes(search.toLowerCase()) || t.prompt.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const displayPrompts = activeTab === 'saved' ? savedPrompts : filteredTemplates as unknown as SavedPrompt[]

  return (
    <div className="flex h-full">
      {/* Left panel: controls */}
      <div className="w-[280px] flex-shrink-0 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Library className="w-5 h-5 text-teal-400" />
            <h1 className="text-white font-bold text-lg">Prompt Library</h1>
          </div>
          <p className="text-gray-500 text-sm">Templates and your saved prompts</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {([
            { id: 'templates', label: 'Templates', count: TEMPLATE_PROMPTS.length },
            { id: 'saved', label: 'My Prompts', count: savedPrompts.length },
          ] as const).map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-all border-b-2 ${
                activeTab === id
                  ? 'border-teal-500 text-teal-400 bg-teal-500/5'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === id ? 'bg-teal-500/20 text-teal-400' : 'bg-gray-800 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search prompts..."
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-teal-500 placeholder-gray-600"
            />
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`text-xs px-2 py-1 rounded-md border transition-all ${
                  categoryFilter === cat
                    ? 'bg-teal-600/20 border-teal-500 text-teal-300'
                    : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1" />

        {/* Add prompt button */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Save New Prompt
          </button>
        </div>
      </div>

      {/* Right panel: prompt grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {activeTab === 'templates' ? (
              <BookMarked className="w-4 h-4 text-teal-400" />
            ) : (
              <Library className="w-4 h-4 text-teal-400" />
            )}
            <span className="text-white font-medium text-sm">
              {activeTab === 'templates' ? 'Curated Templates' : 'My Saved Prompts'}
            </span>
            <span className="text-gray-500 text-xs">({displayPrompts.length})</span>
          </div>
        </div>

        {displayPrompts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Library className="w-12 h-12 text-gray-700 mb-4" />
            <p className="text-gray-500 text-sm font-medium">
              {activeTab === 'saved' ? 'No saved prompts yet' : 'No templates match your search'}
            </p>
            {activeTab === 'saved' && (
              <p className="text-gray-700 text-xs mt-2">Save prompts from the Prompt Lab or click "Save New Prompt"</p>
            )}
          </div>
        )}

        <div className="space-y-3">
          {displayPrompts.map((p, i) => {
            const cardId = `${activeTab}-${p.id ?? i}`
            const isExpanded = expandedId === cardId
            const isCopied = copiedId === cardId

            return (
              <div
                key={cardId}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all"
              >
                {/* Header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-white font-semibold text-sm">{p.title}</h3>
                        {p.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                            {p.category}
                          </span>
                        )}
                        {p.technique && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            {p.technique}
                          </span>
                        )}
                      </div>
                      {p.notes && (
                        <p className="text-gray-500 text-xs leading-relaxed">{p.notes}</p>
                      )}
                      {p.tags && (
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          <Tag className="w-3 h-3 text-gray-600" />
                          {p.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                            <span key={tag} className="text-xs text-gray-600">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleCopy(cardId, p.prompt)}
                        className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        title="Copy prompt"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      {activeTab === 'templates' ? (
                        <button
                          onClick={() => handleSaveTemplate(TEMPLATE_PROMPTS.find(t => t.title === p.title)!)}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-teal-700 text-gray-400 hover:text-white transition-colors"
                          title="Save to my prompts"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDelete((p as SavedPrompt).id)}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Prompt preview */}
                <div className="border-t border-gray-800">
                  <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px]' : 'max-h-24'}`}>
                    <pre className="p-4 text-xs text-gray-400 font-mono leading-relaxed whitespace-pre-wrap">
                      {p.prompt}
                    </pre>
                  </div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : cardId)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors border-t border-gray-800 bg-gray-800/30"
                  >
                    {isExpanded ? 'Show less' : 'Show full prompt'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add prompt modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold">Save New Prompt</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Title *</label>
                <input
                  value={newPrompt.title}
                  onChange={e => setNewPrompt(p => ({ ...p, title: e.target.value }))}
                  placeholder="Give this prompt a name"
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Prompt *</label>
                <textarea
                  value={newPrompt.prompt}
                  onChange={e => setNewPrompt(p => ({ ...p, prompt: e.target.value }))}
                  placeholder="Paste or write your prompt..."
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 resize-none font-mono"
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Category</label>
                  <select
                    value={newPrompt.category}
                    onChange={e => setNewPrompt(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                  >
                    {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Technique</label>
                  <input
                    value={newPrompt.technique}
                    onChange={e => setNewPrompt(p => ({ ...p, technique: e.target.value }))}
                    placeholder="e.g. CoT, Few-Shot..."
                    className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Tags</label>
                <input
                  value={newPrompt.tags}
                  onChange={e => setNewPrompt(p => ({ ...p, tags: e.target.value }))}
                  placeholder="comma, separated, tags"
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Notes</label>
                <input
                  value={newPrompt.notes}
                  onChange={e => setNewPrompt(p => ({ ...p, notes: e.target.value }))}
                  placeholder="What does this prompt do? When to use it?"
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNew}
                disabled={!newPrompt.title.trim() || !newPrompt.prompt.trim()}
                className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-lg py-2 text-sm font-semibold transition-colors"
              >
                Save Prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
