import { describe, it, expect } from 'vitest';
import { getRouteMeta, ROUTES } from './routes';

describe('routes config', () => {
  it('exports ROUTES array with expected entries', () => {
    expect(ROUTES.length).toBeGreaterThan(0);
    expect(ROUTES.some((r) => r.path === '/login')).toBe(true);
    expect(ROUTES.some((r) => r.path === '/orders')).toBe(true);
    expect(ROUTES.some((r) => r.path === '/')).toBe(true);
  });

  it('marks login as public', () => {
    const authRoute = ROUTES.find((r) => r.path === '/login');
    expect(authRoute?.isPublic).toBe(true);
    expect(authRoute?.layout).toBe('auth');
  });

  it('marks admin/users as admin-only', () => {
    const usersRoute = ROUTES.find((r) => r.path === '/admin/users');
    expect(usersRoute?.requiresAuth).toBe(true);
    expect(usersRoute?.requiredRoles).toContain('Admin');
  });

  it('marks cart as waiter/admin-only', () => {
    const cartRoute = ROUTES.find((r) => r.path === '/cart');
    expect(cartRoute?.requiredRoles).toContain('Waiter');
    expect(cartRoute?.requiredRoles).toContain('Admin');
  });

  it('marks kitchen as kitchen/admin-only', () => {
    const kitchenRoute = ROUTES.find((r) => r.path === '/kitchen');
    expect(kitchenRoute?.requiredRoles).toContain('Kitchen');
    expect(kitchenRoute?.requiredRoles).toContain('Admin');
  });

  it('marks admin/menu as admin-only', () => {
    const manageRoute = ROUTES.find((r) => r.path === '/admin/menu');
    expect(manageRoute?.requiredRoles).toContain('Admin');
  });
});

describe('getRouteMeta', () => {
  it('returns undefined for empty path', () => {
    expect(getRouteMeta('')).toBeUndefined();
  });

  it('matches /login route', () => {
    const meta = getRouteMeta('/login');
    expect(meta).toBeDefined();
    expect(meta!.isPublic).toBe(true);
  });

  it('matches orders route', () => {
    const meta = getRouteMeta('/orders');
    expect(meta).toBeDefined();
    expect(meta!.requiresAuth).toBe(true);
  });

  it('matches orders nested route', () => {
    const meta = getRouteMeta('/orders/123');
    expect(meta).toBeDefined();
    expect(meta!.path).toBe('/orders');
  });

  it('matches admin-only route', () => {
    const meta = getRouteMeta('/admin/users');
    expect(meta).toBeDefined();
    expect(meta!.requiredRoles).toContain('Admin');
  });

  it('matches root path', () => {
    const meta = getRouteMeta('/');
    expect(meta).toBeDefined();
    expect(meta!.path).toBe('/');
  });

  it('adds leading slash if missing', () => {
    const meta = getRouteMeta('admin/users');
    expect(meta).toBeDefined();
    expect(meta!.requiredRoles).toContain('Admin');
  });

  it('prefers longest prefix match', () => {
    const meta = getRouteMeta('/admin/menu');
    expect(meta!.path).toBe('/admin/menu');
  });
});
