# Menu API

All menu content is **bilingual**: every category and item has separate English (`_en`) and Kurdish (`_ku`) fields. The backend always returns both; the frontend selects the active language.

---

## Categories

### GET `/api/menu/categories`

**Auth:** None (public)  
**Response:** `200 OK → CategoryDto[]`

```json
[
  { "id": 1, "nameEn": "Pizzas", "nameKu": "پیتزاکان" },
  { "id": 2, "nameEn": "Salads", "nameKu": "سەڵاتەکان" }
]
```

### POST `/api/menu/categories`

**Auth:** Required — **Admin**  
**Request Body:** `CategoryRequest { nameEn: string, nameKu: string }`

```json
{ "nameEn": "Desserts", "nameKu": "شیرینیەکان" }
```

**Response:** `201 Created → CategoryDto`

### PUT `/api/menu/categories/{id}`

**Auth:** Required — **Admin**  
**Request Body:** `CategoryRequest { nameEn: string, nameKu: string }`

**Response:** `200 OK → CategoryDto`

### DELETE `/api/menu/categories/{id}`

**Auth:** Required — **Admin**  
**Response:** `204 No Content`

**Guard:** Blocks deletion if the category has existing menu items (returns `409 Conflict`).

---

## Menu Items

### GET `/api/menu?categoryId=X&available=true`

**Auth:** None (public)  
**Query Params:**

| Param | Type | Description |
|-------|------|-------------|
| `categoryId` | int? | Filter by category |
| `available` | bool? | Filter by availability (`true` = only available items) |

**Response:** `200 OK → MenuItemDto[]`

```json
[
  {
    "id": 1,
    "categoryId": 1,
    "categoryNameEn": "Pizzas",
    "categoryNameKu": "پیتزاکان",
    "nameEn": "Margherita Pizza",
    "nameKu": "پیتزای مارگریتا",
    "descriptionEn": "Classic tomato and mozzarella",
    "descriptionKu": "تۆماتۆ و موزارێلای کلاسیک",
    "price": 12.50,
    "available": true,
    "imageUrl": "/Images/pizza.png"
  }
]
```

### GET `/api/menu/{id}`

**Auth:** None (public)  
**Response:** `200 OK → MenuItemDto` (same shape as list item above)

---

### POST `/api/menu`

**Auth:** Required — **Admin**  
**Request Body:** `MenuItemRequest`

```json
{
  "categoryId": 1,
  "nameEn": "Pepperoni Pizza",
  "nameKu": "پیتزای پێپەرۆنی",
  "descriptionEn": "Spicy pepperoni on tomato base",
  "descriptionKu": "پێپەرۆنی تیژ لەسەر بنەڕەتی تۆماتۆ",
  "price": 14.90,
  "available": true,
  "imageUrl": "/Images/pepperoni.png"
}
```

**Response:** `201 Created → MenuItemDto`

### PUT `/api/menu/{id}`

**Auth:** Required — **Admin**  
**Request Body:** `MenuItemRequest` (same shape as create — all fields required)

**Response:** `200 OK → MenuItemDto`

### DELETE `/api/menu/{id}`

**Auth:** Required — **Admin**  
**Response:** `204 No Content`

**Guard:** Blocks deletion if the menu item is referenced in any existing order (`409 Conflict`).

---

### POST `/api/menu/upload-image`

**Auth:** Required — **Admin**  
**Content-Type:** `multipart/form-data`  
**Body:** `file` field with the image binary

**Response:** `200 OK`

```json
{ "url": "/Images/uploaded-file.jpg" }
```

The returned `url` can be used directly as `imageUrl` in a `MenuItemRequest`.

---

## DTOs

### CategoryDto

```json
{
  "id": "int",
  "nameEn": "string",
  "nameKu": "string"
}
```

### MenuItemDto

```json
{
  "id": "int",
  "categoryId": "int",
  "categoryNameEn": "string",
  "categoryNameKu": "string",
  "nameEn": "string",
  "nameKu": "string",
  "descriptionEn": "string | null",
  "descriptionKu": "string | null",
  "price": "decimal (18,2)",
  "available": "bool",
  "imageUrl": "string | null"
}
```

---

## Endpoint Summary

| Method | Path | Auth | Role | Response |
|--------|------|:----:|------|----------|
| `GET` | `/api/menu/categories` | None | Public | 200 `CategoryDto[]` |
| `POST` | `/api/menu/categories` | JWT | Admin | 201 `CategoryDto` |
| `PUT` | `/api/menu/categories/{id}` | JWT | Admin | 200 `CategoryDto` |
| `DELETE` | `/api/menu/categories/{id}` | JWT | Admin | 204 No Content |
| `GET` | `/api/menu?categoryId=X&available=true` | None | Public | 200 `MenuItemDto[]` |
| `GET` | `/api/menu/{id}` | None | Public | 200 `MenuItemDto` |
| `POST` | `/api/menu` | JWT | Admin | 201 `MenuItemDto` |
| `PUT` | `/api/menu/{id}` | JWT | Admin | 200 `MenuItemDto` |
| `DELETE` | `/api/menu/{id}` | JWT | Admin | 204 No Content |
| `POST` | `/api/menu/upload-image` | JWT | Admin | 200 `{ url }` |

---

*Next: [04-ordering-api](./04-ordering-api.md)*
