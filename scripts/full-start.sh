#!/usr/bin/env bash
set -euo pipefail

# Full start helper for the Restaurant Ordering System
# Usage: ./scripts/full-start.sh [--docker|--local] [--env .env] [--no-tail]
# By default runs in local mode (starts DB, backend and frontend).

MODE=local
ENV_FILE=".env"
NO_TAIL=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --docker) MODE=docker; shift ;;
    --local) MODE=local; shift ;;
    --env) ENV_FILE="$2"; shift 2 ;;
    --no-tail) NO_TAIL=true; shift ;;
    -h|--help)
      cat <<'USAGE'
Usage: full-start.sh [--docker|--local] [--env .env] [--no-tail]

Options:
  --docker    Start services with docker compose (requires docker)
  --local     Start services locally (start postgres, apply migrations, run backend and frontend)
  --env FILE  Source environment variables from FILE (default: .env)
  --no-tail   Do not tail logs after startup
USAGE
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [[ -f "$ENV_FILE" ]]; then
  echo "Sourcing $ENV_FILE"
  set -a; source "$ENV_FILE"; set +a
fi

# defaults
: "${DATABASE_URL:=Host=localhost;Database=restaurant;Username=postgres;Password=secret}"
: "${JWT_SECRET:=dev-secret-minimum-32-characters-long!!}"
: "${JWT_EXPIRY_HOURS:=8}"
: "${CORS_ORIGINS:=http://localhost:3000}"
: "${NEXT_PUBLIC_API_URL:=http://localhost:5000/api}"
: "${NEXT_PUBLIC_SIGNALR_URL:=http://localhost:5000/hubs}"

mkdir -p "$REPO_ROOT/logs"

cleanup() {
  echo ""
  echo "Shutting down..."
  if [[ -n "${BACKEND_PID:-}" ]]; then kill "$BACKEND_PID" 2>/dev/null || true; fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then kill "$FRONTEND_PID" 2>/dev/null || true; fi
  exit 0
}
trap cleanup SIGINT SIGTERM

wait_for_url() {
  local url="$1"; local timeout=${2:-120}
  echo "Waiting for $url (timeout ${timeout}s)..."
  for i in $(seq 1 $timeout); do
    if curl -sSf "$url" >/dev/null 2>&1; then
      echo "OK: $url"
      return 0
    fi
    sleep 1
  done
  echo "Timed out waiting for $url" >&2
  return 1
}

if [[ "$MODE" == "docker" ]]; then
  if command -v docker >/dev/null 2>&1; then
    if docker compose version >/dev/null 2>&1; then
      DC=(docker compose)
    else
      DC=(docker-compose)
    fi
    echo "Starting services with ${DC[*]}..."
    "${DC[@]}" up -d --build
  else
    echo "docker is not installed; aborting" >&2
    exit 1
  fi

  wait_for_url "http://localhost:5000/api/menu" 180 || true
  echo "Services started via docker. Backend: http://localhost:5000 | Frontend: http://localhost:3000"
  if [[ "$NO_TAIL" != "true" ]]; then
    "${DC[@]}" logs -f
  fi
  exit 0
fi

# Local mode
if ! command -v dotnet >/dev/null 2>&1; then
  echo "dotnet not found in PATH" >&2; exit 1
fi

# Start postgres container if not already running
if ! pg_isready -q 2>/dev/null; then
  if command -v docker >/dev/null 2>&1; then
    echo "PostgreSQL not running locally. Starting via Docker..."
    docker compose up -d postgres
    echo "Waiting for PostgreSQL..."
    for i in $(seq 1 30); do
      if pg_isready -q 2>/dev/null; then break; fi
      sleep 1
    done
  else
    echo "PostgreSQL not running and Docker not found." >&2
    echo "Start PostgreSQL manually, then re-run this script." >&2
    exit 1
  fi
else
  echo "PostgreSQL is running."
fi

if ! command -v dotnet-ef >/dev/null 2>&1; then
  echo "dotnet-ef not found. Attempting to install..."
  dotnet tool install --global dotnet-ef --version 8.* || true
  export PATH="$PATH:$HOME/.dotnet/tools"
fi

echo "Applying EF migrations..."
dotnet ef database update --project backend/RestaurantApp.Infrastructure --startup-project backend/RestaurantApp.API || echo "Migrations may have failed; continuing"

echo "Starting backend (logs: logs/backend.log)..."
DATABASE_URL="$DATABASE_URL" JWT_SECRET="$JWT_SECRET" JWT_EXPIRY_HOURS="$JWT_EXPIRY_HOURS" CORS_ORIGINS="$CORS_ORIGINS" \
  dotnet run --project backend/RestaurantApp.API --no-launch-profile --urls http://localhost:5000 \
  >> "$REPO_ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!

sleep 1
wait_for_url "http://localhost:5000/api/menu" 120

echo "Starting frontend (logs: logs/frontend.log)..."
cd frontend

# ensure .env.local exists for frontend
if [[ ! -f .env.local ]]; then
  echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL" > .env.local
  echo "NEXT_PUBLIC_SIGNALR_URL=$NEXT_PUBLIC_SIGNALR_URL" >> .env.local
fi

if command -v bun >/dev/null 2>&1; then
  nohup bun run dev >> "$REPO_ROOT/logs/frontend.log" 2>&1 &
elif command -v npm >/dev/null 2>&1; then
  nohup npm run dev >> "$REPO_ROOT/logs/frontend.log" 2>&1 &
else
  echo "No JS runner (bun/npm) found; please start frontend manually" >&2
fi
FRONTEND_PID=$!
cd "$REPO_ROOT"

sleep 1
echo "Startup attempted. Backend: http://localhost:5000 | Frontend: http://localhost:3000"

if [[ "$NO_TAIL" != "true" ]]; then
  tail -n +1 -f "$REPO_ROOT/logs/backend.log" "$REPO_ROOT/logs/frontend.log"
fi
