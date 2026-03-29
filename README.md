# ⚡ Artemis SDR Assistant

An AI-powered Sales Development Representative assistant built with Claude. Helps you book more meetings, write better emails, and become unbelievably good at your job.

## Features

| Feature | What it does |
|---|---|
| **Lead Intelligence** | Deep-dive research on any prospect — personalization hooks, pain points, talk tracks, objection handles |
| **Email Studio** | Hyper-personalized emails in your writing style (learns from samples you provide) |
| **Call Coach** | Paste any call transcript → get expert coaching with line-by-line feedback and a letter grade |
| **Product Knowledge** | Ask anything about T-Shape 2, NeoGen, or Artemis Distribution — get instant, memorable answers |
| **Memory / CRM** | Log every interaction, search your history, synthesize a full prospect profile with AI |
| **Daily Brief** | AI-generated morning game plan with tips, openers, and objection drills |
| **Personal Agent** | Build a complete personal AI operating system tailored to your goals and stack |

## Quick Start

### 1. Set your API key

Create a `.env` file in the project root (copy from the example below):

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get your key at [console.anthropic.com](https://console.anthropic.com) → API Keys.

### 2. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
```

### 4. Start the app

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

## Cost

This app uses **Claude Haiku 4.5** — Anthropic's fastest and most affordable model.

| | Per request | Per day (5 requests) | Per year |
|---|---|---|---|
| Estimated cost | ~$0.003 | ~$0.015 | ~$5.00 |

> Costs are estimates based on ~800 input + ~700 output tokens per request at Haiku pricing ($0.80 / $4.00 per million tokens). Heavy use of the Personal Agent Blueprint endpoint (~2,000 output tokens) will cost slightly more per call.

## Stack

- **Backend**: FastAPI + Claude Haiku 4.5 (streaming) + SQLite
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **AI**: Anthropic Claude Haiku via streaming Server-Sent Events

## Project Structure

```
crispy-fiesta/
├── .env                     # API key (gitignored — never committed)
├── backend/
│   ├── main.py              # FastAPI app with all AI routes
│   ├── database.py          # SQLite async operations
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
│           ├── Memory.tsx       # CRM + AI synthesis
│           └── PersonalAgent.tsx
└── start.sh                 # One-command startup
```

## Requirements

- Python 3.11+
- Node.js 18+
- Anthropic API key
