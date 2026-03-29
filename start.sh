#!/bin/bash

# Artemis SDR Assistant - Startup Script
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "=========================================="
echo "  ⚡ Artemis SDR Assistant"
echo "=========================================="
echo ""

# Load .env if present
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/.env"
  set +a
fi

# Check API key
if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "your-api-key-here" ]; then
  echo "❌  ANTHROPIC_API_KEY is not configured."
  echo "   Edit .env in the project root and set your key:"
  echo "   ANTHROPIC_API_KEY=sk-ant-..."
  echo ""
  exit 1
fi
echo "✅  API key loaded."
echo ""

# Kill any existing instances
pkill -f "uvicorn main:app" 2>/dev/null || true

# Start backend
echo "Starting backend (FastAPI)..."
cd "$SCRIPT_DIR/backend"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "Backend running on http://localhost:8000 (PID: $BACKEND_PID)"

# Give backend a moment to start
sleep 2

# Start frontend dev server
echo "Starting frontend (Vite)..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo "Frontend running on http://localhost:5173 (PID: $FRONTEND_PID)"

echo ""
echo "✅ SDR Assistant is LIVE!"
echo ""
echo "   🌐 Open: http://localhost:5173"
echo "   📡 API:  http://localhost:8000"
echo "   📚 Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services."
echo ""

# Handle shutdown
cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  wait 2>/dev/null || true
  echo "Done."
}
trap cleanup EXIT INT TERM

# Keep running
wait
