# Contributing to Documentation

## Structure Overview

```
docs/
├── README.md                    ← Master index (start here)
├── CONTRIBUTING.md              ← This file
├── architecture/                ← System design & diagrams
│   ├── README.md
│   ├── 01-overview.md           ← System overview, C4 context, deployment topology
│   ├── 02-layer-architecture.md ← Backend 3-layer design, frontend feature-slice
│   ├── 03-domain-model.md       ← Entity class diagrams, DTOs, service interfaces
│   ├── 04-sequence-diagrams.md  ← Auth, order creation, payment, SignalR flows
│   ├── 05-business-processes.md ← Activity diagrams, state machines, role matrix
│   └── 06-order-lifecycle.md    ← Detailed order creation, status, payment flows
├── data-model/                  ← Database documentation
│   ├── README.md
│   ├── 01-entity-relationship.md
│   └── 02-table-schemas.md
├── api-reference/               ← API endpoint docs
│   ├── README.md
│   ├── 01-overview.md           ← Base config, auth header, error format, pagination
│   ├── 02-authentication.md     ← Login, register, refresh, password change
│   ├── 03-menu-api.md           ← Categories + menu items CRUD + image upload (bilingual)
│   ├── 04-ordering-api.md       ← Orders, order items, status transitions
│   ├── 05-payment-api.md        ← Partial payments, balance tracking
│   ├── 06-management-apis.md    ← Users, tables, SignalR hub events
│   └── 07-reservation-api.md    ← Reservations CRUD, status pipeline, pagination
├── frontend/                    ← Frontend architecture
│   ├── README.md
│   ├── 01-app-structure.md
│   ├── 02-component-architecture.md
│   └── 03-state-management.md
├── development/                 ← Developer guides
│   ├── README.md
│   ├── 01-getting-started.md
│   ├── 02-code-conventions.md
│   └── security-audit-report.md ← Security findings and fixes (no number prefix)
└── archive/                     ← Historical documents
    ├── README.md
    └── ...
```

## Conventions

### Naming

- All files use **kebab-case** (e.g., `01-entity-relationship.md`)
- Numbers are **zero-padded two digits** for consistent sort order
- Every directory has a `README.md` acting as its index

### Cross-References

- Use **relative links with numbered anchors**: `[01-overview](./01-overview.md)`
- Links to sibling sections use `../`: `[02-authentication](../api-reference/02-authentication.md)`
- Never use absolute paths or external URLs for internal docs

### Diagrams

- All diagrams use **Mermaid** syntax inside fenced code blocks
- Mermaid renders in GitHub, GitLab, Obsidian, and VS Code (with extension)
- If adding a new diagram, place it near the text that references it — don't move existing ones

### Adding New Docs

1. Determine which section the doc belongs to
2. Create `XX-name.md` inside the appropriate directory
3. Add an entry to that directory's `README.md` in the correct position
4. Update the main `README.md` index if this is a major new section

### Maintenance Checklist

- [ ] All cross-links resolve (no 404s)
- [ ] README indexes are up-to-date with new entries
- [ ] Diagrams render correctly (check in VS Code Mermaid preview)
- [ ] No orphaned files left behind after moves/renames
