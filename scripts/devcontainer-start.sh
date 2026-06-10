#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Devcontainer: PostgreSQL läuft als `db` Service mit postgres/postgres
export DATABASE_URL="${DATABASE_URL:-Host=db;Database=restaurant;Username=postgres;Password=postgres}"
export JWT_SECRET="${JWT_SECRET:-dev-secret-minimum-32-characters-long!!}"
export JWT_EXPIRY_HOURS="${JWT_EXPIRY_HOURS:-8}"
export CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:3000}"

export PATH="$HOME/.dotnet/tools:$PATH"

echo "=== 1. dotnet-ef installieren (falls fehlt) ==="
if ! command -v dotnet-ef &>/dev/null; then
  dotnet tool install --global dotnet-ef
  export PATH="$HOME/.dotnet/tools:$PATH"
fi

echo "=== 2. Build ==="
dotnet build backend/RestaurantApp.sln --no-incremental

echo "=== 3. Migrations anwenden ==="
dotnet ef database update --project backend/RestaurantApp.Infrastructure --startup-project backend/RestaurantApp.API --no-build

echo "=== 4. Backend starten (Port 5002) ==="
dotnet run --project backend/RestaurantApp.API --no-launch-profile --urls http://0.0.0.0:5002 &
BACKEND_PID=$!

echo "=== 5. Frontend .env.local erstellen ==="
mkdir -p frontend
cat > frontend/.env.local <<ENVEOF
NEXT_PUBLIC_API_URL=http://localhost:5002/api
NEXT_PUBLIC_SIGNALR_URL=http://localhost:5002
NEXT_PUBLIC_CURRENCY_SYMBOL=\$
ENVEOF

echo "=== 6. Frontend starten (Port 3000) ==="
cd frontend
if command -v bun &>/dev/null; then
  bun dev &
elif command -v npm &>/dev/null; then
  npm run dev &
fi
FRONTEND_PID=$!
cd "$REPO_ROOT"

echo ""
echo "========================================"
echo "  Backend:  http://localhost:5002"
echo "  Swagger:  http://localhost:5002/swagger"
echo "  Frontend: http://localhost:3000"
echo "========================================"
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
