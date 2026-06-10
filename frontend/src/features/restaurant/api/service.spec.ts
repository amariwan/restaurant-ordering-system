import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('@/features/restaurant/lib/auth-store', () => ({
  getToken: vi.fn(),
}));

import * as service from './service';

const API_BASE = 'http://127.0.0.1:5000/api';

function mockResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    headers: new Headers(),
  } as Response);
}

function mockError(status: number, message: string) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ message }),
  } as Response);
}

describe('service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('auth', () => {
    it('authLogin posts credentials and returns token', async () => {
      const resp = { token: 'abc', user: { id: 1, name: 'Test', email: 't@t.com', role: 'Waiter' } };
      mockFetch.mockResolvedValue(mockResponse(resp));

      const result = await service.authLogin({ email: 't@t.com', password: 'pass' });

      expect(result).toEqual(resp);
      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/auth/login`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 't@t.com', password: 'pass' }),
        })
      );
    });

    it('authRegister posts and returns auth response', async () => {
      const resp = { token: 'xyz', user: { id: 2, name: 'New', email: 'n@t.com', role: 'Waiter' } };
      mockFetch.mockResolvedValue(mockResponse(resp));

      const result = await service.authRegister({ name: 'New', email: 'n@t.com', password: 'pass' });

      expect(result).toEqual(resp);
    });

    it('authMe returns current user', async () => {
      const user = { id: 1, name: 'Test', email: 't@t.com', role: 'Admin' };
      mockFetch.mockResolvedValue(mockResponse(user));

      const result = await service.authMe();
      expect(result).toEqual(user);
    });
  });

  describe('menu', () => {
    it('menuGetCategories returns categories', async () => {
      const cats = [{ id: 1, name: 'Appetizers' }];
      mockFetch.mockResolvedValue(mockResponse(cats));

      const result = await service.menuGetCategories();
      expect(result).toEqual(cats);
      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/menu/categories`,
        expect.any(Object)
      );
    });

    it('menuGetItems returns paginated response', async () => {
      const resp = { items: [{ id: 1, name: 'Pizza', price: 10, categoryId: 1, categoryName: 'Mains', available: true }], totalCount: 1, page: 1, pageSize: 20, totalPages: 1 };
      mockFetch.mockResolvedValue(mockResponse(resp));

      const result = await service.menuGetItems({ categoryId: 1, available: true });
      expect(result).toEqual(resp);
    });

    it('menuGetItems works without filters', async () => {
      const resp = { items: [{ id: 1, name: 'Pizza', price: 10, categoryId: 1, categoryName: 'Mains', available: true }], totalCount: 1, page: 1, pageSize: 20, totalPages: 1 };
      mockFetch.mockResolvedValue(mockResponse(resp));

      const result = await service.menuGetItems();
      expect(result).toEqual(resp);
    });

    it('menuUploadImage sends FormData', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const resp = { url: 'http://example.com/img.png' };
      mockFetch.mockResolvedValue(mockResponse(resp));

      const result = await service.menuUploadImage(file);
      expect(result).toEqual(resp);
      const call = mockFetch.mock.calls[0];
      expect(call[1].body).toBeInstanceOf(FormData);
      expect(call[1].method).toBe('POST');
    });
  });

  describe('tables', () => {
    it('tablesGetAll returns tables', async () => {
      const tables = [{ id: 1, number: 1, status: 'free' }];
      mockFetch.mockResolvedValue(mockResponse(tables));

      const result = await service.tablesGetAll();
      expect(result).toEqual(tables);
    });
  });

  describe('orders', () => {
    it('ordersGetAll returns paginated response', async () => {
      const resp = { items: [{ id: 1, tableId: 1, tableNumber: 1, userId: 1, status: 'pending', items: [], createdAt: '2024-01-01T00:00:00Z' }], totalCount: 1, page: 1, pageSize: 20, totalPages: 1 };
      mockFetch.mockResolvedValue(mockResponse(resp));

      const result = await service.ordersGetAll({ status: 'pending', tableId: 1 });
      expect(result).toEqual(resp);
    });

    it('ordersGetAll works without filters', async () => {
      const resp = { items: [{ id: 1, tableId: 1, tableNumber: 1, userId: 1, status: 'pending', items: [], createdAt: '2024-01-01T00:00:00Z' }], totalCount: 1, page: 1, pageSize: 20, totalPages: 1 };
      mockFetch.mockResolvedValue(mockResponse(resp));

      const result = await service.ordersGetAll();
      expect(result).toEqual(resp);
    });

    it('ordersCreate posts and returns order', async () => {
      const payload = { tableId: 1, items: [{ menuItemId: 1, quantity: 2 }] };
      const order = { id: 1, tableId: 1, tableNumber: 1, userId: 1, status: 'pending', items: [{ id: 1, menuItemId: 1, menuItemName: 'Pizza', price: 10, quantity: 2 }], createdAt: '2024-01-01T00:00:00Z' };
      mockFetch.mockResolvedValue(mockResponse(order));

      const result = await service.ordersCreate(payload);
      expect(result).toEqual(order);
    });
  });

  describe('payments', () => {
    it('paymentsCreate creates payment', async () => {
      const payment = { id: 1, orderId: 1, amount: 50, method: 'cash', paidAt: '2024-01-01T00:00:00Z' };
      mockFetch.mockResolvedValue(mockResponse(payment));

      const result = await service.paymentsCreate(1, { amount: 50, method: 'cash' });
      expect(result).toEqual(payment);
    });

    it('paymentsGetByOrder returns payments', async () => {
      const payments = [{ id: 1, orderId: 1, amount: 50, method: 'cash', paidAt: '2024-01-01T00:00:00Z' }];
      mockFetch.mockResolvedValue(mockResponse(payments));

      const result = await service.paymentsGetByOrder(1);
      expect(result).toEqual(payments);
    });
  });

  describe('users', () => {
    it('usersGetAll returns paginated response', async () => {
      const resp = { items: [{ id: 1, name: 'Admin', email: 'a@a.com', role: 'Admin' }], totalCount: 1, page: 1, pageSize: 20, totalPages: 1 };
      mockFetch.mockResolvedValue(mockResponse(resp));

      const result = await service.usersGetAll();
      expect(result).toEqual(resp);
    });
  });

  describe('error handling', () => {
    it('throws on non-ok response with message', async () => {
      mockFetch.mockResolvedValue(mockError(401, 'Unauthorized'));

      await expect(service.authMe()).rejects.toThrow('Unauthorized');
    });

    it('throws generic error when no message in body', async () => {
      mockFetch.mockResolvedValue(Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('parse fail')),
      } as unknown as Response));

      await expect(service.authMe()).rejects.toThrow('Unknown error');
    });

    it('handles 204 no content', async () => {
      mockFetch.mockResolvedValue(Promise.resolve({
        ok: true,
        status: 204,
        json: () => { throw new Error('no body'); },
      } as unknown as Response));

      const result = await service.authLogout();
      expect(result).toBeUndefined();
    });
  });

  describe('buildQuery', () => {
    it('builds query string from params', () => {
      const qs = service.buildQuery({ a: 1, b: 'hello' });
      expect(qs).toContain('a=1');
      expect(qs).toContain('b=hello');
      expect(qs.startsWith('?')).toBe(true);
    });

    it('skips undefined and null values', () => {
      const qs = service.buildQuery({ a: 1, b: undefined, c: null });
      expect(qs).toContain('a=1');
      expect(qs).not.toContain('b=');
      expect(qs).not.toContain('c=');
    });

    it('returns empty string for no params', () => {
      expect(service.buildQuery()).toBe('');
    });
  });

  describe('SIGNALR_HUB_URL', () => {
    it('returns normalized signalr hub url', () => {
      expect(service.SIGNALR_HUB_URL).toContain('/hubs/orders');
      expect(service.SIGNALR_HUB_URL).not.toContain('localhost');
    });
  });

  describe('CART_STORAGE_KEY', () => {
    it('returns correct key', () => {
      expect(service.CART_STORAGE_KEY).toBe('restaurant_cart');
    });
  });
});
