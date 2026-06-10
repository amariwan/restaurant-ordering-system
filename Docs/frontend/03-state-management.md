# State Management

## Auth State — `lib/auth/client.ts`

JWT token is managed via a Zustand-like store:

```typescript
// lib/auth/client.ts
interface AuthState {
  token: string | null;
  user: UserDto | null;
  isLoading: boolean;
  setToken: (token: string) => void;
  setUser: (user: UserDto) => void;
  logout: () => void;
}

// Usage in API client
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${authState.token}`,
    },
  });
  if (res.status === 401) authState.logout();
  return res.json();
}
```

### Token Persistence

| Storage | Content | Lifespan |
|---------|---------|----------|
| Cookie (`restaurant_refresh`) | Refresh token (raw value) | 30 days, HTTP-only |
| In-memory store | JWT token + UserDto | Session (cleared on logout/refresh) |
| localStorage | None (JWT not stored here for security) | — |

---

## Cart State — `lib/cart.ts`

The cart is stored in **localStorage** — survives page reloads:

```typescript
// lib/cart.ts
interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  note?: string | null;
}

interface CartState {
  items: CartItem[];
  tableId: number | null;
  addItem(item: MenuItem): void;
  removeItem(menuItemId: number): void;
  updateQuantity(menuItemId: number, quantity: number): void;
  setTableId(id: number | null): void;
  getTotal(): decimal;
  clear(): void;
}
```

### Cart Validation Rules

| Rule | Behavior |
|------|----------|
| Table must be selected before order creation | Button disabled otherwise |
| Only free tables in dropdown | Filtered via `GET /api/tables` |
| Cart items preserved across pages | localStorage persistence |

---

## SignalR State — `lib/signalr.ts`

SignalR connection is a **singleton** — one hub connection per app instance:

```typescript
// lib/signalr-store.ts (Zustand)
interface SignalRState {
  isConnected: boolean;
  orders: OrderDto[];
  connect(): void;
  disconnect(): void;
  onNewOrder(callback: (order: OrderDto) => void): void;
  onStatusChanged(callback: (data: { orderId: number; status: string }) => void): void;
}
```

### Reconnection Strategy

- `withAutomaticReconnect()` — TanStack-style retry policy
- On reconnect: rejoin kitchen/waiter groups automatically
- Orders list refetched from API to ensure consistency

---

## Server State — TanStack Query

All API calls use TanStack Query hooks (`features/*/api/queries.ts`):

```typescript
// features/restaurant/api/queries.ts
export const useMenuItems = (categoryId?: number) => {
  return useQuery({
    queryKey: ['menu-items', categoryId],
    queryFn: () => api.get('/menu', { params: { categoryId } }),
  });
};

export const useOrders = (status?: OrderStatus) => {
  return useQuery({
    queryKey: ['orders', status],
    queryFn: () => api.get('/orders', { params: { status } }),
    refetchInterval: 30_000, // Poll every 30s as fallback
  });
};
```

### Mutation Patterns (features/*/api/mutations.ts)

```typescript
export const useCreateOrder = () => {
  return useMutation({
    mutationFn: (data: OrderRequest) => api.post('/orders', data),
    onSuccess: () => queryClient.invalidateQueries(['orders']),
  });
};
```

---

*Next: [01-getting-started](../development/01-getting-started.md)*
