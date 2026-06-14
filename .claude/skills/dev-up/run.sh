#!/usr/bin/env bash
# Starts the entire Fruit Farm Management System stack: PostgreSQL -> backend (8091) -> frontend (5173).
# Backend and frontend start in the background; logs go to backend/.dev-logs/.
set -euo pipefail

# Repo directory = two levels above this script (.claude/skills/dev-up).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
LOGS="$BACKEND/.dev-logs"
mkdir -p "$LOGS"

info()  { printf '\033[1;34m[dev-up]\033[0m %s\n' "$1"; }
warn()  { printf '\033[1;33m[dev-up]\033[0m %s\n' "$1"; }
fail()  { printf '\033[1;31m[dev-up]\033[0m %s\n' "$1" >&2; exit 1; }

# 1) Docker
info "Checking Docker..."
docker info >/dev/null 2>&1 || fail "Docker is not running. Start Docker Desktop and try again."

# 2) PostgreSQL
info "Bringing up PostgreSQL (compose.yaml)..."
( cd "$BACKEND" && docker-compose -f compose.yaml up -d )

# 3) Backend (8091)
if lsof -i :8091 >/dev/null 2>&1; then
  warn "Port 8091 is already in use — skipping backend start (it is probably already running)."
else
  info "Starting backend on :8091 (log: $LOGS/backend.log)..."
  if [ -x "$BACKEND/mvnw" ]; then MVN="./mvnw"; else MVN="sh mvnw"; fi
  ( cd "$BACKEND" && nohup $MVN spring-boot:run >"$LOGS/backend.log" 2>&1 & echo $! >"$LOGS/backend.pid" )
fi

# 4) Frontend (5173)
if [ ! -d "$FRONTEND/node_modules" ]; then
  info "No node_modules — installing frontend dependencies..."
  ( cd "$FRONTEND" && npm install )
fi
if lsof -i :5173 >/dev/null 2>&1; then
  warn "Port 5173 is already in use — skipping frontend start (it is probably already running)."
else
  info "Starting frontend on :5173 (log: $LOGS/frontend.log)..."
  ( cd "$FRONTEND" && nohup npm run dev >"$LOGS/frontend.log" 2>&1 & echo $! >"$LOGS/frontend.pid" )
fi

cat <<EOF

[dev-up] Done. Services are starting in the background (the backend may need a moment for its first build).
  Backend:  http://localhost:8091   log: $LOGS/backend.log
  Frontend: http://localhost:5173   log: $LOGS/frontend.log

  View logs:   tail -f "$LOGS/backend.log"
  Stop:        kill \$(cat "$LOGS/backend.pid" "$LOGS/frontend.pid" 2>/dev/null) 2>/dev/null; (cd "$BACKEND" && docker-compose -f compose.yaml down)
EOF
