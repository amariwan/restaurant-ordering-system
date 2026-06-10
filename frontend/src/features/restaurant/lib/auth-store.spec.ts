import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockStorage = {
  _store: {} as Record<string, string>,
  getItem(key: string) { return this._store[key] ?? null; },
  setItem(key: string, value: string) { this._store[key] = value; },
  removeItem(key: string) { delete this._store[key]; },
  clear() { this._store = {}; },
};

(globalThis as any).window = { localStorage: mockStorage };
(globalThis as any).localStorage = mockStorage;

import {
  useAuthStore,
  setToken,
  setUser,
  clearAuth,
  getToken,
  getUser,
  parseRole,
} from './auth-store';
import type { User } from '@/features/restaurant/api/types';

const mockUser: User = {
  id: 1,
  name: 'Test Waiter',
  email: 'waiter@test.com',
  role: 'Waiter',
};

describe('auth-store', () => {
  beforeEach(() => {
    mockStorage.clear();
    useAuthStore.setState({ token: null, user: null });
  });

  describe('setToken', () => {
    it('stores token in localStorage and state', () => {
      setToken('test-token');

      expect(useAuthStore.getState().token).toBe('test-token');
      expect(getToken()).toBe('test-token');
    });

    it('with null removes from localStorage', () => {
      setToken('existing');
      setToken(null);

      expect(useAuthStore.getState().token).toBeNull();
      expect(getToken()).toBeNull();
    });
  });

  describe('setUser', () => {
    it('stores user JSON in localStorage and state', () => {
      setUser(mockUser);

      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(getUser()).toEqual(mockUser);
    });

    it('with null removes from localStorage', () => {
      setUser(mockUser);
      setUser(null);

      expect(useAuthStore.getState().user).toBeNull();
      expect(getUser()).toBeNull();
    });
  });

  describe('clearAuth', () => {
    it('clears both token and user', () => {
      setToken('test-token');
      setUser(mockUser);

      clearAuth();

      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
      expect(getToken()).toBeNull();
      expect(getUser()).toBeNull();
    });
  });

  describe('getToken', () => {
    it('reads from localStorage', () => {
      mockStorage.setItem('restaurant_token', 'stored-token');

      expect(getToken()).toBe('stored-token');
    });

    it('returns null when not set', () => {
      expect(getToken()).toBeNull();
    });
  });

  describe('getUser', () => {
    it('parses JSON from localStorage', () => {
      mockStorage.setItem('restaurant_user', JSON.stringify(mockUser));

      expect(getUser()).toEqual(mockUser);
    });

    it('returns null on invalid JSON', () => {
      mockStorage.setItem('restaurant_user', '{invalid}');

      expect(getUser()).toBeNull();
    });

    it('returns null when not set', () => {
      expect(getUser()).toBeNull();
    });
  });

  describe('parseRole', () => {
    it('reads from user object when user is set', () => {
      setUser(mockUser);
      setToken('ignored');

      expect(parseRole()).toBe('Waiter');
    });

    it('reads from JWT token when no user', () => {
      const header = btoa('{"alg":"HS256"}');
      const payload = btoa('{"http://schemas.microsoft.com/ws/2008/06/identity/claims/role":"Admin"}');
      const token = `${header}.${payload}.signature`;
      mockStorage.setItem('restaurant_token', token);

      expect(parseRole()).toBe('Admin');
    });

    it('returns null when no auth data', () => {
      expect(parseRole()).toBeNull();
    });

    it('returns null for invalid token format', () => {
      mockStorage.setItem('restaurant_token', 'invalid-token');

      expect(parseRole()).toBeNull();
    });
  });
});
