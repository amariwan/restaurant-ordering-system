# Getting Started

## Recommended: VS Code Devcontainer (zero-config)

Opening the project in a devcontainer is the fastest way to get a fully working
environment. Everything — database, migrations, backend, and frontend — starts
automatically with no manual steps.

### What happens automatically

| Phase | Script | Trigger |
|-------|--------|---------|
| **Create** (once) | `.devcontainer/setup.sh` | `postCreateCommand` |
| **Start** (every restart) | `.devcontainer/start.sh` | `postStartCommand` |

#### setup.sh — runs once after container creation

1. Installs / updates `dotnet-ef` global tool
2. `dotnet restore` + `dotnet build` (Debug, no-incremental)
3. `bun install` (falls back to `npm install`) for the frontend
4. Writes `frontend/.env.local` with the correct API URLs

#### start.sh — runs on every container start

1. Applies any pending EF Core migrations (`dotnet ef database update --no-build`)
2. Starts the backend on **:5002** in the background (`nohup dotnet run`)
3. Starts the frontend on **:3000** in the background (`nohup bun dev`)
4. Prints the access URLs

### Quick start

```
# VS Code
F1 → "Dev Containers: Reopen in Container"

# GitHub Codespaces
Click "Code" → "Create codespace on master"
```

After ~60 s for the first build, VS Code forwards the ports automatically:

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:5002/api` |
| Swagger UI | `http://localhost:5002/swagger` |
| PostgreSQL | `localhost:5432` (postgres / postgres) |

### Following service logs

```bash
tail -f /tmp/devcontainer-logs/backend.log
tail -f /tmp/devcontainer-logs/frontend.log
tail -f /tmp/devcontainer-logs/migrations.log
```

### Environment variables (set in devcontainer.json)

All env vars are injected via `containerEnv` — no `.env` file needed inside the container.

| Variable | Dev value | Description |
|----------|-----------|-------------|
| `DATABASE_URL` | `Host=db;Database=restaurant;Username=postgres;Password=postgres` | Npgsql connection string |
| `JWT_SECRET` | `dev-secret-minimum-32-characters-long!!` | HMAC SHA256 key (≥ 32 chars) |
| `JWT_EXPIRY_HOURS` | `8` | Access token lifetime |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `SEED_DEFAULT_PASSWORD` | `dev123!` | Password for seeded demo users |

---

## Manual Setup (without devcontainer)

### Prerequisites

| Tool | Min. Version | Purpose |
|------|-------------|---------|
| Docker + Compose | 24+ | PostgreSQL |
| .NET SDK | 10.0 | Backend |
| Bun or Node.js | latest / 18+ | Frontend |

### Step-by-step

```bash
# 1 — Start PostgreSQL
docker compose -f .devcontainer/docker-compose.yml up db -d

# 2 — Install dotnet-ef
dotnet tool install --global dotnet-ef
export PATH="$PATH:$HOME/.dotnet/tools"

# 3 — Build backend
dotnet build backend/RestaurantApp.sln --no-incremental

# 4 — Apply migrations
export DATABASE_URL="Host=localhost;Database=restaurant;Username=postgres;Password=postgres"
export JWT_SECRET="dev-secret-minimum-32-characters-long!!"
export SEED_DEFAULT_PASSWORD="dev123!"
dotnet ef database update \
  --project  backend/RestaurantApp.Infrastructure \
  --startup-project backend/RestaurantApp.API \
  --no-build

# 5 — Start backend
dotnet run \
  --project backend/RestaurantApp.API \
  --no-build \
  --no-launch-profile \
  --urls http://0.0.0.0:5002

# 6 — Frontend (new terminal)
cp frontend/.env.local.example frontend/.env.local   # or create manually
cd frontend && bun dev
```

### Backend environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Npgsql connection string |
| `JWT_SECRET` | ✅ | Min. 32 characters |
| `JWT_EXPIRY_HOURS` | — | Default: `8` |
| `CORS_ORIGINS` | — | Default: `http://localhost:3000` |
| `SEED_DEFAULT_PASSWORD` | ✅ (first run) | Password for demo users |

### Frontend environment variables (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5002/api
NEXT_PUBLIC_SIGNALR_URL=http://localhost:5002
NEXT_PUBLIC_CURRENCY_SYMBOL=$
```

---

## Migrations

> **Rule:** Never edit migration files manually. Always use `dotnet ef migrations add`.
> A migration without its `.Designer.cs` file is invisible to EF Core.

### Add a new migration

```bash
dotnet ef migrations add <Name> \
  --project  backend/RestaurantApp.Infrastructure \
  --startup-project backend/RestaurantApp.API
```

### Apply pending migrations

```bash
dotnet ef database update \
  --project  backend/RestaurantApp.Infrastructure \
  --startup-project backend/RestaurantApp.API
```

### List migration status

```bash
dotnet ef migrations list \
  --project  backend/RestaurantApp.Infrastructure \
  --startup-project backend/RestaurantApp.API
```

---

## Docker — Full Stack (production-like)

```bash
# Start everything
docker compose up -d

# Tail logs
docker compose logs -f backend
docker compose logs -f web

# Tear down (keeps volumes)
docker compose down

# Tear down + delete database volume
docker compose down -v
```

---

*Next: [02-code-conventions](./02-code-conventions.md)*
