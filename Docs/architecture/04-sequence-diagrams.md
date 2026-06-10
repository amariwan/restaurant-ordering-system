# Sequence Diagrams

## 1 — Registration Flow

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant F as Frontend
    participant AC as AuthController
    participant AS as AuthService
    participant DB as AppDbContext

    B->>F: POST /api/auth/register {name, email, password}
    F->>AC: Register(RegisterRequest)
    AC->>AS: RegisterAsync(request)

    AS->>DB: Check if Email exists
    DB-->>AS: Not found (OK)

    AS->>AS: BCrypt hash(password), workFactor=12
    AS->>DB: INSERT User {Name, Email, PasswordHash, Role=Waiter}
    DB-->>AS: OK

    AS->>AS: Generate JWT token (8h expiry)
    AS->>AS: Generate refresh token
    AS->>AS: Hash refresh token (SHA256)
    AS->>DB: INSERT RefreshToken {UserId, TokenHash}
    DB-->>AS: OK

    AS-->>AC: AuthResponse {token, UserDto, refreshToken}
    AC-->>F: Set-Cookie + JSON response
    F->>B: Navigate to /dashboard (role-aware)
```

**Key details:** New users always receive `UserRole.Waiter`. Refresh token stored as SHA256 hash; raw value in HTTP-only cookie.

---

## 2 — Login Flow

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant F as Frontend
    participant AC as AuthController
    participant AS as AuthService
    participant DB as AppDbContext

    B->>F: POST /api/auth/login {email, password}
    F->>AC: Login(LoginRequest)
    AC->>AS: LoginAsync(request)

    AS->>DB: Find User by Email
    DB-->>AS: User found

    AS->>AS: BCrypt.verify(password, PasswordHash)
    alt Password correct
        AS->>AS: Generate JWT token
        AS->>DB: INSERT new RefreshToken
        AS-->>AC: AuthResponse {token, UserDto}
        AC-->>F: Set-Cookie + JSON response
        F->>B: Role-aware redirect (/dashboard or /orders)
    else Password incorrect
        AS-->>AC: ForbiddenException
        AC-->>F: 403 {message: "Invalid email or password"}
        F->>B: Show error message
    end
```

---

## 3 — Create New Order (Core Workflow)

```mermaid
sequenceDiagram
    autonumber
    participant W as Waiter (Browser)
    participant FC as Cart Store
    participant OC as OrdersController
    participant OS as OrderService
    participant DB as AppDbContext
    participant ON as OrderNotifier
    participant HUB as SignalR Hub
    participant K as Kitchen Display

    W->>FC: Add items to cart + select table (free only)
    FC->>OC: POST /api/orders {tableId, items}

    OC->>OS: CreateAsync(request, userId)

    OS->>DB: Check Table exists & is Free
    DB-->>OS: OK

    loop For each cart item
        OS->>DB: Get MenuItem (fetch price for snapshot)
        DB-->>OS: MenuItem {price}
        OS->>OS: Create OrderItem with PriceAtOrder = price
    end

    OS->>DB: INSERT Order {TableId, UserId, Status=Pending}
    OS->>DB: INSERT all OrderItems (cascade FKs)
    DB-->>OS: OK

    OS->>ON: NotifyNewOrder(orderDto)
    ON->>HUB: SendAsync("NewOrder", orderDto) to group "kitchen"
    HUB->>K: Receive: NewOrder {orderId, items, table}

    OS-->>OC: OrderDto (status=Pending)
    OC-->>FC: 201 Created {order}
    FC->>W: Navigate to /orders/[id]
```

**Critical:** `PriceAtOrder` is captured at creation time. This value never changes even if the menu item price is updated later. The invoice always reflects what was quoted at order time.

---

## 4 — Update Order Status (Kitchen Flow)

```mermaid
sequenceDiagram
    autonumber
    participant K as Kitchen Display
    participant OSVC as OrdersController
    participant OS as OrderService
    participant DB as AppDbContext
    participant ON as OrderNotifier
    participant HUB as SignalR Hub
    participant W as Waiter Browser

    K->>OSVC: PUT /api/orders/{id}/status {status: Preparing}

    OSVC->>OS: UpdateStatusAsync(id, Preparing, Kitchen)

    OS->>DB: Load Order by id (include Table)
    DB-->>OS: Order found

    alt Role is Kitchen AND status ∈ {Preparing, Ready}
        OS->>DB: UPDATE Order.Status = Preparing
        OS->>ON: NotifyOrderStatusChanged(id, Preparing)
        ON->>HUB: Broadcast to "kitchen" + "waiter" groups
        HUB->>W: WebSocket: OrderStatusChanged {orderId, status}
        OS-->>OSVC: 200 OK {orderDto}
        OSVC-->>K: {order with new status}
    else Invalid role or transition
        OS-->>OSVC: 403 ForbiddenException
        OSVC-->>K: 403 {message, errors[]}
    end
```

---

## 5 — Process Payment (Partial or Full)

```mermaid
sequenceDiagram
    autonumber
    participant W as Waiter
    participant PC as PaymentsController
    participant PS as PaymentService
    participant DB as AppDbContext

    W->>PC: POST /api/payments?orderId=X {amount, method}

    PC->>PS: CreateAsync(orderId, request)

    PS->>DB: Load Order + Items (calculate total)
    PS->>DB: Sum all existing Payments for order
    PS->>PS: Calculate remaining = total - summedPayments

    alt amount ≤ remaining
        PS->>DB: INSERT Payment {OrderId, Amount, Method, PaidAt}
        DB-->>PS: OK
        PS-->>PC: 201 Created {PaymentDto}
        PC-->>W: {payment}
    else amount > remaining
        PS-->>PC: 409 ConflictException
        PC-->>W: {message: "exceeds remaining balance"}
    end
```

**Partial payments supported:** A single order can have multiple `Payment` records with different methods (e.g., part cash, part card). The frontend sums all payments to show progress.

---

## 6 — Admin Menu Item CRUD

```mermaid
sequenceDiagram
    autonumber
    participant A as Admin
    participant MC as MenuController
    participant MS as MenuService
    participant DB as AppDbContext
    participant FS as FileStorage

    A->>MC: POST /api/menu {name, categoryId, price}

    MC->>MS: CreateMenuItemAsync(request)

    MS->>DB: Check CategoryId exists
    DB-->>MS: OK (via AnyAsync)

    MS->>DB: INSERT MenuItem
    DB-->>MS: MenuItem created

    alt ImageUrl provided
        MS->>FS: UploadFileAsync(stream, fileName, contentType)
        FS-->>MS: returned imageUrl
        MS->>DB: UPDATE MenuItem.ImageUrl = imageUrl
    end

    MS-->>MC: 201 Created {MenuItemDto}
    MC-->>A: {menuItem}
```

---

## 7 — SignalR Real-Time Events

| Event | Payload | Delivered To | Triggered By |
|-------|---------|-------------|--------------|
| `NewOrder` | `OrderDto` | Kitchen group | Order created (pending) |
| `OrderStatusChanged` | `{ orderId, status }` | Kitchen + Waiter groups | Any order status update |

```mermaid
sequenceDiagram
    autonumber
    participant K as Kitchen Display
    participant W as Waiter Dashboard
    participant HUB as SignalR Hub : /hubs/orders
    participant S as OrderService

    Note over K,W: On connect (both join groups by role)
    K->>HUB: JoinGroup("kitchen")
    W->>HUB: JoinGroup("waiter")

    Note over S,K: Kitchen marks order preparing
    S->>HUB: SendToGroup("kitchen", "OrderStatusChanged", payload)
    HUB->>K: Delivers only to kitchen group

    Note over S,W: Kitchen marks order ready
    S->>HUB: Broadcast to all connected (or specific groups)
    HUB->>W: Delivers OrderStatusChanged {orderId, Ready}
    W->>W: Re-render order card (status badge updates live)
```

---

*Next: [05-business-processes](./05-business-processes.md)*
