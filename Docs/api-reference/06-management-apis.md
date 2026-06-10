# Management APIs (Tables, Users) + SignalR

## Tables

### GET `/api/tables`

**Auth:** None (public — allows menu browsing without auth)  
**Response:** `200 OK → TableDto[]`

```json
[ { "id": 1, "number": 1, "status": "free" }, { "id": 2, "number": 2, "status": "occupied" } ]
```

### POST `/api/tables`

**Auth:** Required — **Admin**  
**Request Body:** `TableRequest { number: int, status: TableStatus }`

```json
{ "number": 8, "status": "free" }
```

### PUT `/api/tables/{id}`

**Auth:** Required — **Admin**  
**Request Body:** `TableRequest { number, status }`

**Guard:** Prevents duplicate table numbers and deleting occupied tables.

### DELETE `/api/tables/{id}`

**Auth:** Required — **Admin**  
**Response:** `204 No Content`

---

## Users (Admin Only)

### GET `/api/users`

**Auth:** Required — **Admin**  
**Response:** `200 OK → UserDto[]`

```json
[ { "id": 1, "name": "John", "email": "john@rest.com", "role": "waiter", "createdAt": "..." } ]
```

### PUT `/api/users/{id}`

**Auth:** Required — **Admin**  
**Request Body:** `UserUpdateRequest { name, email, role }`

```json
{ "name": "John Doe", "email": "john@rest.com", "role": "admin" }
```

### DELETE `/api/users/{id}`

**Auth:** Required — **Admin**  
**Response:** `204 No Content`

---

## SignalR Hub — Real-Time Events

**Hub URL:** `ws://localhost:5000/hubs/orders`  
(Authenticated via Bearer token in query string or WebSocket transport)

### Client Groups

| Group | Roles Auto-Joined |
|-------|-------------------|
| `"kitchen"` | Kitchen, Admin |
| `"waiter"` | Waiter, Admin |

### Server → Client Events

| Event Name | Payload Shape | Delivered To | Triggered By |
|------------|---------------|-------------|--------------|
| `NewOrder` | `OrderDto` (same as GET response) | Kitchen group | Order created (pending) |
| `OrderStatusChanged` | `{ orderId: number, status: string }` | Kitchen + Waiter groups | Any order status update |

### Client-Side Usage Example

```typescript
import { HubConnectionBuilder } from '@microsoft/signalr';

const connection = new HubConnectionBuilder()
  .withUrl(`${SIGNALR_URL}?access_token=${token}`, {
    accessTokenFactory: () => token,
  })
  .withAutomaticReconnect()
  .build();

connection.on("NewOrder", (order) => {
  // Show toast / update order list
});

connection.on("OrderStatusChanged", ({ orderId, status }) => {
  // Update local state for this order
});

await connection.start();
```

---

## Endpoint Summary

| Feature | Method | Path | Auth | Role | Response |
|---------|--------|------|:----:|------|----------|
| **Tables** | `GET` | `/api/tables` | None | Public | 200 `TableDto[]` |
| | `POST` | `/api/tables` | JWT | Admin | 201 `TableDto` |
| | `PUT` | `/api/tables/{id}` | JWT | Admin | 200 `TableDto` |
| | `DELETE` | `/api/tables/{id}` | JWT | Admin | 204 No Content |
| **Users** | `GET` | `/api/users` | JWT | Admin | 200 `UserDto[]` |
| | `PUT` | `/api/users/{id}` | JWT | Admin | 200 `UserDto` |
| | `DELETE` | `/api/users/{id}` | JWT | Admin | 204 No Content |

---

*Next: [01-app-structure (Frontend)](../frontend/01-app-structure.md)*
