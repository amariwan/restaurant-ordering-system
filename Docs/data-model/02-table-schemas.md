# Table Schemas

## 1 — users

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | |
| `Name` | varchar | NotNull | |
| `Email` | varchar | **Unique**, NotNull | Indexed unique constraint |
| `PasswordHash` | varchar | NotNull | BCrypt workFactor=12 |
| `Role` | smallint (enum) | NotNull | 0=Admin, 1=Waiter, 2=Kitchen |
| `CreatedAt` | timestamp | NotNull, Default: NOW() | UTC |
| `UpdatedAt` | timestamp | Nullable | Set on update via EF Core hooks |

**Indexes:** `IX_Users_Email` (unique)

---

## 2 — refresh_tokens

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | |
| `UserId` | int | FK → users.Id | Nullable in case of deletion cascade |
| `TokenHash` | varchar | **Unique**, NotNull | SHA256 of raw token |
| `CreatedAt` | timestamp | NotNull | |
| `ExpiresAt` | timestamp | NotNull | 30-day lifetime |
| `RevokedAt` | timestamp | Nullable | null = active |

**Indexes:** `IX_RefreshTokens_TokenHash` (unique)

---

## 3 — categories

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | |
| `NameEn` | varchar | NotNull | English name |
| `NameKu` | varchar | NotNull | Kurdish (Kurmanji) name |
| `SortOrder` | int | NotNull, Default: 0 | Display order |
| `CreatedAt` | timestamp | NotNull, Default: NOW() | UTC |
| `UpdatedAt` | timestamp | Nullable | |

**Indexes:** None (default table scan is fine for typical category counts)

---

## 4 — menu_items

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | |
| `CategoryId` | int | FK → categories.Id | |
| `NameEn` | varchar | NotNull | English name |
| `NameKu` | varchar | NotNull | Kurdish (Kurmanji) name |
| `Price` | decimal(18,2) | NotNull | Precision (18,2) |
| `Available` | boolean | NotNull, Default: true | |
| `DescriptionEn` | varchar | Nullable | English description |
| `DescriptionKu` | varchar | Nullable | Kurdish description |
| `ImageUrl` | varchar | Nullable | Relative path or full URL |
| `CreatedAt` | timestamp | NotNull, Default: NOW() | UTC |
| `UpdatedAt` | timestamp | Nullable | |

**Indexes:** None required (category FK lookup is fast enough)

---

## 5 — tables

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | |
| `Number` | int | **Unique**, NotNull | Table number (not DB row number) |
| `Capacity` | int | NotNull, Default: 4 | Seating capacity |
| `Area` | varchar | Nullable | e.g., "terrace", "indoor" |
| `Status` | smallint (enum) | NotNull | 0=Free, 1=Occupied, 2=Reserved |
| `CreatedAt` | timestamp | NotNull, Default: NOW() | UTC |
| `UpdatedAt` | timestamp | Nullable | |

**Indexes:** `IX_Tables_Number` (unique)

---

## 6 — orders

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | |
| `TableId` | int | FK → tables.Id **CascadeDelete** | |
| `UserId` | int? | FK → users.Id **CascadeDelete** | Nullable — public orders without user |
| `Status` | smallint (enum) | NotNull, Default: Pending | 0-4 per OrderStatus enum |
| `CreatedAt` | timestamp | NotNull, Default: NOW() | UTC |
| `UpdatedAt` | timestamp | Nullable | |

**Indexes:** None defined beyond FK constraints. Filtering done via service-layer WHERE clauses with query filters.

---

## 7 — order_items

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | |
| `OrderId` | int | FK → orders.Id **CascadeDelete** | |
| `MenuItemId` | int | FK → menu_items.Id **Restrict** | Cannot delete if referenced |
| `Quantity` | int | NotNull | Must be > 0 |
| `PriceAtOrder` | decimal(18,2) | NotNull | Snapshot — never changes |
| `Note` | varchar | Nullable | Customer note (e.g., "no onions") |

**Indexes:** None required (FKs provide sufficient lookup path)

---

## 8 — payments

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | |
| `OrderId` | int | FK → orders.Id **CascadeDelete** | |
| `Amount` | decimal(18,2) | NotNull | Precision (18,2) |
| `Method` | smallint (enum) | NotNull | 0=Cash, 1=Card |
| `PaidAt` | timestamp | NotNull, Default: NOW() | UTC |
| `CreatedAt` | timestamp | NotNull, Default: NOW() | UTC |
| `UpdatedAt` | timestamp | Nullable | |

**Indexes:** Filtering by OrderId is fast via FK index.

---

## 9 — reservations (NEW)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `Id` | int | PK, Identity | |
| `TableId` | int? | FK → tables.Id **CascadeDelete** | Nullable — unassigned reservation |
| `UserId` | int? | FK → users.Id **CascadeDelete** | Nullable — anonymous reservations |
| `CustomerName` | varchar | NotNull | Guest name |
| `CustomerEmail` | varchar | NotNull | Guest email |
| `CustomerPhone` | varchar | Nullable | Guest phone |
| `GuestCount` | int | NotNull, Default: 2 | Number of guests |
| `ReservationTime` | timestamp | NotNull | Desired reservation time (UTC) |
| `Status` | smallint (enum) | NotNull, Default: Pending | Pending→Confirmed/Completed/Cancelled |
| `Note` | varchar | Nullable | Special requests or notes |
| `CreatedAt` | timestamp | NotNull, Default: NOW() | UTC |
| `UpdatedAt` | timestamp | Nullable | |

**Indexes:** Filtering by status and date is done via service-layer WHERE clauses.

---

## EF Core Configuration Highlights

Key configuration in `AppDbContext.OnModelCreating`:

```csharp
// Unique constraints
modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
modelBuilder.Entity<Table>().HasIndex(t => t.Number).IsUnique();
modelBuilder.Entity<RefreshToken>(rb => rb.HasIndex(r => r.TokenHash).IsUnique());

// Decimal precision
modelBuilder.Entity<MenuItem>().Property(m => m.Price).HasPrecision(18, 2);
modelBuilder.Entity<OrderItem>().Property(oi => oi.PriceAtOrder).HasPrecision(18, 2);
modelBuilder.Entity<Payment>().Property(p => p.Amount).HasPrecision(18, 2);

// Relationship configurations
modelBuilder.Entity<Order>()
    .HasOne(o => o.Table)
    .WithMany(t => t.Orders)
    .HasForeignKey(o => o.TableId)
    .OnDelete(DeleteBehavior.Cascade);

modelBuilder.Entity<OrderItem>()
    .HasOne(oi => oi.MenuItem)
    .WithMany(m => m.OrderItems)
    .HasForeignKey(oi => oi.MenuItemId)
    .OnDelete(DeleteBehavior.Restrict);  // ← protects historical data

modelBuilder.Entity<Reservation>()
    .HasOne(r => r.Table)
    .WithMany()
    .HasForeignKey(r => r.TableId)
    .OnDelete(DeleteBehavior.Cascade);
```

---

*Next: [01-overview (API)](../api-reference/01-overview.md)*
