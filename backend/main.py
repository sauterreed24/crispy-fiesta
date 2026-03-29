import os
import json
import asyncio
from pathlib import Path
from typing import AsyncIterator
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import anthropic
from dotenv import load_dotenv

# Load .env from project root (one level up from backend/)
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

from database import (
    init_db, save_lead, get_leads, delete_lead,
    save_conversation, get_conversations, get_prospect_history, delete_conversation,
    save_email, get_emails,
    save_style_sample, get_style_samples, delete_style_sample,
    save_knowledge_note, get_knowledge_notes, delete_knowledge_note,
    get_stats
)

app = FastAPI(title="SDR Assistant API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

MODEL = "claude-opus-4-6"


# ─── Pydantic models ─────────────────────────────────────────────────────────

class LeadResearchRequest(BaseModel):
    name: str
    company: str
    title: str = ""
    context: str = ""
    save: bool = False

class SaveLeadRequest(BaseModel):
    name: str
    company: str
    title: str = ""
    notes: str = ""
    research: str = ""

class EmailRequest(BaseModel):
    recipient_name: str
    recipient_title: str = ""
    company: str
    industry: str = ""
    context: str = ""
    email_type: str = "cold_outreach"
    save: bool = False

class CallCoachRequest(BaseModel):
    transcript: str
    prospect_name: str = "Prospect"
    company: str = ""

class KnowledgeRequest(BaseModel):
    question: str
    category: str = "general"

class ConversationRequest(BaseModel):
    prospect_name: str
    company: str
    call_date: str
    outcome: str
    notes: str
    next_steps: str = ""

class StyleSampleRequest(BaseModel):
    sample_text: str
    label: str = ""

class KnowledgeNoteRequest(BaseModel):
    category: str
    content: str

class SynthesisRequest(BaseModel):
    prospect_name: str
    company: str

class DailyBriefRequest(BaseModel):
    goals: str = "10 dials, 3 meetings"


class PersonalAgentBlueprintRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    role: str = Field(default="", max_length=160)
    top_goals: str = Field(..., min_length=10, max_length=2500)
    tools: str = Field(default="ChatGPT, Cursor", max_length=400)
    research_domains: str = Field(default="", max_length=600)
    shopping_preferences: str = Field(default="", max_length=600)
    coding_stack: str = Field(default="", max_length=600)
    privacy_boundaries: str = Field(default="", max_length=1200)


# ─── System prompts ───────────────────────────────────────────────────────────

BASE_SDR_PROMPT = """You are an elite SDR assistant for Artemis Distribution — a lean, results-obsessed co-pilot for a top-performing rep.

Artemis Distribution is a distributor of premium industrial/commercial products including:
- T-Shape 2: A next-gen distribution solution built for efficiency and scalability
- NeoGen: A premium product line focused on performance and reliability

Your voice: Direct. Punchy. Confident. You sound like a top 1% rep giving advice to a peer — not a textbook. No fluff, no corporate speak. Short sentences. High signal.

You help the rep:
1. Research and personalize outreach for any lead
2. Write emails that actually get replies
3. Coach calls to sharpen skills
4. Remember and recall every prospect interaction
5. Own product knowledge cold

Always be actionable. Always make it easy to execute."""


def build_style_context(samples: list) -> str:
    if not samples:
        return ""
    sample_texts = "\n\n---\n\n".join(
        [f"Sample {i+1}:\n{s['sample_text']}" for i, s in enumerate(samples[:5])]
    )
    return f"""
WRITING STYLE REFERENCE (match this person's voice):
{sample_texts}

Analyze: sentence length, tone, vocabulary, how they open/close, level of formality, use of humor, punctuation style. Mirror it precisely.
"""


async def stream_claude(prompt: str, system: str = BASE_SDR_PROMPT) -> AsyncIterator[str]:
    """Stream Claude responses as SSE data chunks."""
    with client.messages.stream(
        model=MODEL,
        max_tokens=2048,
        thinking={"type": "adaptive"},
        system=system,
        messages=[{"role": "user", "content": prompt}]
    ) as stream:
        for text in stream.text_stream:
            yield f"data: {json.dumps({'text': text})}\n\n"
    yield "data: [DONE]\n\n"


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    await init_db()


@app.get("/api/stats")
async def get_dashboard_stats():
    return await get_stats()


# ── Lead Intelligence ─────────────────────────────────────────────────────────

@app.post("/api/leads/research")
async def research_lead(req: LeadResearchRequest):
    history = await get_prospect_history(req.name, req.company)
    history_context = ""
    if history:
        history_context = f"\n\nPROSPECT HISTORY ({len(history)} previous touchpoints):\n"
        for h in history[:3]:
            history_context += f"- {h['call_date']}: {h['outcome']} | {h['notes'][:100]}\n"

    prompt = f"""Research this lead and give me the intel I need to have a killer first conversation.

LEAD INFO:
- Name: {req.name}
- Company: {req.company}
- Title: {req.title or 'Unknown'}
- Additional context: {req.context or 'None'}
{history_context}

Give me (be specific and punchy, not generic):

## 🎯 Company Snapshot
2-3 sentences: What they do, their market position, any recent news/signals worth knowing.

## 👤 Persona Intel
Based on their title ({req.title or 'unknown title'}), what are the TOP 3 pain points this person loses sleep over? What do they care about?

## 🪝 Personalization Hooks
3 specific icebreakers or angles I can use to make the outreach feel like I did my homework (NOT generic). Reference their industry, company stage, role-specific challenges.

## 📞 Talk Track Starter
How should I open this call? Give me a 2-sentence opener that's confident, not needy.

## ⚡ Value Props to Lead With
Top 2 reasons Artemis Distribution / our products solve THEIR specific problem. Make it about them, not us.

## 🚨 Likely Objections
Top 2 objections I'll hit and a one-liner reframe for each.

## ✅ Qualification Questions
3 sharp discovery questions to qualify this lead fast.

Keep everything tight, direct, and immediately usable."""

    return StreamingResponse(
        stream_claude(prompt),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


@app.post("/api/leads/save")
async def save_lead_endpoint(req: SaveLeadRequest):
    lead_id = await save_lead(req.name, req.company, req.title, req.notes, req.research)
    return {"id": lead_id, "message": "Lead saved"}


@app.get("/api/leads")
async def list_leads(search: str = ""):
    return await get_leads(search)


@app.delete("/api/leads/{lead_id}")
async def remove_lead(lead_id: int):
    await delete_lead(lead_id)
    return {"message": "Deleted"}


# ── Email Studio ──────────────────────────────────────────────────────────────

@app.post("/api/emails/generate")
async def generate_email(req: EmailRequest):
    style_samples = await get_style_samples()
    style_context = build_style_context(style_samples)

    email_type_map = {
        "cold_outreach": "cold outreach (first touch)",
        "follow_up": "follow-up after no response",
        "post_call": "post-call follow-up",
        "nurture": "nurture / stay-in-touch",
        "breakup": "breakup email (final attempt)"
    }
    email_type_label = email_type_map.get(req.email_type, req.email_type)

    history = await get_prospect_history(req.recipient_name, req.company)
    history_context = ""
    if history:
        history_context = f"\n\nPROSPECT HISTORY:\n"
        for h in history[:2]:
            history_context += f"- {h['call_date']}: {h['outcome']}\n"

    prompt = f"""Write a {email_type_label} email for this prospect.

RECIPIENT:
- Name: {req.recipient_name}
- Title: {req.recipient_title or 'Unknown'}
- Company: {req.company}
- Industry: {req.industry or 'Unknown'}
- Additional context / research: {req.context or 'None provided'}
{history_context}
{style_context}

EMAIL RULES (non-negotiable):
- Subject line: 3-6 words, creates curiosity or pain, NOT "Quick question" or "Following up"
- Opening line: Specific hook related to THEM — NOT "Hope you're well" or "I came across your profile"
- Body: Under 100 words for cold, under 75 for follow-up
- ONE clear CTA — specific ask with specific time (e.g., "15 min Thursday 2pm?")
- Signature: Just first name, no title fluff
- Sound like a human peer, not a sales robot
- If follow-up: Reference the last touchpoint subtly

Format your response as:
SUBJECT: [subject line]

[email body]

Then below the email, add:
---
💡 WHY THIS WORKS: [2-sentence explanation of the strategy used]
🔄 ALT SUBJECT: [one alternative subject line]"""

    return StreamingResponse(
        stream_claude(prompt),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


@app.post("/api/emails/save")
async def save_email_endpoint(data: dict):
    email_id = await save_email(
        data.get("recipient_name", ""),
        data.get("company", ""),
        data.get("subject", ""),
        data.get("body", ""),
        data.get("email_type", "")
    )
    return {"id": email_id, "message": "Email saved"}


@app.get("/api/emails")
async def list_emails(limit: int = 20):
    return await get_emails(limit)


@app.post("/api/style/samples")
async def add_style_sample(req: StyleSampleRequest):
    sample_id = await save_style_sample(req.sample_text, req.label)
    return {"id": sample_id, "message": "Style sample saved — AI will now write like you"}


@app.get("/api/style/samples")
async def list_style_samples():
    return await get_style_samples()


@app.delete("/api/style/samples/{sample_id}")
async def remove_style_sample(sample_id: int):
    await delete_style_sample(sample_id)
    return {"message": "Deleted"}


# ── Call Coach ────────────────────────────────────────────────────────────────

@app.post("/api/calls/coach")
async def coach_call(req: CallCoachRequest):
    prompt = f"""Analyze this SDR call transcript and give expert coaching.

PROSPECT: {req.prospect_name} at {req.company or 'unknown company'}

TRANSCRIPT:
{req.transcript}

─────────────────────────────────────
COACHING REPORT
─────────────────────────────────────

## 📊 CALL GRADE: [A/B/C/D/F]
[1-sentence verdict]

## ✅ TOP 3 WINS
What actually worked. Be specific with timestamps or exact lines.
1.
2.
3.

## 🔧 TOP 3 FIXES (Most Impactful)
For each: Quote the actual line → then show the better version
1. **Said:** "..." → **Better:** "..."
2. **Said:** "..." → **Better:** "..."
3. **Said:** "..." → **Better:** "..."

## 🎯 #1 THING TO FIX IMMEDIATELY
The single highest-leverage change for next call.

## 🛡️ OBJECTION HANDLING ANALYSIS
How did they handle objections? Grade each one. Better reframe if needed.

## 📈 METRICS ESTIMATE
- Talk/Listen ratio: [estimate %]
- Filler words: [common ones spotted]
- Energy level: [1-10]
- Discovery depth: [1-10]

## 🏆 NEXT CALL GAME PLAN
Top 3 things to do differently next call with this prospect or similar calls.

Keep it real, direct, and actionable. This rep wants the truth, not cheerleading."""

    return StreamingResponse(
        stream_claude(prompt),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


# ── Product Knowledge ─────────────────────────────────────────────────────────

@app.post("/api/knowledge/ask")
async def ask_knowledge(req: KnowledgeRequest):
    custom_notes = await get_knowledge_notes()
    custom_context = ""
    if custom_notes:
        custom_context = "\n\nCUSTOM PRODUCT NOTES (from the rep's own knowledge base):\n"
        for note in custom_notes:
            custom_context += f"[{note['category']}] {note['content']}\n"

    knowledge_system = f"""You are an expert product specialist and sales trainer for Artemis Distribution.

ARTEMIS DISTRIBUTION PRODUCT PORTFOLIO:

**T-Shape 2:**
- What it is: A premium distribution solution designed for scalability and operational efficiency
- Key differentiators: Advanced performance metrics, superior reliability, faster deployment vs competitors
- Ideal customer: Mid-to-enterprise businesses needing reliable distribution infrastructure
- Core pain it solves: Operational bottlenecks, scalability limitations, high maintenance costs
- 30-second pitch: "T-Shape 2 is built for businesses that can't afford downtime. It cuts deployment time by 40% and scales without the typical growing pains."
- Common objections: Price → "What's the cost of your current inefficiency?", Timing → "That's exactly when companies like yours need this locked in."

**NeoGen:**
- What it is: A next-generation performance product line delivering superior results
- Key differentiators: Enhanced performance output, longer lifecycle, proven ROI
- Ideal customer: Performance-driven organizations prioritizing quality over cost
- Core pain it solves: Underperformance, frequent replacement cycles, inconsistent results
- 30-second pitch: "NeoGen is for companies tired of good enough. It outperforms alternatives by 35% and pays for itself within 6 months."
- Common objections: "We have a vendor" → "Are they giving you these numbers?"

**SDR BEST PRACTICES for Artemis:**
- Lead with pain, not product
- Use metrics and social proof whenever possible
- Target decision-makers: VP Ops, Director of Distribution, COO, Owner at SMB
- Best industries: Manufacturing, logistics, wholesale distribution, construction
- Average deal size context: Position as an investment, not an expense
{custom_context}

Your response style: Punchy, memorable, immediately usable. Use analogies. Give talk tracks. Make it stick.
Sound like a top rep coaching their peer — not a manual."""

    prompt = f"""Question: {req.question}

Give me an answer that:
1. Gets to the point in the first sentence
2. Uses a memorable analogy or hook if helpful
3. Includes a ready-to-use talk track or one-liner I can deploy on a call TODAY
4. Flags any objections I'll likely face on this topic and how to handle them

Keep it tight. Max 200 words unless the question needs more."""

    return StreamingResponse(
        stream_claude(prompt, system=knowledge_system),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


@app.post("/api/knowledge/notes")
async def add_knowledge_note(req: KnowledgeNoteRequest):
    note_id = await save_knowledge_note(req.category, req.content)
    return {"id": note_id, "message": "Knowledge note saved"}


@app.get("/api/knowledge/notes")
async def list_knowledge_notes(category: str = ""):
    return await get_knowledge_notes(category)


@app.delete("/api/knowledge/notes/{note_id}")
async def remove_knowledge_note(note_id: int):
    await delete_knowledge_note(note_id)
    return {"message": "Deleted"}


# ── Memory / CRM ──────────────────────────────────────────────────────────────

@app.post("/api/memory/conversations")
async def log_conversation(req: ConversationRequest):
    conv_id = await save_conversation(
        req.prospect_name, req.company, req.call_date,
        req.outcome, req.notes, req.next_steps
    )
    return {"id": conv_id, "message": "Conversation logged"}


@app.get("/api/memory/conversations")
async def list_conversations(search: str = ""):
    return await get_conversations(search)


@app.delete("/api/memory/conversations/{conv_id}")
async def remove_conversation(conv_id: int):
    await delete_conversation(conv_id)
    return {"message": "Deleted"}


@app.post("/api/memory/synthesize")
async def synthesize_prospect(req: SynthesisRequest):
    history = await get_prospect_history(req.prospect_name, req.company)

    if not history:
        raise HTTPException(status_code=404, detail="No history found for this prospect")

    history_text = ""
    for h in history:
        history_text += f"""
Date: {h['call_date']}
Outcome: {h['outcome']}
Notes: {h['notes']}
Next Steps: {h['next_steps']}
---"""

    prompt = f"""Synthesize all interactions with this prospect and give me the full picture.

PROSPECT: {req.prospect_name} at {req.company}
TOTAL TOUCHPOINTS: {len(history)}

INTERACTION HISTORY:
{history_text}

Give me:

## 📋 PROSPECT SUMMARY
Who is this person? What do we know about their situation, interests, and decision-making style?

## 🔑 KEY INSIGHTS
Top 3 things we've learned about this prospect from our interactions.

## 📈 RELATIONSHIP STATUS
Where are we in the sales process? What's the momentum like?

## 🎯 NEXT BEST ACTION
Exactly what should I do next and what should I say? Give me the script.

## ⚠️ WATCH OUTS
Any red flags, stall patterns, or things to be careful about with this prospect?

## 💡 PERSONALIZATION GOLD
Best hooks and personalization angles based on everything we know."""

    return StreamingResponse(
        stream_claude(prompt),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


# ── Personal Agent Blueprint ─────────────────────────────────────────────────

@app.post("/api/personal-agent/blueprint")
async def generate_personal_agent_blueprint(req: PersonalAgentBlueprintRequest):
    full_name = req.full_name.strip()
    role = req.role.strip()
    top_goals = req.top_goals.strip()
    tools = req.tools.strip()
    research_domains = req.research_domains.strip()
    shopping_preferences = req.shopping_preferences.strip()
    coding_stack = req.coding_stack.strip()
    privacy_boundaries = req.privacy_boundaries.strip()

    system = """You are a world-class AI systems architect and prompt engineer.

You build practical, high-performance personal AI agent systems for ambitious operators.
You are precise, honest, and execution-focused.

Important constraint: You cannot directly claim persistent memory across unrelated apps unless the user sets up external memory and integrations.
Always separate: (1) what works immediately in ChatGPT, (2) what requires optional automation stack, (3) privacy/security guardrails.

Output should be tactical and copy/paste ready."""

    prompt = f"""Design my personal agent system with maximum quality.

PROFILE
- Name: {full_name}
- Role: {role or 'Not specified'}
- Top goals: {top_goals}
- Tools I use: {tools}
- Research domains I care about: {research_domains or 'General research'}
- Shopping preferences: {shopping_preferences or 'No preference provided'}
- Coding stack / interests: {coding_stack or 'General software work'}
- Privacy boundaries: {privacy_boundaries or 'No special constraints provided'}

Return exactly these sections:

## 1) REALITY CHECK (IMPORTANT)
What is and is not possible natively in ChatGPT today. Be explicit and honest.

## 2) PERSONAL AGENT OPERATING SYSTEM
A concrete architecture with:
- Brain (ChatGPT usage pattern)
- Memory layer (what to store + where)
- Action layer (automations/integrations)
- Review loop (weekly improvement cycle)

## 3) CHATGPT SETUP PACK (COPY/PASTE)
Provide:
A) A "Custom Instructions" block
B) A "Personal Memory Profile" template
C) A "Daily Check-in" prompt
D) A "Weekly Review" prompt

## 4) RESEARCH COPILOT PLAYBOOK
- A prompt for fast broad research
- A prompt for source-verified deep research
- A prompt for decision memo output
- A 6-point quality checklist for hallucination resistance

## 5) SHOPPING COPILOT PLAYBOOK
- Prompt for requirement capture
- Prompt for comparison table + value scoring
- Prompt for final recommendation with tradeoffs
- Rules to avoid impulsive purchases

## 6) CODING PROMPT ENGINE FOR CURSOR/LLM IDEs
Provide:
- One universal "task brief" template
- One debugging template
- One refactor template
- One test-generation template
- One code-review template
Each must include context, constraints, acceptance criteria, and output format.

## 7) 30-DAY ROLLOUT PLAN
Week-by-week milestones to go from zero to an actually useful personal agent system.

## 8) FIRST 5 COMMANDS TO RUN TODAY
Give me 5 concrete prompts/commands I can execute right now.

Style: crisp, tactical, high agency. No fluff."""

    return StreamingResponse(
        stream_claude(prompt, system=system),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


# ── Dashboard / Daily Brief ────────────────────────────────────────────────────

@app.post("/api/dashboard/brief")
async def daily_brief(req: DailyBriefRequest):
    stats = await get_stats()
    recent_convs = await get_conversations()
    recent_leads = await get_leads()

    recent_context = ""
    if recent_convs[:3]:
        recent_context += "RECENT PROSPECTS:\n"
        for c in recent_convs[:3]:
            recent_context += f"- {c['prospect_name']} at {c['company']}: {c['outcome']}\n"

    prompt = f"""Give me a killer daily SDR brief to start the day fired up and focused.

TODAY'S GOALS: {req.goals}
TOTAL LEADS IN SYSTEM: {stats['leads']}
TOTAL CONVERSATIONS LOGGED: {stats['conversations']}
EMAILS GENERATED: {stats['emails']}
{recent_context}

Give me:

## ☀️ MORNING MINDSET
One punchy sentence to get in the zone. Not generic motivation — make it SDR-specific and real.

## 🎯 TODAY'S BATTLE PLAN
Based on the goals, what's the hour-by-hour attack plan? Keep it tactical.

## 💡 SDR TIP OF THE DAY
One specific, immediately applicable technique for booking more meetings. Make it something most reps don't do.

## 📞 POWER OPENER OF THE DAY
Give me one cold call opener I can use today that actually sounds human and gets past the first 10 seconds.

## 🧠 OBJECTION DRILL
Pick one common objection and give me the 3-step reframe for it.

Keep it energizing, tactical, and short. This is a morning brief, not a novel."""

    return StreamingResponse(
        stream_claude(prompt),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
