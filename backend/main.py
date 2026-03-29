import os
import json
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import anthropic

from database import (
    init_db, get_progress, update_progress,
    save_prompt, get_prompts, delete_prompt,
    save_challenge, get_challenge_history,
    save_note, get_notes,
)

app = FastAPI(title="AI Mastery Hub API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))
MODEL = "claude-opus-4-6"


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class PromptEvalRequest(BaseModel):
    prompt: str
    context: str = ""
    goal: str = ""

class PromptImproveRequest(BaseModel):
    prompt: str
    feedback: str = ""
    technique: str = ""

class TechniqueRequest(BaseModel):
    technique: str

class KnowledgeAskRequest(BaseModel):
    question: str
    depth: str = "intermediate"

class ModelCompareRequest(BaseModel):
    models: list[str] = ["Claude", "GPT-4"]
    task: str = "general reasoning"

class ChallengeGenerateRequest(BaseModel):
    difficulty: str = "intermediate"
    focus: str = "general"

class ChallengeScoreRequest(BaseModel):
    challenge: str
    user_response: str
    difficulty: str = "intermediate"

class SkillBuildRequest(BaseModel):
    skill: str
    current_level: str = "beginner"
    goal: str = ""

class ProjectIdeasRequest(BaseModel):
    skill: str
    level: str = "intermediate"

class SavePromptRequest(BaseModel):
    title: str
    prompt: str
    category: str = "general"
    technique: str = ""
    tags: str = ""
    notes: str = ""

class SaveNoteRequest(BaseModel):
    topic: str
    content: str
    category: str = "general"

class PersonalAgentBlueprintRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    role: str = Field(default="", max_length=160)
    top_goals: str = Field(..., min_length=10, max_length=2500)
    tools: str = Field(default="ChatGPT, Cursor", max_length=400)
    research_domains: str = Field(default="", max_length=600)
    shopping_preferences: str = Field(default="", max_length=600)
    coding_stack: str = Field(default="", max_length=600)
    privacy_boundaries: str = Field(default="", max_length=1200)


# ─── Streaming Helper ─────────────────────────────────────────────────────────

async def stream_claude(
    prompt: str, system: str, max_tokens: int = 2048
) -> AsyncIterator[str]:
    with client.messages.stream(
        model=MODEL,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield f"data: {json.dumps({'text': text})}\n\n"
    yield "data: [DONE]\n\n"


# ─── System Prompts ───────────────────────────────────────────────────────────

PROMPT_EXPERT_SYSTEM = """You are a world-class prompt engineering expert equivalent to senior researchers at Anthropic, OpenAI, and Google DeepMind.

Your expertise spans every prompting technique: chain-of-thought, few-shot, zero-shot, tree-of-thought, self-consistency, ReAct, meta-prompting, constitutional prompting, least-to-most, directional stimulus, self-critique, prompt chaining, structured output design, system prompt architecture, persona design, adversarial robustness, and more.

You have deep understanding of:
- Why each technique works at the model-behavior level (not just surface patterns)
- How model training (RLHF, Constitutional AI, DPO) shapes how prompts land
- Model-specific optimization differences between Claude, GPT-4o, Gemini, and open models
- Production-grade prompt engineering for agents, tools, and complex pipelines
- Adversarial prompting and prompt injection defense

Your teaching style: Expert-level, precise, with concrete examples. You name techniques correctly, explain mechanisms (not just outcomes), and share insider knowledge that separates professionals from amateurs. Short sentences. High signal. No fluff."""

AI_KNOWLEDGE_SYSTEM = """You are a senior AI researcher and educator with deep expertise in:
- Transformer architectures, attention mechanisms, positional encoding, and architectural variants (GPT, BERT, T5, Llama, Mistral, Mamba)
- Training methodologies: pretraining, instruction tuning, RLHF, DPO, Constitutional AI, RLAIF
- Inference: quantization, speculative decoding, KV caching, batching, flash attention
- Scaling laws, emergent capabilities, and phase transitions
- AI safety and alignment: reward hacking, RLHF limits, interpretability, superposition
- Evaluation: MMLU, HumanEval, HellaSwag, BIG-Bench and their limitations
- RAG architectures, embeddings, vector databases, chunking strategies
- AI agents: tool use, function calling, multi-agent systems, memory architectures
- Multimodal AI: CLIP, vision-language models, diffusion models
- The research landscape at Anthropic, OpenAI, Google DeepMind, Meta AI, Mistral

Style: Technically precise but accessible. Bridge theory and practice. Use analogies without sacrificing accuracy. Share the nuanced understanding that comes from actually working with these systems."""

CHALLENGE_SYSTEM = """You are an elite prompt engineering challenge designer and evaluator — the kind used in training programs at top AI companies.

You create challenges that test real, high-value skills: clarity and specificity, output format control, few-shot example quality, CoT elicitation, persona and system design, constraint engineering, prompt robustness, multi-step reasoning, and adversarial defense.

You evaluate with the precision of a senior AI engineer reviewing prompts for production use. You reward sophistication, penalize ambiguity, and always show the ideal solution."""


# ─── Startup ──────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    await init_db()


@app.get("/api/progress")
async def get_user_progress():
    return await get_progress()


# ─── Prompt Lab ──────────────────────────────────────────────────────────────

@app.post("/api/prompt/evaluate")
async def evaluate_prompt(req: PromptEvalRequest):
    await update_progress("prompts_evaluated", 1, 10)

    prompt = f"""Evaluate this prompt with expert-level analysis.

PROMPT TO EVALUATE:
---
{req.prompt}
---

GOAL / USE CASE: {req.goal or "Not specified"}
CONTEXT: {req.context or "None"}

## 🎯 OVERALL SCORE: [X/100]
[One-sentence verdict]

## ✅ STRENGTHS
For each strength, explain WHY it's effective at the model-behavior level — what does this actually do inside the model?

## ⚠️ WEAKNESSES & FAILURE MODES
For each weakness, describe the specific failure mode it creates. What will the model actually do wrong?

## 📊 DIMENSION SCORES (1–10 each)
- **Clarity**: [score] — [why]
- **Specificity**: [score] — [why]
- **Context richness**: [score] — [why]
- **Output format control**: [score] — [why]
- **Constraint quality**: [score] — [why]
- **Technique sophistication**: [score] — [why]

## 🔍 TECHNIQUES IDENTIFIED
Name every prompting technique present (or conspicuously absent).

## 🚨 CRITICAL ISSUES
Any fundamental flaws that will severely limit effectiveness?

## 💡 EXPERT INSIGHT
One key observation only an expert would notice — what a beginner would completely miss.

Be brutally honest. This person wants to become world-class."""

    return StreamingResponse(
        stream_claude(prompt, PROMPT_EXPERT_SYSTEM),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/prompt/improve")
async def improve_prompt(req: PromptImproveRequest):
    technique_ctx = f"\nApply / focus on technique: {req.technique}" if req.technique else ""
    feedback_ctx = f"\nUser's improvement goal: {req.feedback}" if req.feedback else ""

    prompt = f"""Transform this prompt into an elite, production-quality version.

ORIGINAL PROMPT:
---
{req.prompt}
---
{technique_ctx}
{feedback_ctx}

## 🔧 TRANSFORMATION STRATEGY
Before showing the improved version: what are the 3 most impactful changes you're making and why?

## ✨ IMPROVED PROMPT
```
[Complete improved prompt — this should be dramatically better]
```

## 📈 IMPROVEMENT BREAKDOWN
For each major change:
- **Change**: [what changed]
- **Technique**: [name the specific prompting technique]
- **Expected impact**: [how this changes model behavior]

## 🎓 TRANSFERABLE LESSONS
The 2–3 principles that will make ALL your future prompts better, extracted from this example.

## 🔬 ALTERNATIVE VARIANTS
Two different approaches to the same goal, with notes on when each is optimal."""

    return StreamingResponse(
        stream_claude(prompt, PROMPT_EXPERT_SYSTEM),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/prompt/explain-technique")
async def explain_technique(req: TechniqueRequest):
    prompt = f"""Teach the "{req.technique}" prompting technique at expert depth.

## 🧠 WHAT IT IS
Precise technical definition. What is actually happening in the model when this technique is applied?

## 🔬 THE SCIENCE
Why does this work? What does research show? Name specific papers or findings where relevant.

## 📊 WHEN TO USE vs. AVOID
Exact scenarios where this excels and where it fails or underperforms.

## 🏗️ CANONICAL TEMPLATE
```
[Template structure with inline annotations explaining each part]
```

## 💎 EXAMPLES

### Beginner Application:
```
[Example prompt]
```
[What makes this work]

### Expert Application:
```
[Sophisticated example]
```
[The nuances an expert would notice — what separates this from the basic version]

## ⚡ POWER COMBINATIONS
What techniques pair especially well with this one and why?

## 🚫 COMMON MISTAKES
The 3 ways practitioners mess this up (with corrected versions).

## 📚 GO DEEPER
Key papers, researchers, or resources for mastering this technique."""

    return StreamingResponse(
        stream_claude(prompt, PROMPT_EXPERT_SYSTEM, max_tokens=3000),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── Knowledge Hub ───────────────────────────────────────────────────────────

@app.post("/api/knowledge/ask")
async def ask_knowledge(req: KnowledgeAskRequest):
    await update_progress("knowledge_queries", 1, 5)

    depth_instruction = {
        "beginner": "Explain accessibly. Build intuition with analogies before introducing jargon. Assume no ML background.",
        "intermediate": "Assume CS/ML background. Go into meaningful technical detail. Connect theory to practical implications.",
        "expert": "Assume deep ML/AI research background. Be highly technical. Discuss nuances, open research questions, competing approaches, and limitations.",
    }.get(req.depth, "intermediate")

    prompt = f"""Question: {req.question}

Depth: {req.depth}
Instruction: {depth_instruction}

Structure your answer to maximize learning and retention:
- Start with the core insight in 1–2 sentences
- Build depth progressively
- Include practical implications for AI use and prompt engineering
- Correct common misconceptions
- Connect to real systems, models, or research when relevant

Be precise. Be insightful. Give the kind of understanding that separates practitioners from people who just use AI."""

    return StreamingResponse(
        stream_claude(prompt, AI_KNOWLEDGE_SYSTEM, max_tokens=3000),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/knowledge/compare-models")
async def compare_models(req: ModelCompareRequest):
    model_list = " vs ".join(req.models)

    prompt = f"""Compare {model_list} for: {req.task}

Give a technically grounded, practitioner-focused comparison. No marketing fluff.

## Head-to-Head Comparison

| Dimension | {" | ".join(req.models)} |
|-----------|{"---|" * len(req.models)}
[Fill key technical and practical dimensions]

## For Prompt Engineers
How does prompting differ between these models? What works uniquely well or poorly on each?

## Best Use Cases for Each
When would you choose one over the others? Be specific.

## Technical Differences That Matter
Architecture, training, alignment methodology differences that affect real-world behavior.

## Honest Practitioner Assessment
The real tradeoffs. What do people discover after using each model extensively?"""

    return StreamingResponse(
        stream_claude(prompt, AI_KNOWLEDGE_SYSTEM, max_tokens=3000),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── Challenges ──────────────────────────────────────────────────────────────

@app.post("/api/challenge/generate")
async def generate_challenge(req: ChallengeGenerateRequest):
    focus_map = {
        "general": "any high-value prompting skill",
        "chain-of-thought": "chain-of-thought and multi-step reasoning elicitation",
        "few-shot": "few-shot learning and in-context example design",
        "system-design": "system prompt architecture and instruction design",
        "output-format": "structured output and format control",
        "persona": "persona, role, and character design",
        "adversarial": "prompt injection defense and robustness",
        "creative": "creative and generative prompting",
        "code": "code generation and debugging prompts",
        "analysis": "analytical reasoning and decomposition tasks",
    }
    focus_desc = focus_map.get(req.focus, req.focus)

    prompt = f"""Generate a prompt engineering challenge.

DIFFICULTY: {req.difficulty}
FOCUS: {focus_desc}

Format EXACTLY as follows:

## 🎯 CHALLENGE: [Title]
**Difficulty**: {req.difficulty.capitalize()}
**Focus**: {req.focus}
**Time estimate**: [X minutes]

### The Scenario
[2–3 sentences: the context and why this skill matters in real practice]

### Your Task
[Clear, specific description of what the user must accomplish. What final output do they need to produce?]

### Constraints
- [Constraint 1]
- [Constraint 2]
- [Constraint 3]

### Success Criteria
Your prompt works when:
- [Measurable criterion 1]
- [Measurable criterion 2]
- [Measurable criterion 3]

### Hint *(expand if stuck)*
> [Points toward the right technique without giving away the answer]

### Skills Tested
[List 2–4 specific techniques this challenge exercises]

Make it genuinely challenging and educational. Use real-world scenarios, not contrived ones."""

    return StreamingResponse(
        stream_claude(prompt, CHALLENGE_SYSTEM, max_tokens=1500),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/challenge/score")
async def score_challenge(req: ChallengeScoreRequest):
    await update_progress("challenges_completed", 1, 25)

    prompt = f"""Score and give expert feedback on this prompt engineering challenge attempt.

THE CHALLENGE:
{req.challenge}

USER'S SUBMITTED PROMPT:
---
{req.user_response}
---

DIFFICULTY: {req.difficulty}

## 📊 SCORE: [X/100]
[One-sentence verdict on this attempt]

## ✅ WHAT WORKED
Specific elements done well with explanation of WHY they're effective at the model-behavior level.

## ⚠️ WHAT TO IMPROVE
Specific weaknesses with line-by-line better alternatives where relevant.

## 🏆 MODEL SOLUTION
```
[Show an exemplary solution — this is the gold standard]
```
[Brief explanation of why this solution is optimal]

## 📚 KEY LEARNING
The single most important insight from this challenge.

## 🎯 NEXT STEPS
What specific technique or concept should they study next, based on this attempt?"""

    return StreamingResponse(
        stream_claude(prompt, CHALLENGE_SYSTEM, max_tokens=2000),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── Skill Builder ───────────────────────────────────────────────────────────

@app.post("/api/skill/build")
async def build_skill(req: SkillBuildRequest):
    prompt = f"""Create a personalized AI-accelerated learning roadmap for mastering this skill.

SKILL: {req.skill}
CURRENT LEVEL: {req.current_level}
GOAL: {req.goal or "Become genuinely expert-level"}

## 🗺️ PERSONALIZED LEARNING ROADMAP

### Phase 1: Foundation *(adjust based on current level)*
[What to learn, in what order, what to prioritize]

### Phase 2: Core Competency
[The essential skills and knowledge — what separates beginners from competent practitioners]

### Phase 3: Advanced Mastery
[What separates experts from intermediates — the non-obvious stuff]

## 🚀 START RIGHT NOW
The single most impactful action in the next 30 minutes. Be specific.

## 🤖 HOW TO USE AI TO ACCELERATE LEARNING

### For Understanding Concepts:
```
[Ready-to-use prompt template for learning {req.skill} with AI]
```

### For Practice & Feedback:
```
[Prompt template for getting structured practice and critique]
```

### For Building Projects:
```
[Prompt template for AI-assisted project development]
```

## 📚 HIGHEST-SIGNAL RESOURCES
Top 3–5 resources ranked by learning ROI. Include free options.

## 🏆 MASTERY MILESTONES
Concrete, measurable checkpoints:
- [ ] **Beginner**: [specific milestone]
- [ ] **Intermediate**: [specific milestone]
- [ ] **Advanced**: [specific milestone]
- [ ] **Expert**: [specific milestone]

## ⚡ PRO SHORTCUTS
What do top practitioners know that most learners completely miss?"""

    return StreamingResponse(
        stream_claude(prompt, PROMPT_EXPERT_SYSTEM, max_tokens=3000),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/skill/projects")
async def project_ideas(req: ProjectIdeasRequest):
    prompt = f"""Generate 5 high-impact project ideas for mastering {req.skill} at {req.level} level using AI as a collaborator.

For each project:

## Project [N]: [Name]
**Why this project**: [Why it's high-leverage for learning this specific skill]
**What you'll build**: [Specific, tangible output]
**Skills developed**: [List]
**Time estimate**: [Realistic estimate]

**AI-Assisted Development Approach**:
Step-by-step how to use AI to build faster and learn more deeply:
1. [Step with specific prompt strategy]
2. [Step with specific prompt strategy]
3. [Step with specific prompt strategy]

**Starter Prompt**:
```
[Ready-to-use prompt to kick off this exact project]
```

**Stretch goals**: [Extensions once the base is done]

---

Make these genuinely exciting and educational. Real projects that build real skills."""

    return StreamingResponse(
        stream_claude(prompt, PROMPT_EXPERT_SYSTEM, max_tokens=3000),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── Prompt Library ──────────────────────────────────────────────────────────

@app.post("/api/library/save")
async def save_to_library(req: SavePromptRequest):
    prompt_id = await save_prompt(
        req.title, req.prompt, req.category, req.technique, req.tags, req.notes
    )
    return {"id": prompt_id, "message": "Prompt saved to library"}


@app.get("/api/library")
async def list_library(search: str = "", category: str = ""):
    return await get_prompts(search, category)


@app.delete("/api/library/{prompt_id}")
async def delete_from_library(prompt_id: int):
    await delete_prompt(prompt_id)
    return {"message": "Deleted"}


# ─── Notes ───────────────────────────────────────────────────────────────────

@app.post("/api/notes/save")
async def save_learning_note(req: SaveNoteRequest):
    note_id = await save_note(req.topic, req.content, req.category)
    return {"id": note_id, "message": "Note saved"}


@app.get("/api/notes")
async def list_notes(category: str = ""):
    return await get_notes(category)


# ─── Challenge History ────────────────────────────────────────────────────────

@app.get("/api/challenge/history")
async def challenge_history(limit: int = 20):
    return await get_challenge_history(limit)


# ─── Personal Agent Blueprint ─────────────────────────────────────────────────

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
        stream_claude(prompt, system=system, max_tokens=4096),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
