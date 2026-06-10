#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ── Env defaults (override via environment or devcontainer.json containerEnv) ──
export DATABASE_URL="${DATABASE_URL:-Host=db;Database=restaurant;Username=postgres;Password=postgres}"
export JWT_SECRET="${JWT_SECRET:-dev-secret-minimum-32-characters-long!!}"
export SEED_DEFAULT_PASSWORD="${SEED_DEFAULT_PASSWORD:-dev-password-123!}"
export PATH="$HOME/.dotnet/tools:$PATH"

# ── Sanity checks ──────────────────────────────────────────────────────────────
if ! command -v dotnet &>/dev/null; then
  echo "❌ dotnet not found. Install the .NET SDK: https://dotnet.microsoft.com" >&2
  exit 1
fi

DOTNET_MAJOR=$(dotnet --version | cut -d. -f1)

# ── dotnet-ef: install or update if needed ────────────────────────────────────
if ! command -v dotnet-ef &>/dev/null; then
  echo "⏳ Installing dotnet-ef (global)..."
  dotnet tool install --global dotnet-ef
  export PATH="$HOME/.dotnet/tools:$PATH"
else
  EF_MAJOR=$(dotnet-ef --version 2>/dev/null | head -1 | cut -d. -f1)
  if [[ "$EF_MAJOR" != "$DOTNET_MAJOR" ]]; then
    echo "⚠️  dotnet-ef $EF_MAJOR doesn't match .NET $DOTNET_MAJOR — updating..."
    dotnet tool update --global dotnet-ef
  fi
fi

INFRA="backend/RestaurantApp.Infrastructure"
API="backend/RestaurantApp.API"

echo ""
echo "── Pending migrations ────────────────────────────────────────────────────"
dotnet ef migrations list \
  --project "$INFRA" \
  --startup-project "$API" \
  --no-build 2>/dev/null || \
dotnet ef migrations list \
  --project "$INFRA" \
  --startup-project "$API"

echo ""
echo "── Applying migrations ───────────────────────────────────────────────────"
dotnet ef database update \
  --project "$INFRA" \
  --startup-project "$API"

echo ""
echo "✅ Done."
