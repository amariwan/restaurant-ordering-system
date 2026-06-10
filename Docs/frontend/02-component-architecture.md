# Component Architecture

## UI Library — shadcn/ui Primitives

The project ships with 40+ Radix-based components in `components/ui/`:

| Category | Components |
|----------|-----------|
| **Layout** | Accordion, Separator, Sheet (drawer), Tabs, Tooltip |
| **Inputs** | Checkbox, Radio Group, Select, Slider, Switch, Textarea |
| **Overlays** | AlertDialog, Dialog, DropdownMenu, Popover |
| **Data Display** | Avatar, Badge, Skeleton, Sonner (toast), Spinner |
| **Tables** | DataTable (header, filter, pagination, toolbar, view-options) |
| **Layout Helpers** | Resizable (panes), ScrollArea, AspectRatio, Sidebar |
| **Typography** | Toggle, ToggleGroup, Textarea |

All components are copy-paste — no npm dependency on a component library. This gives full control over styling and behavior.

## Feature Modules

### Auth Features

```
features/auth/
├── components/
│   ├── sign-in-view.tsx          ← Login form + error display
│   ├── sign-up-view.tsx          ← Registration form
│   └── github-auth-button.tsx    ← GitHub OAuth (if enabled)
└── interactive-grid.tsx           ← Landing page background effect
```

### Restaurant Features

```
features/restaurant/
├── api/                          ← API client, types, queries
│   ├── service.ts                ← Fetch helpers for menu/orders
│   ├── types.ts                  ← Shared type definitions
│   └── mutations.ts              ← TanStack Query mutation hooks
├── components/
│   ├── cart-page.tsx             ← Cart + table selection
│   ├── category-form-sheet.tsx   ← Admin: create/edit categories
│   ├── dashboard-overview.tsx    ← Admin KPIs and stats cards
│   ├── dashboard.tsx             ← Admin overview wrapper
│   ├── kitchen-board.tsx         ← Real-time order board (SignalR)
│   ├── menu-admin.tsx            ← Full menu CRUD admin panel
│   ├── menu-item-form-sheet.tsx  ← Admin: create/edit menu items
│   ├── menu-listing.tsx          ← Customer-facing menu grid
│   ├── order-detail.tsx          ← Order details + payments
│   ├── orders-listing.tsx        ← Orders list with live updates
│   └── tables-page.tsx           ← Table management grid
├── lib/
│   ├── auth-store.ts             ← JWT token management (Zustand)
│   ├── cart-store.ts             ← Cart state + localStorage persistence
│   ├── order-status.ts           ← OrderStatus enum helpers
│   └── signalr-store.ts          ← SignalR connection singleton
└── schemas/
    └── restaurant.ts             ← TanStack Form validation schemas
```

### Users Features

```
features/users/
├── api/
│   ├── service.ts                ← User API client
│   ├── queries.ts                ← TanStack Query hooks (getAll)
│   ├── mutations.ts              ← createUser, updateUser, deleteUser
│   └── types.ts                  ← UserDto + UserUpdateRequest
├── components/
│   ├── user-form-sheet.tsx       ← Admin: create/edit user sheet
│   ├── user-listing.tsx          ← User list with search/filter
│   └── users-table/
│       ├── columns.tsx           ← DataTable column definitions
│       ├── cell-action.tsx       ← Delete button + confirm dialog
│       ├── options.tsx           ▼ role selector
│       └── index.tsx             ← Main table component
├── info-content.ts               ← User detail modal content
└── schemas/
    └── user.ts                   ← TanStack Form validation schemas
```

## Component Tree (Key Screens)

### Admin Dashboard

```
/dashboard/page.tsx
└── DashboardWrapper
    ├── AppSidebar (nav links)
    ├── Header (breadcrumb + theme toggle + user avatar)
    └── PageContainer
        └── DashboardOverview
            ├── StatsCard[] (4 KPI cards)
            └── UserBreakdownChart
```

### Kitchen Board

```
/dashboard/kitchen/page.tsx
└── KitchenBoard
    ├── Header
    └── LiveOrderFeed (SignalR connected)
        └── OrderCard[] (status badge, items list, action buttons)
```

---

*Next: [03-state-management](./03-state-management.md)*
