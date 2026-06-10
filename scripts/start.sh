#!/usr/bin/env bash
set -euo pipefail

# Quick dev start script
# Usage: ./start.sh [--docker|--dev|--help]

MODE="${1:---docker}"

case "$MODE" in
  --docker|-d)
    docker compose up -d --build
    docker compose logs -f
    ;;
  --dev)
    if ! command -v dotnet >/dev/null 2>&1; then echo "dotnet not found" >&2; exit 1; fi
    if ! command -v bun >/dev/null 2>&1 && ! command -v npm >/dev/null 2>&1; then
      echo "bun or npm not found" >&2; exit 1
    fi

    # start postgres if not running
    if ! pg_isready -q 2>/dev/null; then
      echo "Starting PostgreSQL via Docker..."
      docker compose up -d postgres
      for i in $(seq 1 30); do
        if pg_isready -q 2>/dev/null; then break; fi
        sleep 1
      done
    fi

    # ensure dotnet-ef
    if ! command -v dotnet-ef >/dev/null 2>&1; then
      dotnet tool install --global dotnet-ef --version 8.* || true
      export PATH="$PATH:$HOME/.dotnet/tools"
    fi

    dotnet ef database update --project backend/RestaurantApp.Infrastructure --startup-project backend/RestaurantApp.API

    echo "Starting backend on :5000..."
    dotnet run --project backend/RestaurantApp.API --no-launch-profile --urls http://localhost:5000 &
    BACKEND_PID=$!

    echo "Starting frontend on :3000..."
    cd frontend
    [[ ! -f .env.local ]] && cp env.example.txt .env.local
    if command -v bun >/dev/null 2>&1; then
      bun run dev &
    else
      npm run dev &
    fi
    FRONTEND_PID=$!
    cd ..

    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
    echo ""
    echo "  Backend:  http://localhost:5000"
    echo "  Frontend: http://localhost:3000"
    echo "  Press Ctrl+C to stop"
    echo ""
    wait
    ;;
  --help|-h)
    echo "Usage: ./start.sh [--docker|--dev|--help]"
    echo "  --docker  Everything via Docker Compose (default)"
    echo "  --dev     Local: postgres(docker) + backend + frontend"
    exit 0
    ;;
  *)
    echo "Unknown: $1 (use --help)" >&2
    exit 1
    ;;
esac
