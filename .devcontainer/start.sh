#!/usr/bin/env bash
# Runs on every container start (postStartCommand).
# Applies pending migrations, then launches Backend + Frontend in the background.
# Logs land in /tmp/devcontainer-logs/ — use `tail -f` to follow them.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

export PATH="$HOME/.dotnet/tools:$PATH"
LOG_DIR="/tmp/devcontainer-logs"
mkdir -p "$LOG_DIR"

# ── 1. Restore + Migrations ────────────────────────────────────────────────────
echo "=== [1/3] Restore + Migrations ==="
dotnet nuget locals all --clear 2>/dev/null
dotnet restore backend/RestaurantApp.API/RestaurantApp.API.csproj --no-cache 2>&1 | tee -a "$LOG_DIR/migrations.log"
dotnet ef database update \
  --project  backend/RestaurantApp.Infrastructure \
  --startup-project backend/RestaurantApp.API \
  2>&1 | tee "$LOG_DIR/migrations.log"

# ── 2. Backend ────────────────────────────────────────────────────────────────
echo "=== [2/3] Backend (port 5002) ==="
nohup dotnet run \
  --project backend/RestaurantApp.API \
  --no-launch-profile \
  --urls http://0.0.0.0:5002 \
  > "$LOG_DIR/backend.log" 2>&1 &
echo $! > /tmp/backend.pid
echo "    PID $(cat /tmp/backend.pid) — logs: $LOG_DIR/backend.log"

# ── 3. Frontend ───────────────────────────────────────────────────────────────
echo "=== [3/3] Frontend (port 3000) ==="
cd frontend
if command -v bun &>/dev/null; then
  nohup bun dev > "$LOG_DIR/frontend.log" 2>&1 &
else
  nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
fi
echo $! > /tmp/frontend.pid
echo "    PID $(cat /tmp/frontend.pid) — logs: $LOG_DIR/frontend.log"
cd "$REPO_ROOT"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Backend:  http://localhost:5002          ║"
echo "║  Swagger:  http://localhost:5002/swagger  ║"
echo "║  Frontend: http://localhost:3000          ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Follow logs:"
echo "  tail -f $LOG_DIR/backend.log"
echo "  tail -f $LOG_DIR/frontend.log"
