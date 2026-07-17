# Restaurant Ordering System

> A production-grade, full-stack restaurant ordering platform built with modern technologies.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![.NET 10](https://img.shields.io/badge/dotnet-10.0-blue)](https://dotnet.microsoft.com)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue.svg)](https://www.postgresql.org)
[![SignalR](https://img.shields.io/badge/SignalR-10.0-purple)](https://learn.microsoft.com/signalr)
[![Docker](https://img.shields.io/badge/Docker-Compose-green.svg)](docker-compose.yml)
![CI](https://github.com/amariwan/restaurant-ordering-system/actions/workflows/ci.yml/badge.svg)
[![Issues](https://img.shields.io/github/issues/amariwan/restaurant-ordering-system)](https://github.com/amariwan/restaurant-ordering-system/issues)
[![Stars](https://img.shields.io/github/stars/amariwan/restaurant-ordering-system?style=social)](https://github.com/amariwan/restaurant-ordering-system/stargazers)

---

## 📋 Overview

A complete **restaurant ordering & management system** with real-time kitchen updates, role-based access, and payment processing. Perfect for learning modern full-stack development or as a starting point for your own restaurant app.

**What makes it stand out:**

- 🔄 **Real-time order tracking** via SignalR — kitchen screens update instantly
- 🍽️ **Full menu management** with categories, availability, and image uploads
- 📱 **Responsive frontend** built with Next.js 16 and shadcn/ui
- 🔐 **Three role-based dashboards** — Admin, Waiter, and Kitchen
- 🗄️ **Production-ready** — Docker Compose, CI/CD, EF Core migrations, xUnit tests
- 📝 **Comprehensive docs** — architecture diagrams, API reference, domain model

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | ASP.NET Core 10 Web API · EF Core 10 · SignalR · BCrypt |
| **Frontend** | Next.js 16 (App Router) · React 19 · shadcn/ui · Zustand · React Query |
| **Database** | PostgreSQL 18 · EF Core InMemory (tests) |
| **Auth** | JWT with refresh tokens · Self-registration · Role-based access |
| **DevOps** | Docker Compose · VS Code DevContainer · GitHub Actions CI |
| **Testing** | xUnit · FluentAssertions · Moq · Playwright E2E · Coverlet coverage |

---

## 🖼️ Screenshots

*Add screenshots from the running app to showcase the UI/UX.*

| Admin Dashboard | Waiter Order View | Kitchen Status |
|:---:|:---:|:---:|
| *Menu & table management* | *Order creation flow* | *Real-time updates* |

---

## ✨ Features

### For Kitchen Staff
- **Real-time order board** with SignalR live updates
- Order status progression: `pending → preparing → ready → served`
- One-click status updates from the kitchen dashboard
- Visual indicators for order age and urgency

### For Waiters
- **Intuitive order interface** with drag-and-drop menu items
- Table management (free / occupied / reserved)
- Partial payments (cash / card) with balance tracking
- Guest ordering with table assignment

### For Admins
- **Full menu CRUD** with categories, availability toggles, and image upload
- Table management and reservation system
- User management (create, edit, revoke roles)
- Order history and analytics
- System configuration

### Technical Highlights
- **Paginated API responses** across all list endpoints
- **Resilient architecture** — middleware error handling, JWT refresh tokens
- **Comprehensive API** with Swagger / OpenAPI docs
- **E2E tests** with Playwright for critical user flows

---

## 🚀 Quick Start

### Option 1: DevContainer (Recommended — one-click setup)

The fastest way to get everything running with zero manual setup:

```bash
# VS Code
F1 → "Dev Containers: Reopen in Container"

# Or use GitHub Codespaces
Click "Code" → "Create codespace on main"
```

After ~60 seconds the container is ready and all services start automatically:

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:5002/api` |
| Swagger UI | `http://localhost:5002/swagger` |
| PostgreSQL | `localhost:5432` (postgres/postgres) |

### Option 2: Manual Setup

```bash
# 1. Start PostgreSQL
docker compose -f .devcontainer/docker-compose.yml up db -d

# 2. Set env vars and apply migrations
export DATABASE_URL="Host=localhost;Database=restaurant;Username=postgres;Password=postgres"
export JWT_SECRET="dev-secret-minimum-32-characters-long!!"
export SEED_DEFAULT_PASSWORD="dev123!"

dotnet ef database update \
   --project backend/RestaurantApp.Infrastructure \
   --startup-project backend/RestaurantApp.API

# 3. Start backend
dotnet run --project backend/RestaurantApp.API \
   --no-launch-profile --urls http://0.0.0.0:5002

# 4. Start frontend (new terminal)
cd frontend && bun dev
```

### Option 3: Full Stack Docker

```bash
docker compose up -d
# Frontend: http://localhost:3000
# Backend:  http://localhost:5002
```

---

## 📐 Project Structure

```
restaurant-ordering-system/
├── .devcontainer/        # VS Code DevContainer config + setup scripts
├── backend/
│   ├── RestaurantApp.API/      # Controllers, SignalR Hubs, Middleware
│   ├── RestaurantApp.Core/     # Entities, Interfaces, DTOs
│   ├── RestaurantApp.Infrastructure/  # EF Core, Services, Migrations
│   └── RestaurantApp.Tests/    # xUnit tests (Unit, Integration, E2E)
├── frontend/
│   ├── apps/web/               # Next.js App Router (shadcn/ui)
│   ├── packages/ui/            # Shared UI components
│   └── turbo.json              # Monorepo tooling
├── docs/                       # Architecture, API, Data Model docs
├── scripts/                    # Helper scripts
└── docker-compose.yml          # Production-like full-stack compose
```

---

## 📖 Documentation

Full documentation in [`docs/`](./docs/):

| Section | Contents |
|---------|----------|
| [Getting Started](./docs/development/01-getting-started.md) | DevContainer setup, manual setup, migrations |
| [Code Conventions](./docs/development/02-code-conventions.md) | Backend + frontend patterns |
| [Architecture](./docs/architecture/) | C4 diagrams, layer architecture, sequences |
| [Data Model](./docs/data-model/) | ERD, table schemas, constraints |
| [API Reference](./docs/api-reference/) | All endpoints with request/response examples |
| [Frontend](./docs/frontend/) | App structure, component architecture, state management |

---

## 🔑 Key API Endpoints

| Group | Endpoints | Auth |
|-------|-----------|------|
| **Auth** | `POST /api/auth/login`, `/register`, `PUT /api/auth/me/password` | Public / Auth |
| **Menu** | `GET/POST/PUT/DELETE /api/menu/{id}`, categories, image upload | Public / Admin |
| **Orders** | `GET/POST /api/orders`, status updates, item add/remove | Waiter+ / Kitchen |
| **Payments** | `POST /api/payments?orderId=X`, `GET /api/payments/{orderId}` | Waiter+ |
| **Tables** | `GET /api/tables`, `POST/PUT/DELETE /api/tables/{id}` | Public / Admin |
| **Users** | `GET /api/users`, `PUT/DELETE /api/users/{id}` | Admin |
| **Reservations** | Full CRUD `/api/reservations` | Admin+ |

---

## 📁 Order Lifecycle

```
pending → preparing → ready → served
                ↓
           cancelled
```

**Partial payments** supported — track remaining balance across multiple transactions (cash + card).

---

## 🧪 Testing

```bash
# Backend unit & integration tests
dotnet test backend/RestaurantApp.Tests

# Frontend unit tests
cd frontend && bun run test

# E2E tests (requires backend running)
cd frontend && bun run test:e2e

# View coverage reports
# Backend: open backend/RestaurantApp.Tests/TestResults/coverage.cobertura.xml
# Frontend: open frontend/coverage/index.html
```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](.github/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

Built with ❤️ for the open-source community.

---

<div align="center">

**⭐ Star this repo if you find it useful — it helps others discover it!**

[Report a Bug](https://github.com/amariwan/restaurant-ordering-system/issues) ·
[Request a Feature](https://github.com/amariwan/restaurant-ordering-system/issues) ·
[Documentation](./docs/)

</div>
