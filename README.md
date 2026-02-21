# ⚡ Artemis SDR Assistant

An AI-powered Sales Development Representative assistant built with Claude Opus. Helps you book more meetings, write better emails, and become unbelievably good at your job.

## Features

| Feature | What it does |
|---|---|
| **Lead Intelligence** | Deep-dive research on any prospect — personalization hooks, pain points, talk tracks, objection handles |
| **Email Studio** | Hyper-personalized emails in your writing style (learns from samples you provide) |
| **Call Coach** | Paste any call transcript → get expert coaching with line-by-line feedback and a letter grade |
| **Product Knowledge** | Ask anything about T-Shape 2, NeoGen, or Artemis Distribution — get instant, memorable answers |
| **Memory / CRM** | Log every interaction, search your history, synthesize a full prospect profile with AI |
| **Daily Brief** | AI-generated morning game plan with tips, openers, and objection drills |

## Quick Start

### 1. Set your API key

```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 2. Start the app

```bash
./start.sh
```

Then open **http://localhost:5173**

### Manual start

```bash
# Terminal 1 — Backend
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Frontend
cd frontend
npm run dev
```

## Stack

- **Backend**: FastAPI + Claude Opus 4.6 (streaming) + SQLite
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **AI**: Anthropic Claude Opus with adaptive thinking

## Project Structure

```
crispy-fiesta/
├── backend/
│   ├── main.py          # FastAPI app with all AI routes
│   ├── database.py      # SQLite async operations
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── api.ts           # Streaming + REST helpers
│       ├── components/
│       │   ├── Sidebar.tsx
│       │   └── StreamingText.tsx
│       └── pages/
│           ├── Dashboard.tsx    # Daily brief + stats
│           ├── Leads.tsx        # Lead research
│           ├── EmailStudio.tsx  # Email generation + style learning
│           ├── CallCoach.tsx    # Call transcript coaching
│           ├── Knowledge.tsx    # Product Q&A
│           └── Memory.tsx       # CRM + AI synthesis
└── start.sh             # One-command startup
```

## Requirements

- Python 3.11+
- Node.js 18+
- Anthropic API key
