# Frontend App Structure

## Page Routing (Next.js App Router)

| Route | Feature | Auth Required | Roles |
|-------|---------|:-----------:|-------|
| `/` | Landing page | No | All |
| `/auth/sign-in` | Login form | No | All |
| `/auth/sign-up` | Registration | No | All |
| `/dashboard` | Admin overview (stats, KPIs) | Yes | Admin |
| `/dashboard/kitchen` | Kitchen display board | Yes | Kitchen |
| `/dashboard/restaurant` | Waiter menu access | Yes | Waiter, Admin |
| `/dashboard/restaurant/cart` | Cart (add items, select table) | Yes | Waiter, Admin |
| `/dashboard/restaurant/menu` | Menu admin (CRUD + categories) | Yes | Admin |
| `/dashboard/restaurant/tables` | Table management | Yes | Admin |
| `/dashboard/users` | User management | Yes | Admin |
| `/privacy-policy` | Legal page | No | All |
| `/terms-of-service` | Legal page | No | All |

## Layout Hierarchy

```
layout.tsx (Root: theme provider, font, global styles)
├── not-found.tsx (404 fallback)
├── global-error.tsx (500 fallback)
│
├── auth/layout.tsx (Auth section wrapper)
│   ├── page.tsx (auth redirect)
│   └── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
│
└── dashboard/layout.tsx (Protected: sidebar, header, nav)
    ├── page.tsx (Admin overview / stats)
    ├── kitchen/page.tsx (Kitchen board)
    ├── users/page.tsx (User list + form)
    └── restaurant/
        ├── page.tsx (Menu browsing by category)
        ├── cart/page.tsx (Cart with table selection)
        ├── menu/page.tsx (Admin menu CRUD)
        └── tables/page.tsx (Table management)
```

## File Organization

```
frontend/src/
├── app/                    ← Next.js App Router pages
│   ├── layout.tsx          ← Root layout (theme, fonts, metadata)
│   ├── auth/               ← Auth routes (sign-in, sign-up)
│   └── dashboard/          ← Protected routes (sidebar wrapper)
│
├── features/               ← Feature modules
│   ├── auth/               ← Sign-in view, sign-up view, GitHub button
│   ├── restaurant/         ← Cart, menu-admin, kitchen-board, orders-listing
│   └── users/              ← User list, user form sheet, column helpers
│
├── components/             ← Reusable UI
│   ├── ui/                 ← shadcn/ui primitives (40+ components)
│   ├── layout/             ← Sidebar, header, nav, query-provider
│   ├── forms/fields/       ← Input wrappers (checkbox, text, select...)
│   └── themes/             ← Theme provider, mode toggle, theme selector
│
├── lib/                    ← Shared utilities
│   ├── auth/               ← Client guard, index helpers
│   ├── format.ts           ← Date & currency formatting
│   └── utils.ts            ← cn() class merger, general helpers
│
├── hooks/                  ← Custom React hooks
│   └── use-*.tsx           ← breadcrumbs, debounce, mobile detection...
│
└── types/                  ← TypeScript interfaces
```

## Key Libraries

| Library | Version | Usage |
|---------|---------|-------|
| Radix UI primitives | 1.x | Dialogs, select, popover, avatar, etc. |
| @dnd-kit/* | 6.x | Drag & drop for menu reordering |
| TanStack Query (React Query) | 5.x | Server state caching + mutations |
| @tanstack/form-core | — | Form validation and submission |
| Sonner | — | Toast notifications |
| KBar | — | Command palette (cmd+k navigation) |

---

*Next: [02-component-architecture](./02-component-architecture.md)*
