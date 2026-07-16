#!/usr/bin/env bash
# Runs once after the devcontainer is created (postCreateCommand).
# Installs tools, restores packages, and prepares the workspace so
# start.sh can launch services without a full build on first start.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

export PATH="$HOME/.dotnet/tools:$PATH"

# Persist dotnet tools on PATH for interactive shells
grep -qxF 'export PATH="$PATH:$HOME/.dotnet/tools"' ~/.bashrc \
  || echo 'export PATH="$PATH:$HOME/.dotnet/tools"' >> ~/.bashrc

# ── 1. dotnet-ef ──────────────────────────────────────────────────────────────
echo "=== [1/4] dotnet-ef ==="
DOTNET_MAJOR=$(dotnet --version | cut -d. -f1)
if ! command -v dotnet-ef &>/dev/null; then
  dotnet tool install --global dotnet-ef
elif [[ "$(dotnet-ef --version 2>/dev/null | head -1 | cut -d. -f1)" != "$DOTNET_MAJOR" ]]; then
  dotnet tool update --global dotnet-ef
fi

# ── 2. Backend: restore + build ───────────────────────────────────────────────
echo "=== [2/4] Backend restore + build ==="
dotnet nuget locals all --clear 2>/dev/null
dotnet restore backend/RestaurantApp.API/RestaurantApp.API.csproj --no-cache
dotnet build  backend/RestaurantApp.sln --no-restore --no-incremental -c Debug -q

# ── 3. Frontend: install deps ─────────────────────────────────────────────────
echo "=== [3/4] Frontend dependencies ==="
cd frontend
if command -v bun &>/dev/null; then
  bun install --frozen-lockfile 2>/dev/null || bun install
else
  npm ci 2>/dev/null || npm install
fi
cd "$REPO_ROOT"

# ── 4. Frontend .env.local ────────────────────────────────────────────────────
echo "=== [4/4] Frontend .env.local ==="
cat > frontend/.env.local <<'ENVEOF'
NEXT_PUBLIC_API_URL=http://localhost:5002/api
NEXT_PUBLIC_SIGNALR_URL=http://localhost:5002
NEXT_PUBLIC_CURRENCY_SYMBOL=$
ENVEOF

echo ""
echo "✅ Setup complete — container will start services automatically."
