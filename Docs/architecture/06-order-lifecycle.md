# Order Lifecycle and Business Process

## Entity Relationships

```mermaid
erDiagram
    USER ||--o{ ORDER : creates
    TABLE ||--o{ ORDER : assigned_to
    ORDER ||--|{ ORDER_ITEM : contains
    MENU_ITEM ||--o{ ORDER_ITEM : references
    ORDER ||--o{ PAYMENT : receives

    USER {
        int Id
    }

    TABLE {
        int Id
        string Status
    }

    ORDER {
        int Id
        int TableId
        int UserId
        OrderStatus Status
    }

    ORDER_ITEM {
        int Id
        decimal PriceAtOrder
        int Quantity
    }

    MENU_ITEM {
        int Id
        decimal Price
    }

    PAYMENT {
        int Id
        decimal Amount
    }
```

---

## Order Status Flow

```mermaid
stateDiagram-v2
    [*] --> Pending

    Pending --> Preparing
    Pending --> Cancelled

    Preparing --> Ready
    Preparing --> Cancelled

    Ready --> Served
    Ready --> Cancelled

    Served --> [*]
    Cancelled --> [*]
```

---

## Order Creation Flow

```mermaid
flowchart TD

    A[POST /api/orders] --> B[Validate Request]

    B --> C{Table Free?}
    C -- No --> X[Return 409 Conflict]
    C -- Yes --> D[Create Order]

    D --> E[Load Menu Items]
    E --> F[Snapshot Current Prices]
    F --> G[Create Order Items]

    G --> H[Set Table Status = Occupied]
    H --> I[Save Changes]

    I --> J[Broadcast NewOrder Event]
    J --> K[Return 201 Created]
```

---

## Status Update Flow

```mermaid
flowchart TD

    A["PUT /api/orders/{id}/status"]
        --> B[Check User Role]

    B --> C[Validate Transition]

    C --> D{Transition Allowed?}

    D -- No --> E[Throw ForbiddenException]

    D -- Yes --> F[Update Order Status]

    F --> G{Status = Served?}

    G -- Yes --> H[Set Table Status = Free]
    G -- No --> I[Keep Current Table Status]

    H --> J[Save Changes]
    I --> J

    J --> K[Broadcast OrderStatusChanged]
```

---

## Add Item Flow

```mermaid
flowchart TD

    A[POST /orders/{id}/items]
        --> B{Order Modifiable?}

    B -- No --> X[403 Forbidden]

    B -- Yes --> C[Validate Menu Item]

    C --> D[Read Current Price]
    D --> E[Create OrderItem]
    E --> F[Store PriceAtOrder Snapshot]
    F --> G[Save Changes]
```

---

## Remove Item Flow

```mermaid
flowchart TD

    A[DELETE Item]
        --> B[Remove OrderItem]

    B --> C{Order Empty?}

    C -- No --> D[Save Changes]

    C -- Yes --> E[Set Table = Free]
    E --> D
```

---

## Payment Calculation

```mermaid
flowchart LR

    A[Order Items]
        --> B[PriceAtOrder × Quantity]

    B --> C[Order Total]

    D[Existing Payments]
        --> E[Total Paid]

    C --> F[Remaining Amount]
    E --> F
```

---

## Real-Time Communication

```mermaid
flowchart LR

    API -->|NewOrder| SignalR
    API -->|OrderStatusChanged| SignalR

    SignalR --> KitchenClients
    SignalR --> WaiterClients
    SignalR --> OtherClients
```

---

## Complete Request Lifecycle

```mermaid
sequenceDiagram

    participant Waiter
    participant API
    participant Database
    participant Kitchen

    Waiter->>API: POST /api/orders
    API->>Database: Create Order
    Database-->>API: Success

    API-->>Waiter: 201 Created
    API->>Kitchen: NewOrder Event

    Kitchen->>API: Update Status → Preparing
    API->>Database: Update Order

    Kitchen->>API: Update Status → Ready
    API->>Database: Update Order

    Waiter->>API: Update Status → Served
    API->>Database: Release Table

    API->>All Clients: OrderStatusChanged
```
