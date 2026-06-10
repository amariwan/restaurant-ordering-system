# System Overview

## What the System Does

The Restaurant Ordering System is a multi-role staff tool that covers the full lifecycle of a restaurant table service: from menu browsing and order creation, through kitchen preparation, to payment and table release.

Three roles operate the system simultaneously:

| Role | Primary Workflow |
|------|-----------------|
| **Waiter** | Browse menu, build cart, place orders, process payments, manage order status |
| **Kitchen** | See incoming orders in real time, mark orders preparing → ready |
| **Admin** | Manage menu items and categories, manage tables, manage staff users, view dashboard stats, handle reservations |

A public-facing layer allows guests to browse the menu and submit reservation requests without authentication.

---

## C4 Context Diagram

```mermaid
graph TB
    waiter["👤 Waiter\nPlaces orders and processes payments"]
    kitchen["👤 Kitchen Staff\nTracks and updates order preparation"]
    admin["👤 Admin\nManages menu, tables, users and reservations"]
    guest["👤 Guest\nBrowses menu and makes reservations"]

    subgraph ros["Restaurant Ordering System"]
        fe["Next.js 16 Frontend\n:3000"]
        be["ASP.NET Core 10 API\n:5002"]
        db[("PostgreSQL 18\n:5432")]
    end

    waiter --> fe
    kitchen --> fe
    admin --> fe
    guest --> fe
    fe -->|REST + SignalR WS| be
    be --> db
```

---

## Deployment Topology

```mermaid
graph LR
    subgraph Browser["Browser (Client)"]
        UI["Next.js SPA\nlocalhost:3000"]
    end

    subgraph Backend["ASP.NET Core 10\nlocalhost:5002"]
        API["REST API\n/api/*"]
        HUB["SignalR Hub\n/hubs/orders"]
        MW["ExceptionMiddleware"]
    end

    subgraph Data["Data Layer"]
        PG[("PostgreSQL 18\nlocalhost:5432")]
        FS["File Storage\n/Images (local)\nor S3/MinIO"]
    end

    UI -->|HTTP/REST| API
    UI -->|WebSocket| HUB
    API --> MW
    MW --> API
    API --> PG
    API --> FS
    HUB --> PG
```

### Port Map

| Service | Port | Protocol |
|---------|------|---------|
| Frontend (Next.js) | 3000 | HTTP |
| Backend API | 5002 | HTTP |
| SignalR Hub | 5002 | WebSocket (upgrades from HTTP) |
| Swagger UI | 5002 | HTTP (`/swagger`) |
| PostgreSQL | 5432 | TCP |

---

## Service Architecture

```mermaid
graph LR
    subgraph Frontend["Next.js 16 (App Router)"]
        Pages["Pages (App Router)"]
        Features["Feature modules\nauth / restaurant / users"]
        State["State\nZustand: auth + cart\nTanStack Query: server data"]
        SRClient["SignalR client\n(singleton connection)"]
    end

    subgraph Backend["ASP.NET Core 10"]
        Controllers["Controllers\nAuth / Menu / Orders /\nPayments / Tables /\nUsers / Reservations"]
        Hub["OrderHub (SignalR)"]
        Services["Services (Infrastructure)"]
        EF["EF Core 10 (Code First)"]
    end

    subgraph DB["Persistence"]
        Postgres[("PostgreSQL 18\n9 tables")]
        Files["File Storage\n(local or S3)"]
    end

    Pages --> Features
    Features --> State
    State -->|REST /api/*| Controllers
    SRClient -->|WS| Hub
    Controllers --> Services
    Hub --> Services
    Services --> EF
    EF --> Postgres
    Services --> Files
```

---

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend framework | ASP.NET Core 10 | Mature, strongly typed, built-in DI, EF Core integration |
| ORM | EF Core 10 Code First | Migrations-as-code, LINQ query safety, no raw SQL drift |
| Auth | JWT + BCrypt + refresh tokens | Stateless API with secure token rotation |
| Real-time | SignalR | WebSocket with HTTP long-poll fallback, group broadcast support |
| Frontend | Next.js 16 (App Router) | Server components, route-based code splitting, Vercel-compatible |
| UI | shadcn/ui + Radix | Accessible primitives, no runtime CSS-in-JS overhead |
| State | Zustand (auth + cart) + TanStack Query (server) | Clear separation of local state vs. cached server data |
| Database | PostgreSQL 18 | ACID transactions, reliable decimal precision for pricing |

---

## Key Invariants

- **Price snapshot**: `order_items.price_at_order` is captured at order creation time and never recomputed from `menu_items.price`. Invoices always reflect what was quoted at order time.
- **Table state lifecycle**: creating an order sets the table `Occupied`; serving the final order on a table releases it back to `Free`.
- **Role hierarchy**: Admin can perform any role's actions. Kitchen and Waiter are strictly scoped.
- **Bilingual content**: all menu-facing text (category names, item names, descriptions) is stored in both English (`_en`) and Kurdish (`_ku`) columns. The frontend selects the active language at runtime.

---

*Next: [02-layer-architecture](./02-layer-architecture.md)*
