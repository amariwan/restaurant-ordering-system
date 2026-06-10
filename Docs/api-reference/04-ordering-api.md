# Ordering API

## Orders

### GET `/api/orders?status=X&tableId=X`

**Auth:** Required — **Admin, Waiter, Kitchen**  
**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | OrderStatus? | Filter by status (pending, preparing, ready, served, cancelled) |
| `tableId` | int? | Filter by table |

**Response:** `200 OK → OrderDto[]`

```json
[
  {
    "id": 42, "tableId": 3, "tableNumber": 7,
    "userId": 2, "status": "pending", "createdAt": "2026-06-09T14:30:00Z",
    "items": [
      { "id": 1, "menuItemId": 5, "menuItemName": "Margherita Pizza", "price": 12.50, "quantity": 2, "note": null },
      { "id": 2, "menuItemId": 12, "menuItemName": "Caesar Salad", "price": 8.90, "quantity": 1, "note": "No onions" }
    ]
  }
]
```

### GET `/api/orders/{id}`

**Auth:** Required — **Admin, Waiter, Kitchen**  
**Response:** `200 OK → OrderDto` (same shape as above)

---

### POST `/api/orders`

**Auth:** Required — **Admin, Waiter**  
**Request Body:** `OrderRequest { tableId, items: [OrderItemRequest] }`

```json
{
  "tableId": 3,
  "items": [
    { "menuItemId": 5, "quantity": 2 },
    { "menuItemId": 12, "quantity": 1, "note": "No onions" }
  ]
}
```

**Side Effects:**
- Creates Order (status: `Pending`) + all OrderItems
- Sets associated Table.Status = `Occupied`
- `PriceAtOrder` snapshot from current MenuItem prices
- Broadcasts `NewOrder` event via SignalR to kitchen group
- Returns 201 Created with full OrderDto

### PUT `/api/orders/{id}/status`

**Auth:** Required — **Admin, Waiter, Kitchen**  
**Request Body:** `OrderStatusRequest { status: OrderStatus }`

```json
{ "status": "preparing" }
```

**Role-Based Transitions:**

| From State | Kitchen Can Set | Waiter Can Set | Admin Can Set |
|------------|-----------------|----------------|---------------|
| `Pending` | Preparing | — | Cancelled |
| `Preparing` | Ready | — | Cancelled |
| `Ready` | — | Served, Cancelled | Served, Cancelled |

**Side Effects:** Updates status, triggers SignalR `OrderStatusChanged` event. If status becomes `Served`, table is freed automatically.

### DELETE `/api/orders/{id}`

**Auth:** Required — **Admin, Waiter**  
**Response:** `204 No Content`

**Guard:** Only Pending orders can be deleted. Orders with items cannot be removed.

---

## Order Items (on existing order)

### POST `/api/orders/{id}/items`

**Auth:** Required — **Admin, Waiter**  
**Request Body:** `OrderItemRequest { menuItemId, quantity, note? }`

**Guard:** Only Pending or Preparing orders accept items. Price snapshot taken at time of addition.

### DELETE `/api/orders/{orderId}/items/{itemId}`

**Auth:** Required — **Admin, Waiter**  
**Response:** `204 No Content`

**Guard:** Only Pending or Preparing orders can remove items. If this is the last item, table is freed.

---

## Endpoint Summary

| Method | Path | Auth | Role | Response |
|--------|------|:----:|------|----------|
| `GET` | `/api/orders?status=X&tableId=X` | JWT | Admin, Waiter, Kitchen | 200 `OrderDto[]` |
| `GET` | `/api/orders/{id}` | JWT | Admin, Waiter, Kitchen | 200 `OrderDto` |
| `POST` | `/api/orders` | JWT | Admin, Waiter | 201 `OrderDto` |
| `PUT` | `/api/orders/{id}/status` | JWT | All (role-gated) | 200 `OrderDto` |
| `DELETE` | `/api/orders/{id}` | JWT | Admin, Waiter | 204 No Content |
| `POST` | `/api/orders/{id}/items` | JWT | Admin, Waiter | 201 `OrderItemDto` |
| `DELETE` | `/api/orders/{orderId}/items/{itemId}` | JWT | Admin, Waiter | 204 No Content |

---

*Next: [05-payment-api](./05-payment-api.md)*
