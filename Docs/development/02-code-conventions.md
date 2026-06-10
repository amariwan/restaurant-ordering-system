# Code Conventions

## C# Backend Conventions

### Types — No `var`

```csharp
// ❌ Don't
var user = await _db.Users.FindAsync(id);

// ✅ Do
User? user = await _db.Users.FindAsync(id);
IEnumerable<OrderDto> orders = await _orderService.GetAllAsync();
int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
```

Discards use `_` (not discarded variables):
```csharp
if (user?.Role == UserRole.Waiter) { }  // OK, null check protects access
```

### DTOs — Never Expose Domain Models

All controller actions return **DTOs only**. Domain entities never cross the API boundary:

```csharp
// ❌ Don't
return Ok(user);  // Returns User entity with PasswordHash!

// ✅ Do
var dto = new UserDto { Id = user.Id, Name = user.Name, ... };
return Ok(dto);
```

### Async — Always Await

```csharp
// ❌ Don't
var orders = _orderService.GetAllAsync().Result;

// ✅ Do
var orders = await _orderService.GetAllAsync();
```

No `.Result`, no `.Wait()` anywhere.

### Exception Strategy

| Exception | HTTP Status | Use Case |
|-----------|-------------|----------|
| `BadRequestException` | 400 | Invalid input data |
| `NotFoundException` | 404 | Resource not found |
| `ForbiddenException` | 403 | Insufficient permissions |
| `ConflictException` | 409 | Duplicate key / conflicting state |

All handled centrally in [ExceptionMiddleware.cs](../../backend/RestaurantApp.API/Middleware/ExceptionMiddleware.cs).

### Enums — Use Instead of String Literals

```csharp
// ❌ Don't
if (status == "pending") { }

// ✅ Do
if (status == OrderStatus.Pending) { }
```

### EF Core Queries

- Always use `ToListAsync()` for enumerable results
- Use `.Include()` only for required navigation properties (avoid N+1)
- Use `.Select()` projections when only specific fields are needed
- Never expose entities from DbContext — map to DTOs immediately

---

## Frontend Conventions

### Server Components vs Client Components

```tsx
// ❌ Don't use "use client" without need
export default function Page() { return <div>...</div>; }

// ✅ Do — add "use client" only when you need:
// - useState / useEffect
// - event handlers on components (onClick, onChange)
// - Context consumption within the component itself
"use client";
export default function CartPage() { ... }
```

### API Client Pattern

All API calls go through a single typed client in `lib/api.ts`:

```typescript
export async function get<T>(path: string, params?: Record<string, string>) {
  const url = new URL(`${API_URL}${path}`, API_URL);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(res.statusText);
  return res.json() as T;
}

// Usage
const menuItems = await get<MenuItemDto[]>('/menu', { categoryId: '1' });
```

### Component Structure (Feature-Based)

```typescript
// features/restaurant/components/cart-page.tsx
"use client";

import { useCartStore } from '@/lib/cart-store';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  // ...
}
```

### Class Name Merging — Always Use `cn()`

```typescript
// ❌ Don't
className={baseClass + " " + (active ? "active" : "")}

// ✅ Do
import { cn } from '@/lib/utils';
className={cn(baseClass, active && 'active')}
```

---

*Next: [security-audit-report](./security-audit-report.md)*
