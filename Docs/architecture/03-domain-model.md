# Domain & Service Model

## 1 — Entity Relationships (Class Diagram)

```mermaid
classDiagram
    class User {
        +int Id
        +string Name
        +string Email
        +string PasswordHash
        +UserRole Role
        +DateTime CreatedAt
        +DateTime? UpdatedAt
        +List~RefreshToken~ RefreshTokens
    }

    class RefreshToken {
        +int Id
        +int UserId
        +string TokenHash
        +DateTime ExpiresAt
        +DateTime? RevokedAt
        +bool IsActive
        +User User
    }

    class Category {
        +int Id
        +string NameEn
        +string NameKu
        +int SortOrder
        +DateTime CreatedAt
        +DateTime? UpdatedAt
        +List~MenuItem~ MenuItems
    }

    class MenuItem {
        +int Id
        +int CategoryId
        +string NameEn
        +string NameKu
        +decimal Price (P18,2)
        +bool Available
        +string DescriptionEn?
        +string DescriptionKu?
        +string ImageUrl?
        +DateTime CreatedAt
        +DateTime? UpdatedAt
        +Category Category
        +List~OrderItem~ OrderItems
    }

    class Table {
        +int Id
        +int Number (unique)
        +int Capacity
        +string Area?
        +TableStatus Status
        +DateTime CreatedAt
        +DateTime? UpdatedAt
        +List~Order~ Orders
    }

    class Order {
        +int Id
        +int TableId (FK → Tables)
        +int? UserId (FK → Users) nullable
        +OrderStatus Status
        +DateTime CreatedAt
        +DateTime? UpdatedAt
        +Table Table
        +User? User
        +List~OrderItem~ Items
        +List~Payment~ Payments
    }

    class OrderItem {
        +int Id
        +int OrderId (FK → Orders)
        +int MenuItemId (FK → MenuItems)
        +int Quantity
        +decimal PriceAtOrder (P18,2)
        +string Note?
        +Order Order
        +MenuItem MenuItem
    }

    class Payment {
        +int Id
        +int OrderId (FK → Orders)
        +decimal Amount (P18,2)
        +PaymentMethod Method
        +DateTime PaidAt
        +DateTime CreatedAt
        +DateTime? UpdatedAt
        +Order Order
    }

    class Reservation {
        +int Id
        +int? TableId (FK → Tables)
        +int? UserId (FK → Users)
        +string CustomerName
        +string CustomerEmail
        +string CustomerPhone?
        +int GuestCount
        +DateTime ReservationTime
        +ReservationStatus Status
        +string Note?
        +DateTime CreatedAt
        +DateTime? UpdatedAt
        +Table? Table
        +User? User
    }

    User "1" *-- "0..*" RefreshToken : issues
    User "1" *-- "0..*" Order : places
    User "1" *-- "0..*" Reservation : makes
    Category "1" *-- "0..*" MenuItem : contains
    Table "1" *-- "0..*" Order : has
    Table "1" o-- "0..*" Reservation : reserved for
    Order "1" *-- "1" Table
    Order "1" o-- "1" User
    Order "1" *-- "1" OrderItem : contains (min 1)
    MenuItem "1" *-- "0..*" OrderItem : in
    Order "1" *-- "0..*" Payment : receives
```

## 2 — Enums (All Shared Constants)

```mermaid
classDiagram
    class UserRole { Admin, Waiter, Kitchen }
    class OrderStatus { Pending, Preparing, Ready, Served, Cancelled }
    class TableStatus { Free, Occupied, Reserved }
    class PaymentMethod { Cash, Card }
    class ReservationStatus { Pending, Confirmed, Completed, Cancelled }
```

## 3 — DTOs by Feature

### Auth
```mermaid
classDiagram
    class LoginRequest { +string Email, +string Password }
    class RegisterRequest { +string Name, +string Email, +string Password }
    class AuthResponse { +string Token, +UserDto User, +string RefreshToken? }
    class ChangePasswordRequest { +string CurrentPassword, +string NewPassword }
    class UpdateProfileRequest { +string Name, +string Email }
    class UserDto { +int Id, +string Name, +string Email, +UserRole Role, +DateTime CreatedAt }
    LoginRequest --> AuthResponse : maps to
    RegisterRequest --> AuthResponse : maps to
    AuthResponse --> UserDto : contains
```

### Menu (bilingual EN/KU)
```mermaid
classDiagram
    class CategoryDto { +int Id, +string NameEn, +string NameKu }
    class MenuItemDto { +int Id, +int CategoryId, +string CategoryNameEn, +string CategoryNameKu, +string NameEn, +string NameKu, +decimal Price, +bool Available, +string DescriptionEn?, +string DescriptionKu?, +string ImageUrl? }
    class CategoryRequest { +string NameEn, +string NameKu }
    class MenuItemRequest { +int CategoryId, +string NameEn, +string NameKu, +decimal Price, +bool Available, +string DescriptionEn?, +string DescriptionKu?, +string ImageUrl? }
    CategoryDto --> MenuItemDto : parent category
    MenuItemRequest --> MenuItemDto : produces
```

### Orders
```mermaid
classDiagram
    class OrderDto { +int Id, +int TableId, +int TableNumber, +int? UserId, +OrderStatus Status, +OrderItemDto[] Items, +DateTime CreatedAt }
    class OrderRequest { +int TableId, +OrderItemRequest[] Items }
    class OrderItemDto { +int Id, +int MenuItemId, +string MenuItemNameEn, +string MenuItemNameKu, +decimal Price, +int Quantity, +string Note? }
    class OrderItemRequest { +int MenuItemId, +int Quantity, +string Note? }
    class OrderStatusRequest { +OrderStatus Status }
    OrderRequest --> OrderDto : produces
    OrderItemRequest --> OrderItemDto : item detail
```

### Payments
```mermaid
classDiagram
    class PaymentDto { +int Id, +int OrderId, +decimal Amount, +PaymentMethod Method, +DateTime PaidAt }
    class PaymentRequest { +decimal Amount, +PaymentMethod Method }
    PaymentRequest --> PaymentDto : produces
```

### Tables
```mermaid
classDiagram
    class TableDto { +int Id, +int Number, +int Capacity, +string Area?, +TableStatus Status }
    class TableRequest { +int Number, +int Capacity?, +string Area?, +TableStatus Status? }
    TableRequest --> TableDto : produces
```

### Reservations (NEW)
```mermaid
classDiagram
    class ReservationDto { +int Id, +int? TableId, +int TableNumber, +int? UserId, +string StaffName?, +string CustomerName, +string CustomerEmail, +string CustomerPhone?, +int GuestCount, +DateTime ReservationTime, +ReservationStatus Status, +string Note?, +DateTime CreatedAt }
    class CreateReservationRequest { +string CustomerName, +string CustomerEmail, +string CustomerPhone?, +int GuestCount, +DateTime ReservationTime, +string Note? }
    class UpdateReservationRequest { +int? TableId, +string CustomerName?, +string CustomerEmail?, +string CustomerPhone?, +int GuestCount?, +DateTime ReservationTime?, +string Note? }
    class UpdateReservationStatusRequest { +ReservationStatus Status }
    CreateReservationRequest --> ReservationDto : produces
```

### Users
```mermaid
classDiagram
    class UserUpdateRequest { +string Name, +string Email, +string Role }
```

## 4 — Service Contracts (Interfaces)

| Interface | Methods | Layer |
|-----------|---------|-------|
| `IAuthService` | LoginAsync, RegisterAsync, RefreshTokenAsync, RevokeRefreshTokenAsync, GetCurrentUserAsync, ChangePasswordAsync, UpdateProfileAsync | Core → Infra |
| `IOrderService` | GetAllAsync, GetByIdAsync, CreateAsync, UpdateStatusAsync, AddItemAsync, RemoveItemAsync, DeleteAsync | Core → Infra |
| `IMenuService` | GetCategoriesAsync, Create/Update/DeleteCategory, GetMenuItemsAsync, Create/Update/DeleteMenuItem | Core → Infra |
| `ITableService` | GetAllAsync, CreateAsync, UpdateAsync, DeleteAsync | Core → Infra |
| `IPaymentService` | CreateAsync, GetAllByOrderIdAsync | Core → Infra |
| `IUserService` | GetAllAsync, UpdateAsync, DeleteAsync | Core → Infra |
| `IReservationService` | CreateAsync, GetAllAsync (paginated), GetByIdAsync, UpdateAsync, UpdateStatusAsync, DeleteAsync | Core → Infra |
| `IOrderNotifier` | NotifyNewOrder, NotifyOrderStatusChanged | Core (contract) → API (impl via Hub) |
| `IFileStorage` | UploadFileAsync → returns URL/path | Core (contract) → Infra (LocalFileStorage / S3FileStorage) |

## 5 — Mapping Strategy

AutoMapper profiles defined in [MappingProfiles](../../backend/RestaurantApp.Infrastructure/Mappings/MappingProfiles.cs):

```csharp
CreateMap<User, UserDto>().ReverseMap();
CreateMap<MenuItem, MenuItemDto>()
    .ForMember(d => d.CategoryNameEn, opt => opt.MapFrom(s => s.Category.NameEn))
    .ForMember(d => d.CategoryNameKu, opt => opt.MapFrom(s => s.Category.NameKu));
CreateMap<Order, OrderDto>()
    .ForMember(d => d.TableNumber, opt => opt.MapFrom(s => s.Table.Number))
    .ForMember(d => d.Items, opt => opt.MapFrom(s => s.OrderItems));
CreateMap<OrderItem, OrderItemDto>()
    .ForMember(d => d.MenuItemNameEn, opt => opt.MapFrom(s => s.MenuItem.NameEn))
    .ForMember(d => d.MenuItemNameKu, opt => opt.MapFrom(s => s.MenuItem.NameKu))
    .ForMember(d => d.Price, opt => opt.MapFrom(s => s.PriceAtOrder));
```

## 6 — Bilingual Data Model

All menu-facing entities store **bilingual fields** (EN + KU):

| Entity | English Fields | Kurdish Fields |
|--------|---------------|----------------|
| `Category` | `NameEn` | `NameKu` |
| `MenuItem` | `NameEn`, `DescriptionEn` | `NameKu`, `DescriptionKu` |
| `MenuItemDto` | `NameEn`, `DescriptionEn`, `CategoryNameEn` | `NameKu`, `DescriptionKu`, `CategoryNameKu` |

The backend always returns both languages in every response. The frontend selects the active language based on user preference (`lib/i18n/`).

## 7 — Nullable Foreign Keys

The following foreign keys are **nullable by design**:

| Entity | Field | Reason |
|--------|-------|--------|
| `Order.UserId` | `int?` | Supports anonymous orders (e.g., QR-code self-ordering without login) |
| `Reservation.TableId` | `int?` | Reservation can exist before a specific table is assigned |
| `Reservation.UserId` | `int?` | Supports anonymous public reservations (no staff account required) |

---

*Last updated: 2026-06-09 · Generated from source code + architecture analysis*
