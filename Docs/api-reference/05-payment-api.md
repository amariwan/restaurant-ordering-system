# Payment API

## POST `/api/payments?orderId=X`

**Auth:** Required — **Admin, Waiter**  
**Query Params:**
| Param | Type | Required | Description |
|-------|------|:--------:|-------------|
| `orderId` | int | Yes | Order to pay against |

**Request Body:** `PaymentRequest { amount: decimal, method: PaymentMethod }`

```json
{ "amount": 15.00, "method": "cash" }
```

**Response:** `201 Created → PaymentDto`

```json
{
  "id": 3, "orderId": 42, "amount": 15.00,
  "method": "cash", "paidAt": "2026-06-09T15:00:00Z"
}
```

**Validations:**
- Payment amount > 0
- Total paid cannot exceed order total (guard: `remaining + 0.01m`)
- Cannot add payments to served or cancelled orders
- If remaining = 0 → blocked with clear message

---

## GET `/api/payments/{orderId}`

**Auth:** Required — **Admin, Waiter**  
**Response:** `200 OK → PaymentDto[]` (sorted by PaidAt descending)

```json
[
  { "id": 1, "orderId": 42, "amount": 10.00, "method": "card", "paidAt": "2026-06-09T14:30:00Z" },
  { "id": 2, "orderId": 42, "amount": 5.40, "method": "cash", "paidAt": "2026-06-09T14:35:00Z" },
  { "id": 3, "orderId": 42, "amount": 15.00, "method": "cash", "paidAt": "2026-06-09T15:00:00Z" }
]
```

### Calculation Helper (frontend)

| Value | Formula |
|-------|---------|
| `total` | `Σ(items.price * items.quantity)` |
| `paid` | `Σ(payments.amount)` |
| `remaining` | `total - paid` |

---

## Endpoint Summary

| Method | Path | Auth | Role | Response |
|--------|------|:----:|------|----------|
| `POST` | `/api/payments?orderId=X` | JWT | Admin, Waiter | 201 `PaymentDto` |
| `GET` | `/api/payments/{orderId}` | JWT | Admin, Waiter | 200 `PaymentDto[]` |

---

*Next: [06-management-apis](./06-management-apis.md)*
