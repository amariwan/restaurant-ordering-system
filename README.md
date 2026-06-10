# Restaurant Ordering System

Full-stack restaurant ordering platform built with **ASP.NET Core 10**, **Next.js 16**, **PostgreSQL**, and **SignalR** for real-time updates.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | ASP.NET Core 10 Web API, EF Core 10, SignalR |
| Frontend | Next.js 16 (App Router), shadcn/ui, TanStack React Query, Zustand |
| Database | PostgreSQL 18 |
| Auth | JWT + BCrypt (self-registration, roles: Admin / Waiter / Kitchen) |
| Infrastructure | Docker Compose, VS Code Devcontainer |

---

## Quick Start — Devcontainer (recommended)

The fastest way to get everything running with zero manual setup:

```
# VS Code
F1 → "Dev Containers: Reopen in Container"

# GitHub Codespaces
Click "Code" → "Create codespace on master"
```

After ~60 s the container is ready and all services start automatically:

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:5002/api` |
| Swagger UI | `http://localhost:5002/swagger` |
| PostgreSQL | `localhost:5432` (user: postgres / pw: postgres) |

**What the devcontainer does for you:**

- Installs `dotnet-ef`, restores .NET packages, builds the solution
- Runs `bun install` for the frontend and writes `frontend/.env.local`
- On every start: applies pending EF Core migrations, then launches backend and frontend in the background
- Logs are in `/tmp/devcontainer-logs/` (`backend.log`, `frontend.log`, `migrations.log`)

---

## Quick Start — Manual

```bash
# 1 — Start PostgreSQL
docker compose -f .devcontainer/docker-compose.yml up db -d

# 2 — Set env vars and apply migrations
export DATABASE_URL="Host=localhost;Database=restaurant;Username=postgres;Password=postgres"
export JWT_SECRET="dev-secret-minimum-32-characters-long!!"
export SEED_DEFAULT_PASSWORD="dev123!"

dotnet ef database update \
  --project  backend/RestaurantApp.Infrastructure \
  --startup-project backend/RestaurantApp.API

# 3 — Start backend
dotnet run --project backend/RestaurantApp.API \
  --no-launch-profile --urls http://0.0.0.0:5002

# 4 — Start frontend (new terminal)
cd frontend && bun dev
```

---

## Features

- Menu management with categories, availability, and image upload
- Order lifecycle: `pending → preparing → ready → served → cancelled`
- Table management: `free / occupied / reserved`
- Partial payments (cash / card) with balance tracking
- **Reservations** — public booking form + staff management
- **Real-time** — SignalR live order updates (kitchen + waiter groups)
- **Auth** — Self-registration with JWT, password change
- **Roles** — Admin dashboard, Waiter order flow, Kitchen status updates
- **Pagination** — `PaginatedResponse<T>` across all list endpoints

---

## API Endpoints

| Group | Endpoints | Auth |
|-------|-----------|------|
| Auth | `POST /api/auth/login`, `/register`, `PUT /api/auth/me/password` | Public / Auth |
| Menu | `GET /api/menu`, `POST/PUT/DELETE /api/menu/{id}`, categories CRUD, image upload | Public / Admin |
| Orders | `GET/POST /api/orders`, `PUT /api/orders/{id}/status`, item add/remove | Waiter+ / Kitchen |
| Payments | `POST /api/payments?orderId=X`, `GET /api/payments/{orderId}` | Waiter+ |
| Tables | `GET /api/tables`, `POST/PUT/DELETE /api/tables/{id}` | Public / Admin |
| Users | `GET /api/users`, `PUT/DELETE /api/users/{id}` | Admin |
| Reservations | Full CRUD `/api/reservations` | Admin+ |

---

## Project Structure

```
restaurant-ordering-system/
├── .devcontainer/
│   ├── devcontainer.json   # Devcontainer config (env vars, extensions, ports)
│   ├── docker-compose.yml  # app + db services for devcontainer
│   ├── setup.sh            # postCreateCommand — install tools, build, install deps
│   └── start.sh            # postStartCommand  — migrations + backend + frontend
├── backend/
│   ├── RestaurantApp.API/            # Controllers, Hubs, Middleware
│   ├── RestaurantApp.Core/           # Entities, Interfaces, DTOs
│   ├── RestaurantApp.Infrastructure/ # EF Core, Services, Migrations
│   └── RestaurantApp.Tests/          # xUnit tests
├── frontend/
│   ├── apps/web/           # Next.js App Router
│   ├── packages/ui/        # shadcn/ui components
│   └── turbo.json
├── docs/                   # Architecture, API reference, data model
├── scripts/                # Helper scripts (apply-migrations, full-start)
└── docker-compose.yml      # Production-like full-stack compose
```

---

## Documentation

Full docs in [`docs/`](./docs/):

| Section | Contents |
|---------|----------|
| [Getting Started](./docs/development/01-getting-started.md) | Devcontainer setup, manual setup, migrations |
| [Code Conventions](./docs/development/02-code-conventions.md) | Backend + frontend patterns |
| [Architecture](./docs/architecture/) | C4 diagrams, layer architecture, sequences |
| [Data Model](./docs/data-model/) | ERD, table schemas, constraints |
| [API Reference](./docs/api-reference/) | All endpoints with request/response examples |
| [Frontend](./docs/frontend/) | App structure, component architecture, state management |

---

## Prerequisites (manual setup only)

| Tool | Min. Version |
|------|-------------|
| Docker + Compose | 24+ |
| .NET SDK | 10.0 |
| Bun or Node.js | latest / 18+ |
