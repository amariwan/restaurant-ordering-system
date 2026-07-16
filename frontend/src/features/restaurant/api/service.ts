import type {
  User,
  Category,
  MenuItem,
  Table,
  Order,
  Payment,
  Receipt,
  AuthResponse,
  MenuFilters,
  OrdersFilters,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CreateMenuItemPayload,
  UpdateMenuItemPayload,
  CreateTablePayload,
  UpdateTablePayload,
  CreateOrderPayload,
  UpdateOrderStatusPayload,
  AddOrderItemPayload,
  CreatePaymentPayload,
  UpdateUserPayload,
  PaginatedResponse,
  Reservation,
  CreateReservationPayload,
  UpdateReservationPayload,
  UpdateReservationStatusPayload,
  ReservationFilters,
  ChangePasswordPayload,
  ReorderItemRequest,
  Wall,
  CreateWallPayload,
  TablePositionUpdate,
} from './types';
import { getToken as getStoredToken } from '../lib/auth-store';

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:5000';
const SIGNALR_URL = process.env.NEXT_PUBLIC_SIGNALR_URL ?? 'http://127.0.0.1:5000';

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'localhost') parsed.hostname = '127.0.0.1';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return url;
  }
}

const BASE = normalizeUrl(
  RAW_BASE_URL.endsWith('/api') ? RAW_BASE_URL : `${RAW_BASE_URL.replace(/\/$/, '')}/api`
);

async function getAuthHeader(): Promise<Record<string, string> | undefined> {
  // Client-side: read token from shared auth-store
  if (typeof window !== 'undefined') {
    const token = getStoredToken();
    if (!token) return undefined;
    return { Authorization: `Bearer ${token}` };
  }

  // Server-side: try to read cookie via next/headers (dynamic import to avoid bundling in client)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get?.('restaurant_token')?.value;
    if (!token) return undefined;
    return { Authorization: `Bearer ${token}` };
  } catch {
    return undefined;
  }
}

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = await getAuthHeader();

  // Normalize headers into a plain object so we can merge easily and check for content-type
  const headers: Record<string, string> = {};
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((v, k) => {
        headers[k] = v;
      });
    } else if (Array.isArray(options.headers)) {
      for (const [k, v] of options.headers) {
        headers[k] = v as string;
      }
    } else {
      Object.assign(headers, options.headers as Record<string, string>);
    }
  }

  if (auth) Object.assign(headers, auth);

  // On server-side, forward incoming cookies to the backend so HttpOnly refresh cookies are honored.
  if (typeof window === 'undefined') {
    try {
      // dynamic import to avoid bundling in client
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join('; ');
      if (cookieHeader && !headers.cookie) headers.cookie = cookieHeader;
    } catch {
      // ignore
    }
  }

  const body = options.body;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const hasContentType = Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');
  if (!hasContentType && !isFormData && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // Client-side: add CSRF header for state-changing requests using the readable CSRF cookie
  if (typeof window !== 'undefined') {
    const method = (options.method ?? 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const match = document.cookie.match(
          new RegExp(
            '(?:^|; )' + 'restaurant_csrf'.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'
          )
        );
        if (match && match[1]) headers['X-CSRF-TOKEN'] = decodeURIComponent(match[1]);
      } catch {
        // ignore
      }
    }
  }

  const url = BASE ? `${BASE}${path}` : path;
  const fetchOptions: RequestInit = { ...options, headers };

  // Timeout to prevent hanging requests (60s for FormData/file uploads, 15s otherwise)
  if (typeof window !== 'undefined' && !fetchOptions.signal) {
    const timeoutMs = isFormData ? 60_000 : 15_000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    fetchOptions.signal = controller.signal;
    const res = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    return processResponse(res);
  }

  // Ensure browser requests include credentials so HttpOnly refresh cookies are stored
  if (typeof window !== 'undefined') {
    fetchOptions.credentials = 'include';
  }

  const res = await fetch(url, fetchOptions);
  return processResponse(res);
}

async function processResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = 'Unknown error';
    try {
      const body = (await res.json()) as { message?: string };
      message = body.message ?? message;
    } catch {
      // ignore
    }
    const error = new Error(message) as Error & { status: number };
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams();
  for (const k of Object.keys(params)) {
    const v = params[k];
    if (v === undefined || v === null) continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

async function apiGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  return fetchApi<T>(`${path}${buildQuery(params)}`);
}

async function apiPost<T>(path: string, data?: unknown): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && data instanceof FormData;
  return fetchApi<T>(path, { method: 'POST', body: isForm ? data : JSON.stringify(data) });
}

async function apiPut<T>(path: string, data?: unknown): Promise<T> {
  return fetchApi<T>(path, { method: 'PUT', body: JSON.stringify(data) });
}

async function apiPatch<T>(path: string, data?: unknown): Promise<T> {
  return fetchApi<T>(path, { method: 'PATCH', body: JSON.stringify(data) });
}

async function apiDelete<T>(path: string): Promise<T> {
  return fetchApi<T>(path, { method: 'DELETE' });
}

// --- Auth ---

export async function authLogin(data: { email: string; password: string }): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/login', data);
}

export async function authRegister(data: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/register', data);
}

export async function authLogout(): Promise<void> {
  return apiPost<void>('/auth/logout');
}

export async function authMe(): Promise<User> {
  return apiGet<User>('/auth/me');
}

// --- Menu ---

export async function menuGetCategories(): Promise<Category[]> {
  return apiGet<Category[]>('/menu/categories');
}

export async function menuGetItems(
  filters?: MenuFilters,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<MenuItem>> {
  return apiGet<PaginatedResponse<MenuItem>>('/menu', {
    categoryId: filters?.categoryId,
    available: filters?.available,
    page,
    pageSize
  });
}

export async function menuCreateCategory(data: CreateCategoryPayload): Promise<void> {
  return apiPost<void>('/menu/categories', data);
}

export async function menuUpdateCategory(id: number, data: UpdateCategoryPayload): Promise<void> {
  return apiPut<void>(`/menu/categories/${id}`, data);
}

export async function menuDeleteCategory(id: number): Promise<void> {
  return apiDelete<void>(`/menu/categories/${id}`);
}

export async function menuCreateItem(data: CreateMenuItemPayload): Promise<MenuItem> {
  return apiPost<MenuItem>('/menu', data);
}

export async function menuUpdateItem(id: number, data: UpdateMenuItemPayload): Promise<MenuItem> {
  return apiPut<MenuItem>(`/menu/${id}`, data);
}

export async function menuDeleteItem(id: number): Promise<void> {
  return apiDelete<void>(`/menu/${id}`);
}

export async function menuUploadImage(file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append('file', file);
  return apiPost<{ url: string }>('/menu/upload-image', fd);
}

export async function menuReorderCategories(data: ReorderItemRequest[]): Promise<void> {
  return apiPatch<void>('/menu/categories/reorder', data);
}

export async function menuReorderItems(data: ReorderItemRequest[]): Promise<void> {
  return apiPatch<void>('/menu/items/reorder', data);
}

// --- Tables ---

export async function tablesGetAll(floor?: number): Promise<Table[]> {
  return apiGet<Table[]>('/tables', { floor });
}

export async function tablesCreate(data: CreateTablePayload): Promise<Table> {
  return apiPost<Table>('/tables', data);
}

export async function tablesUpdate(id: number, data: UpdateTablePayload): Promise<Table> {
  return apiPut<Table>(`/tables/${id}`, data);
}

export async function tablesDelete(id: number): Promise<void> {
  return apiDelete<void>(`/tables/${id}`);
}

export async function tablesUploadImage(file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append('file', file);
  return apiPost<{ url: string }>('/tables/upload-image', fd);
}

export async function tablesBulkDelete(ids: number[]): Promise<void> {
  return apiPost<void>('/tables/bulk-delete', ids);
}

export async function tablesBulkUpdate(ids: number[], data: UpdateTablePayload): Promise<Table[]> {
  return apiPut<Table[]>('/tables/bulk-update', { ids, data });
}

export async function tablesBulkMove(positions: TablePositionUpdate[]): Promise<Table[]> {
  return apiPut<Table[]>('/tables/bulk-move', positions);
}

// --- Walls ---

export async function wallsGetByFloor(floor: number): Promise<Wall[]> {
  return apiGet<Wall[]>('/walls', { floor });
}

export async function wallsCreate(data: CreateWallPayload): Promise<Wall> {
  return apiPost<Wall>('/walls', data);
}

export async function wallsUpdate(id: number, data: CreateWallPayload): Promise<Wall> {
  return apiPut<Wall>(`/walls/${id}`, data);
}

export async function wallsDelete(id: number): Promise<void> {
  return apiDelete<void>(`/walls/${id}`);
}

export async function wallsBulkDelete(ids: number[]): Promise<void> {
  return apiPost<void>('/walls/bulk-delete', ids);
}

// --- Orders ---

export async function ordersGetAll(
  filters?: OrdersFilters,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<Order>> {
  return apiGet<PaginatedResponse<Order>>('/orders', {
    status: filters?.status,
    tableId: filters?.tableId,
    page,
    pageSize
  });
}

export async function ordersGetById(id: number): Promise<Order> {
  return apiGet<Order>(`/orders/${id}`);
}

export async function ordersCreate(data: CreateOrderPayload): Promise<Order> {
  return apiPost<Order>('/orders', data);
}

export async function ordersUpdateStatus(
  id: number,
  data: UpdateOrderStatusPayload
): Promise<Order> {
  return apiPut<Order>(`/orders/${id}/status`, data);
}

export async function ordersDelete(id: number): Promise<void> {
  return apiDelete<void>(`/orders/${id}`);
}

export async function ordersAddItem(orderId: number, data: AddOrderItemPayload): Promise<Order> {
  return apiPost<Order>(`/orders/${orderId}/items`, data);
}

export async function ordersRemoveItem(orderId: number, itemId: number): Promise<void> {
  return apiDelete<void>(`/orders/${orderId}/items/${itemId}`);
}

// --- Payments ---

export async function paymentsCreate(
  orderId: number,
  data: CreatePaymentPayload
): Promise<Payment> {
  return apiPost<Payment>(`/payments${buildQuery({ orderId })}`, data);
}

export async function paymentsGetByOrder(orderId: number): Promise<Payment[]> {
  return apiGet<Payment[]>(`/payments/${orderId}`);
}

export async function authUpdateProfile(data: { name: string; email: string }): Promise<User> {
  return apiPut<User>('/auth/me', data);
}

export async function authChangePassword(data: ChangePasswordPayload): Promise<User> {
  return apiPut<User>('/auth/me/password', data);
}

// --- Users ---

export async function usersGetAll(
  search?: string,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<User>> {
  return apiGet<PaginatedResponse<User>>('/users', { search, page, pageSize });
}

export async function usersUpdate(id: number, data: UpdateUserPayload): Promise<User> {
  return apiPut<User>(`/users/${id}`, data);
}

export async function usersDelete(id: number): Promise<void> {
  return apiDelete<void>(`/users/${id}`);
}

// --- Reservations ---

export async function reservationsGetAll(
  filters?: ReservationFilters,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<Reservation>> {
  return apiGet<PaginatedResponse<Reservation>>('/reservations', {
    status: filters?.status,
    date: filters?.date,
    page,
    pageSize
  });
}

export async function reservationsGetById(id: number): Promise<Reservation> {
  return apiGet<Reservation>(`/reservations/${id}`);
}

export async function reservationsCreate(data: CreateReservationPayload): Promise<Reservation> {
  return apiPost<Reservation>('/reservations', data);
}

export async function reservationsUpdate(
  id: number,
  data: UpdateReservationPayload
): Promise<Reservation> {
  return apiPut<Reservation>(`/reservations/${id}`, data);
}

export async function reservationsUpdateStatus(
  id: number,
  data: UpdateReservationStatusPayload
): Promise<Reservation> {
  return apiPut<Reservation>(`/reservations/${id}/status`, data);
}

export async function reservationsDelete(id: number): Promise<void> {
  return apiDelete<void>(`/reservations/${id}`);
}

// --- Receipts ---

export async function receiptsGenerate(orderId: number): Promise<Receipt> {
  return apiPost<Receipt>(`/receipts${buildQuery({ orderId })}`);
}

export async function receiptsGetById(id: number): Promise<Receipt> {
  return apiGet<Receipt>(`/receipts/${id}`);
}

export async function receiptsGetByOrder(orderId: number): Promise<Receipt> {
  return apiGet<Receipt>(`/receipts/by-order${buildQuery({ orderId })}`);
}

// --- Settings ---

export async function getMapBackground(floor = 1): Promise<{ url: string | null }> {
  return apiGet<{ url: string | null }>('/settings/map-background', { floor });
}

export async function uploadMapBackground(file: File, floor = 1): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append('file', file);
  return apiPost<{ url: string }>(`/settings/map-background?floor=${floor}`, fd);
}

export async function deleteMapBackground(floor = 1): Promise<void> {
  return apiDelete<void>(`/settings/map-background?floor=${floor}`);
}

// --- SignalR ---

export const SIGNALR_HUB_URL = normalizeUrl(SIGNALR_URL) + '/hubs/orders';

// --- Cart store key ---

export const CART_STORAGE_KEY = 'restaurant_cart';

// Export helpers for reuse (used by tests + other features like users)
export { apiGet, apiPost, apiPut, apiPatch, apiDelete, buildQuery, getAuthHeader };
