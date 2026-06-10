# Authentication Endpoints

## POST `/api/auth/login`

**Auth:** None required  
**Request:** `LoginRequest { email: string, password: string }`  
**Response:** `200 OK → AuthResponse`

```json
{
  "token": "eyJ...",
  "user": { "id": 1, "name": "John", "email": "john@rest.com", "role": "waiter" },
  "refreshToken": "dG9rZW4..."
}
```

**Side Effects:** Sets `restaurant_refresh` HTTP-only cookie + generates CSRF cookie.

---

## POST `/api/auth/register`

**Auth:** None required  
**Request:** `RegisterRequest { name: string, email: string, password: string }`  
**Response:** `201 Created → AuthResponse` (same shape as login)

```json
{
  "token": "eyJ...",
  "user": { "id": 2, "name": "Jane", "email": "jane@rest.com", "role": "waiter" },
  "refreshToken": "dG9rZW4..."
}
```

**Validations:**
- Email must be non-empty and valid format
- Password ≥ 8 characters
- Email must not already exist
- CSRF token or valid referrer required

---

## POST `/api/auth/refresh`

**Auth:** Requires valid refresh cookie  
**Response:** `200 OK → AuthResponse` (new JWT + new refresh cookie)

**Validations:**
- CSRF validation (token match or referrer check)
- Cookie must contain non-empty refresh token
- Token must not be expired or revoked

---

## POST `/api/auth/logout`

**Auth:** Requires valid JWT  
**Response:** `204 No Content`

Revokes the current refresh token and clears cookies.

---

## GET `/api/auth/me`

**Auth:** Requires valid JWT  
**Response:** `200 OK → UserDto`

```json
{ "id": 1, "name": "John", "email": "john@rest.com", "role": "waiter", "createdAt": "2026-06-09T14:30:00Z" }
```

---

## PUT `/api/auth/me`

**Auth:** Requires valid JWT  
**Request:** `UpdateProfileRequest { name: string, email: string }`

```json
{ "name": "John Doe", "email": "john.doe@rest.com" }
```

**Response:** `200 OK → UserDto` (updated profile)

**Validations:**
- Name must be non-empty
- Email must be valid format and not already taken by another user

---

## PUT `/api/auth/me/password`

**Auth:** Requires valid JWT  
**Request:** `ChangePasswordRequest { currentPassword: string, newPassword: string }`

```json
{ "currentPassword": "old-secret", "newPassword": "new-secret-8chars" }
```

**Response:** `204 No Content`

**Validations:**
- `currentPassword` must match the stored BCrypt hash
- `newPassword` must be ≥ 8 characters
- Returns `403 Forbidden` if current password is incorrect

---

## Endpoint Summary

| Method | Path | Auth | Role | Response |
|--------|------|:----:|------|----------|
| `POST` | `/api/auth/login` | None | All | 200 `AuthResponse` |
| `POST` | `/api/auth/register` | None | All | 201 `AuthResponse` |
| `POST` | `/api/auth/refresh` | Cookie | All | 200 `AuthResponse` |
| `POST` | `/api/auth/logout` | JWT | Logged-in | 204 No Content |
| `GET` | `/api/auth/me` | JWT | Logged-in | 200 `UserDto` |
| `PUT` | `/api/auth/me` | JWT | Logged-in | 200 `UserDto` |
| `PUT` | `/api/auth/me/password` | JWT | Logged-in | 204 No Content |

---

*Next: [03-menu-api](./03-menu-api.md)*
