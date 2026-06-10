# Business Processes

## 1 — Order Lifecycle

```mermaid
flowchart TD
    A[Pending] -->|Kitchen| B[Preparing]
    A -->|Admin / Waiter / Kitchen| F[Cancelled]

    B -->|Kitchen| C[Ready]
    B -->|Admin / Kitchen| F

    C -->|Waiter / Admin| D[Served]
    C -->|Any| F

    D --> Z([Terminal])
    F --> Z

    style A fill:#60a5fa,color:#fff,stroke:#2563eb
    style B fill:#fbbf24,color:#000,stroke:#d97706
    style C fill:#34d399,color:#000,stroke:#059669
    style D fill:#818cf8,color:#fff,stroke:#4f46e5
    style F fill:#ef4444,color:#fff,stroke:#dc2626
    style Z fill:#94a3b8,color:#000
```

### Transition Matrix

| From | Kitchen | Waiter | Admin |
|------|---------|--------|-------|
| `Pending` | → Preparing | — | → Cancelled |
| `Preparing` | → Ready | — | → Cancelled |
| `Ready` | — | → Served, Cancelled | → Served, Cancelled |
| `Served` | — | — | — |
| `Cancelled` | — | — | — |

---

## 2 — Order Creation (Waiter)

```mermaid
flowchart TD
    A([Start]) --> B[Open menu page]
    B --> C{Existing order?}
    C -- No --> D[Select free table]
    C -- Yes --> F[Append to order]
    D --> F
    F --> G[Add items to cart]
    G --> H{Done?}
    H -- No --> G
    H -- Yes --> I[Open cart]
    I --> J{Table still free?}
    J -- No --> K[Select different table] --> I
    J -- Yes --> L[Confirm order]
    L --> M[POST /api/orders]
    M -- OK --> N[Navigate to order detail]
    M -- Error --> O[Show error toast] --> F
    N --> Z([End])
```

---

## 3 — Menu Management (Admin)

```mermaid
flowchart TD
    A([Open menu admin]) --> B{Tab}
    B -- Categories --> C[Category list]
    B -- Items --> D[Items grid]

    C --> E{Action}
    E -- New --> F[POST /api/menu/categories]
    E -- Edit --> G[PUT /api/menu/categories/:id]
    E -- Delete --> H{Has items?}
    H -- Yes --> I[❌ Blocked]
    H -- No --> J[DELETE /api/menu/categories/:id]
    F & G & J --> C

    D --> K{Action}
    K -- New --> L[POST /api/menu + upload image]
    K -- Edit --> M[PUT /api/menu/:id]
    K -- Delete --> N{In active order?}
    N -- Yes --> O[❌ Blocked]
    N -- No --> P[DELETE /api/menu/:id]
    L & M & P --> D
```

---

## 4 — Role Access Matrix

| Route | Admin | Waiter | Kitchen |
|-------|:-----:|:------:|:-------:|
| `/dashboard` (stats) | ✓ | — | — |
| `/dashboard/users` | ✓ | — | — |
| `/dashboard/restaurant/menu` | ✓ CRUD | ✓ Browse | — |
| `/dashboard/restaurant/cart` | ✓ | ✓ | — |
| `/dashboard/restaurant/tables` | ✓ | — | — |
| `/dashboard/kitchen` | ✓ | — | ✓ |
| Orders list + detail | ✓ | ✓ | — |
| Set status: Preparing / Ready | — | — | ✓ |
| Set status: Served / Cancelled | ✓ | ✓ | ✓ |

---

## 5 — Partial Payment Flow

```mermaid
flowchart TD
    A([Order Served]) --> B[Open order detail]
    B --> C[Sum existing payments]
    C --> D{Remaining > 0?}
    D -- No --> E[✅ Fully paid]
    D -- Yes --> F[Select method: Cash / Card]
    F --> G[Enter amount ≤ remaining]
    G --> H[POST /api/payments]
    H --> C
```

---

## 6 — End-to-End Request Flow

```mermaid
graph LR
    subgraph Browser["Browser — Next.js :3000"]
        UI[UI Components]
        FC[API client / Auth / Cart]
    end

    subgraph Backend["Backend — ASP.NET Core :5000"]
        MW[ExceptionMiddleware]
        CTL[Controllers\nAuth / Orders / Menu]
        HUB[SignalR Hub]
    end

    subgraph Services["Services"]
        SVC[AuthService / OrderService / MenuService]
        DB[(PostgreSQL)]
        S3[(MinIO / S3)]
    end

    UI --> FC
    FC -->|REST /api/*| MW
    MW --> CTL
    CTL --> SVC
    SVC --> DB & S3
    SVC -->|Broadcast| HUB
    HUB -->|WS push| Browser
```

---

*Next: [01-entity-relationship](../data-model/01-entity-relationship.md)*
