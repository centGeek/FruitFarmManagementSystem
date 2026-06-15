#!/usr/bin/env bash
# Uruchamia cały stack Fruit Farm Management System: PostgreSQL -> backend (8091) -> frontend (5173).
# Backend i frontend startują w tle; logi trafiają do backend/.dev-logs/.
set -euo pipefail

# Katalog repo = 1 poziom w górę od tego skryptu (deployments/dev-up.sh).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
LOGS="$BACKEND/.dev-logs"
mkdir -p "$LOGS"

info()  { printf '\033[1;34m[dev-up]\033[0m %s\n' "$1"; }
warn()  { printf '\033[1;33m[dev-up]\033[0m %s\n' "$1"; }
fail()  { printf '\033[1;31m[dev-up]\033[0m %s\n' "$1" >&2; exit 1; }

# 1) Docker
info "Sprawdzam Docker..."
docker info >/dev/null 2>&1 || fail "Docker nie działa. Uruchom Docker Desktop i spróbuj ponownie."

# 2) PostgreSQL
info "Podnoszę PostgreSQL (compose.yaml)..."
( cd "$BACKEND" && docker-compose -f compose.yaml up -d )

# 3) Backend (8091)
if lsof -i :8091 >/dev/null 2>&1; then
  warn "Port 8091 już zajęty — pomijam start backendu (prawdopodobnie już działa)."
else
  info "Startuję backend na :8091 (log: $LOGS/backend.log)..."
  if [ -x "$BACKEND/mvnw" ]; then MVN="./mvnw"; else MVN="sh mvnw"; fi
  ( cd "$BACKEND" && nohup $MVN spring-boot:run >"$LOGS/backend.log" 2>&1 & echo $! >"$LOGS/backend.pid" )
fi

# 4) Frontend (5173)
if [ ! -d "$FRONTEND/node_modules" ]; then
  info "Brak node_modules — instaluję zależności frontendu..."
  ( cd "$FRONTEND" && npm install )
fi
if lsof -i :5173 >/dev/null 2>&1; then
  warn "Port 5173 już zajęty — pomijam start frontendu (prawdopodobnie już działa)."
else
  info "Startuję frontend na :5173 (log: $LOGS/frontend.log)..."
  ( cd "$FRONTEND" && nohup npm run dev >"$LOGS/frontend.log" 2>&1 & echo $! >"$LOGS/frontend.pid" )
fi

cat <<EOF

[dev-up] Gotowe. Usługi startują w tle (backend może potrzebować chwili na pierwszy build).
  Backend:  http://localhost:8091   log: $LOGS/backend.log
  Frontend: http://localhost:5173   log: $LOGS/frontend.log

  Podgląd logów:   tail -f "$LOGS/backend.log"
  Zatrzymanie:     kill \$(cat "$LOGS/backend.pid" "$LOGS/frontend.pid" 2>/dev/null) 2>/dev/null; (cd "$BACKEND" && docker-compose -f compose.yaml down)
EOF
