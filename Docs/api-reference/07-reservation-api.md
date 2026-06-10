# Reservations API

## Overview

Reservations allow public and authenticated users to book tables in advance. Staff can manage reservations from the dashboard. Status flow: `Pending → Confirmed` / `Completed` / `Cancelled`.

---

## Reservation Endpoints

### POST `/api/reservations`

**Auth:** Optional — JWT or anonymous (public reservation form)  
**Request Body:** `CreateReservationRequest { customerName, customerEmail, customerPhone?, guestCount, reservationTime, note? }`

```json
{
  "customerName": "Ahmet Yilmaz",
  "customerEmail": "ahmet@example.com",
  "customerPhone": "+49 170 1234567",
  "guestCount": 4,
  "reservationTime": "2026-06-15T19:00:00Z",
  "note": "Window seat preferred"
}
```

**Response:** `201 Created → ReservationDto`

- Sets reservation status to `Pending`
- Optionally associates with authenticated user
- Returns full ReservationDto with generated id and timestamps

---

### GET `/api/reservations?status=X&date=X&page=1&pageSize=20`

**Auth:** Required — **Admin, Waiter**  
**Query Params:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | ReservationStatus? | Filter: pending, confirmed, completed, cancelled |
| `date` | DateTime? | Filter reservations on this date (YYYY-MM-DD) |
| `page` | int | Page number (default 1) |
| `pageSize` | int | Items per page (default 20) |

**Response:** `200 OK → PaginatedResponse<ReservationDto>`

```json
{
  "items": [
    {
      "id": 7,
      "tableId": 3,
      "tableNumber": 5,
      "userId": 2,
      "staffName": "Maria K.",
      "customerName": "Ahmet Yilmaz",
      "customerEmail": "ahmet@example.com",
      "customerPhone": "+49 170 1234567",
      "guestCount": 4,
      "reservationTime": "2026-06-15T19:00:00Z",
      "status": "pending",
      "note": "Window seat preferred",
      "createdAt": "2026-06-09T10:30:00Z"
    }
  ],
  "totalCount": 42,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

---

### GET `/api/reservations/{id}`

**Auth:** Required — **Admin, Waiter**  
**Response:** `200 OK → ReservationDto`

```json
{
  "id": 7,
  "tableId": 3,
  "tableNumber": 5,
  "userId": 2,
  "staffName": "Maria K.",
  "customerName": "Ahmet Yilmaz",
  "customerEmail": "ahmet@example.com",
  "customerPhone": "+49 170 1234567",
  "guestCount": 4,
  "reservationTime": "2026-06-15T19:00:00Z",
  "status": "pending",
  "note": "Window seat preferred",
  "createdAt": "2026-06-09T10:30:00Z"
}
```

---

### PUT `/api/reservations/{id}`

**Auth:** Required — **Admin, Waiter**  
**Request Body:** `UpdateReservationRequest` (all fields optional)

```json
{
  "tableId": 5,
  "customerName": "Ahmet Yilmaz",
  "guestCount": 6,
  "reservationTime": "2026-06-15T20:00:00Z",
  "note": "Changed to larger table"
}
```

**Response:** `200 OK → ReservationDto` (updated)

---

### PUT `/api/reservations/{id}/status`

**Auth:** Required — **Admin, Waiter**  
**Request Body:** `UpdateReservationStatusRequest { status }`

```json
{ "status": "confirmed" }
```

**Response:** `200 OK → ReservationDto` (updated)

---

### DELETE `/api/reservations/{id}`

**Auth:** Required — **Admin**  
**Response:** `204 No Content`

- Only reservations in `Pending` or `Confirmed` status can be deleted
- Deleting a confirmed reservation frees the associated table

---

## Reservation Status Pipeline

```
      Pending ────────→ Confirmed ────────→ Completed
         │                   │                   │
         ↓                   ↓                   ↓
     Cancelled             ————                ————
```

| Status | Meaning | Allowed Transitions |
|--------|---------|-------------------|
| `pending` | New reservation, awaiting confirmation | → confirmed, cancelled |
| `confirmed` | Staff has confirmed the booking | → completed, cancelled |
| `completed` | Reservation fulfilled (guest arrived and dined) | — |
| `cancelled` | Reservation cancelled by staff or guest | — |

---

## DTOs

### CreateReservationRequest

```json
{
  "customerName": "string (required)",
  "customerEmail": "string (required)",
  "customerPhone": "string?",
  "guestCount": "number (default: 2)",
  "reservationTime": "ISO 8601 UTC (required)",
  "note": "string?"
}
```

### ReservationDto

```json
{
  "id": "int",
  "tableId": "int | null",
  "tableNumber": "int",
  "userId": "int | null",
  "staffName": "string? (assigned staff)",
  "customerName": "string",
  "customerEmail": "string",
  "customerPhone": "string?",
  "guestCount": "int",
  "reservationTime": "ISO 8601 UTC",
  "status": "pending | confirmed | completed | cancelled",
  "note": "string?",
  "createdAt": "ISO 8601 UTC"
}
```

### UpdateReservationRequest (partial update)

All fields optional. Only provided fields will be updated.

```json
{
  "tableId": "int?",
  "customerName": "string?",
  "customerEmail": "string?",
  "customerPhone": "string?",
  "guestCount": "int?",
  "reservationTime": "ISO 8601?",
  "note": "string?"
}
```

---

## Endpoint Summary

| Method | Path | Auth | Role | Response |
|--------|------|:----:|------|----------|
| `POST` | `/api/reservations` | Optional JWT | Admin, Waiter, Public | 201 `ReservationDto` |
| `GET` | `/api/reservations?status=X&date=X&page=Y&pageSize=Z` | JWT | Admin, Waiter | 200 `Paginated<ReservationDto>` |
| `GET` | `/api/reservations/{id}` | JWT | Admin, Waiter | 200 `ReservationDto` |
| `PUT` | `/api/reservations/{id}` | JWT | Admin, Waiter | 200 `ReservationDto` |
| `PUT` | `/api/reservations/{id}/status` | JWT | Admin, Waiter | 200 `ReservationDto` |
| `DELETE` | `/api/reservations/{id}` | JWT | Admin | 204 No Content |

---

*Previous: [06-management-apis](./06-management-apis.md)*  
*Next: [Frontend Architecture](../frontend/01-app-structure.md)*
