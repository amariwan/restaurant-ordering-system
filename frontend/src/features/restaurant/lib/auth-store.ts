import { create } from 'zustand';
import type { User } from '@/features/restaurant/api/types';

interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  user: null,

  setToken: (token) => {
    if (typeof window === 'undefined') return;
    if (token) {
      localStorage.setItem('restaurant_token', token);
    } else {
      localStorage.removeItem('restaurant_token');
    }
    set({ token });
  },

  setUser: (user) => {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem('restaurant_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('restaurant_user');
    }
    set({ user });
  },

  clearAuth: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('restaurant_token');
    localStorage.removeItem('restaurant_user');
    set({ token: null, user: null });
  }
}));

export function setToken(token: string | null) {
  useAuthStore.getState().setToken(token);
}

export function setUser(user: User | null) {
  useAuthStore.getState().setUser(user);
}

export function clearAuth() {
  useAuthStore.getState().clearAuth();
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('restaurant_token');
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('restaurant_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function parseRole(): string | null {
  const user = getUser();
  if (user) return user.role;
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? null;
  } catch {
    return null;
  }
}
