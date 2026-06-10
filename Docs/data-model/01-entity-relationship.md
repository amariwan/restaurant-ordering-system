# Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ REFRESH_TOKEN : "issues"
    USER ||--o{ ORDER : "places"
    USER ||--o{ RESERVATION : "makes"
    CATEGORY ||--o{ MENU_ITEM : "contains"
    TABLE ||--o{ ORDER : "assigned to"
    TABLE ||--o{ RESERVATION : "reserved for"
    ORDER ||--|{ ORDER_ITEM : "contains"
    ORDER ||--|{ PAYMENT : "receives"
    MENU_ITEM ||--o{ ORDER_ITEM : "referenced in"

    USER {
        int Id PK
        string Name
        string Email UK
        string PasswordHash
        UserRole Role
        DateTime CreatedAt
        DateTime? UpdatedAt
    }

    REFRESH_TOKEN {
        int Id PK
        int UserId FK
        string TokenHash UK
        DateTime ExpiresAt
        DateTime? RevokedAt
    }

    CATEGORY {
        int Id PK
        string NameEn
        string NameKu
        int SortOrder
        DateTime CreatedAt
        DateTime? UpdatedAt
    }

    MENU_ITEM {
        int Id PK
        int CategoryId FK
        string NameEn
        string NameKu
        decimal Price
        bool Available
        string DescriptionEn
        string DescriptionKu
        string ImageUrl
        DateTime CreatedAt
        DateTime? UpdatedAt
    }

    TABLE {
        int Id PK
        int Number UK
        int Capacity
        string Area
        TableStatus Status
        DateTime CreatedAt
        DateTime? UpdatedAt
    }

    ORDER {
        int Id PK
        int TableId FK
        int? UserId FK
        OrderStatus Status
        DateTime CreatedAt
        DateTime? UpdatedAt
    }

    ORDER_ITEM {
        int Id PK
        int OrderId FK
        int MenuItemId FK
        int Quantity
        decimal PriceAtOrder
        string Note
    }

    PAYMENT {
        int Id PK
        int OrderId FK
        decimal Amount
        PaymentMethod Method
        DateTime PaidAt
        DateTime CreatedAt
        DateTime? UpdatedAt
    }

    RESERVATION {
        int Id PK
        int? TableId FK
        int? UserId FK
        string CustomerName
        string CustomerEmail
        string? CustomerPhone
        int GuestCount
        DateTime ReservationTime
        ReservationStatus Status
        string Note
        DateTime CreatedAt
        DateTime? UpdatedAt
    }
```

> `decimal` fields use precision `(18,2)` — configured in `AppDbContext.OnModelCreating`.
> All auditable entities have `CreatedAt` (timestamp) and nullable `UpdatedAt` for tracking changes.
> `reservations.customerName`, `customerEmail` store bilingual data per customer context.

---

## Relationship Summary

| From | To | Cardinality | Notes |
|------|----|-------------|-------|
| User | RefreshToken | 1 → 0..* | Token rotation support |
| User | Order | 1 → 0..* | Nullable FK — public orders exist |
| User | Reservation | 1 → 0..* | Nullable FK — anonymous reservations |
| Category | MenuItem | 1 → 0..* | Bilingual names |
| Table | Order | 1 → 0..* | Cascade delete on table removal |
| Table | Reservation | 1 → 0..* | Nullable FK — unassigned reservations |
| Order | OrderItem | 1 → 1* | Always has at least one item |
| MenuItem | OrderItem | 1 → 0..* | Price snapshot at order time |
| Order | Payment | 1 → 0..* | Multiple partial payments allowed |
| Reservation | Table | 0..1 → 0..1 | Optional table assignment |

---

*Next: [Table Schemas](./02-table-schemas.md)*
