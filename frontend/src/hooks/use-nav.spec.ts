import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { NavItem } from '@/types';
import { useFilteredNavItems } from './use-nav';

vi.mock('@/config/routes', () => ({
  getRouteMeta: vi.fn((path: string) => {
    const routes: Record<string, any> = {
      '/admin/users': { requiredRoles: ['Admin'], isPublic: false },
      '/kitchen': { requiredRoles: ['Kitchen', 'Admin'], isPublic: false },
      '/cart': { requiredRoles: ['Waiter', 'Admin'], isPublic: false },
      '/about': { isPublic: true },
      '/admin': { requiresAuth: true, isPublic: false },
    };
    return routes[path];
  }),
}));

vi.mock('@/features/restaurant/lib/auth-store', () => ({
  parseRole: vi.fn(),
}));

import { parseRole } from '@/features/restaurant/lib/auth-store';

describe('useFilteredNavItems', () => {
  const baseItems: NavItem[] = [
    { title: 'Home', url: '/admin', icon: 'dashboard' as const, shortcut: ['d', 'd'] as [string, string], isActive: false, items: [] },
    { title: 'Users', url: '/admin/users', icon: 'user' as const, shortcut: ['u', 'u'] as [string, string], isActive: false, items: [] },
    { title: 'About', url: '/about', icon: 'info' as const, shortcut: ['a', 'a'] as [string, string], isActive: false, items: [] },
    { title: 'No URL', url: '#', icon: 'dots' as const, shortcut: ['n', 'n'] as [string, string], isActive: false, items: [] },
  ];

  it('shows public routes immediately', () => {
    (parseRole as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const { result } = renderHook(() => useFilteredNavItems(baseItems));

    const about = result.current.find(i => i.title === 'About');
    expect(about).toBeDefined();
  });

  it('filters out role-protected routes before hydration', () => {
    (parseRole as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const { result } = renderHook(() => useFilteredNavItems(baseItems));

    const users = result.current.find(i => i.title === 'Users');
    expect(users).toBeUndefined();
  });

  it('shows matching role routes after hydration', () => {
    (parseRole as ReturnType<typeof vi.fn>).mockReturnValue('admin');

    const { result, rerender } = renderHook(() => useFilteredNavItems(baseItems));

    const users = result.current.find(i => i.title === 'Users');
    expect(users).toBeDefined();
  });

  it('hides routes for non-matching roles', () => {
    (parseRole as ReturnType<typeof vi.fn>).mockReturnValue('waiter');

    const { result } = renderHook(() => useFilteredNavItems(baseItems));

    const users = result.current.find(i => i.title === 'Users');
    expect(users).toBeUndefined();
  });

  it('keeps items with no URL match', () => {
    (parseRole as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const items: NavItem[] = [{ title: 'Custom', url: '/custom-path', icon: 'exclusive' as const, shortcut: ['c', 'c'] as [string, string], isActive: false, items: [] }];
    const { result } = renderHook(() => useFilteredNavItems(items));

    expect(result.current).toHaveLength(1);
  });
});
