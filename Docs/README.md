# Restaurant Ordering System — Documentation

Full-stack restaurant ordering system with **reservation management** built with **ASP.NET Core 10** (backend), **Next.js 16** (frontend), **PostgreSQL 18**, and **SignalR**.

---

## Document Index

### 🏗️ Architecture & Design

| # | Document | Description |
|---|----------|-------------|
| [01](./architecture/01-overview.md) | System Overview | C4 context diagram, deployment topology, service architecture |
| [02](./architecture/02-layer-architecture.md) | Layer Architecture | Backend layers + frontend component tree |
| [03](./architecture/03-domain-model.md) | Domain & Service Model | Entities, DTOs, service interfaces (class diagrams) |
| [04](./architecture/04-sequence-diagrams.md) | Sequence Diagrams | Auth flow, order creation, status updates, payments |
| [05](./architecture/05-business-processes.md) | Business Processes | Activity diagrams, state machines, role access matrices |
| [06](./architecture/06-order-lifecycle.md) | Order Lifecycle | Detailed order creation, status update, and payment flows |

### 💾 Data Model

| # | Document | Description |
|---|----------|-------------|
| [01](./data-model/01-entity-relationship.md) | Entity Relationship Diagram | Full ERD with all 9 tables and relationships |
| [02](./data-model/02-table-schemas.md) | Table Schemas | Column definitions, constraints, precision, delete behavior |

### 🔌 API Reference

| # | Document | Description |
|---|----------|-------------|
| [01](./api-reference/01-overview.md) | API Overview | Base config, auth header, error format, pagination |
| [02](./api-reference/02-authentication.md) | Authentication Endpoints | Login, register, refresh — with token flow diagram |
| [03](./api-reference/03-menu-api.md) | Menu API | Categories + menu items CRUD + image upload (bilingual) |
| [04](./api-reference/04-ordering-api.md) | Ordering API | Orders, order items, status transitions |
| [05](./api-reference/05-payment-api.md) | Payment API | Partial payments, balance tracking |
| [06](./api-reference/06-management-apis.md) | Management APIs | Users, tables, SignalR hub events |
| [07](./api-reference/07-reservation-api.md) | Reservations API | Reservations CRUD, status pipeline, pagination |

### 🎨 Frontend Architecture

| # | Document | Description |
|---|----------|-------------|
| [01](./frontend/01-app-structure.md) | App Structure & Routing | Next.js app router layout, page tree, protected routes |
| [02](./frontend/02-component-architecture.md) | Component Architecture | Component tree, UI library, feature modules |
| [03](./frontend/03-state-management.md) | State Management | Auth store, cart (localStorage), SignalR client |

### 🛠️ Development Guide

| # | Document | Description |
|---|----------|-------------|
| [01](./development/01-getting-started.md) | Getting Started | Docker setup, env vars, migrations, dev server commands |
| [02](./development/02-code-conventions.md) | Code Conventions | C# patterns, DTO rules, async conventions, EF Core usage |
| [security-audit](./development/security-audit-report.md) | Security Audit Report | All findings with fixes applied |

### 📦 Archive

Historical documents and prior drafts. Not actively maintained.

[→ View archive contents](./archive/README.md)

---

## Quick Reference

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 · App Router · shadcn/ui (New York) · Tailwind CSS v4 · TanStack Query 5 · Zustand 5 |
| **Backend API** | ASP.NET Core 10 Web API |
| **Real-time** | SignalR (`/hubs/orders`) |
| **Database** | PostgreSQL 18 (Npgsql EF Core provider) |
| **File Storage** | Local filesystem or S3-compatible (MinIO via AWS SDK) |
| **Auth** | JWT (8h) + Refresh Token Rotation (30d, BCrypt-hashed in DB) |
| **i18n** | English + Kurdish (KU) — bilingual entities and UI |
| **Infrastructure** | Docker Compose (4 services: postgres, backend, web, minio) |

### Roles & Permissions

| Role | Access Scope |
|------|-------------|
| `admin` | All pages + `/admin/*`. Full CRUD on users, tables, menu, reservations. |
| `waiter` | Menu, Cart, Orders, Order Detail, Reservations, Profile. Create/modify orders, payments, reservations. |
| `kitchen` | Orders only (real-time board). Set status: pending → preparing → ready. |
| **public** | Landing page, login, register, `/reserve`, `/about` |

### API Convention

```
Base URL   : /api
Auth Header: Authorization: Bearer <jwt_token>
Dates      : UTC ISO 8601
Pagination : ?page=1&pageSize=20
Errors     : { "message": "...", "errors": [...] }
Bilingual  : All entity names support EN/KU (NameEn, NameKu)
```

### Core Domain — Order Lifecycle

```
Pending → Preparing → Ready → Served
    ↕           ↕         ↕
Cancelled ←─────┴─────────┘
```

### Core Domain — Reservation Lifecycle

```
Pending ───────→ Confirmed ───────→ Completed
    │                  │
    ↓                  ↓
 Cancelled            ————
```

---

*Last updated: 2026-06-09 · Generated from source code + architecture analysis*
