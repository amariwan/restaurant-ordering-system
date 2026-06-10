export type Role = 'Admin' | 'Waiter' | 'Kitchen' | string;

export interface RouteMeta {
  path: string; // prefix match
  isPublic?: boolean;
  requiresAuth?: boolean;
  requiredRoles?: Role[];
  layout?: 'dashboard' | 'auth' | 'public' | 'none';
}

// Central route metadata. Use prefix matching (longest match wins).
export const ROUTES: RouteMeta[] = [
  { path: '/login', isPublic: true, layout: 'auth' },

  // Public pages
  { path: '/about', isPublic: true, layout: 'public' },
  { path: '/privacy-policy', isPublic: true, layout: 'public' },
  { path: '/reserve', isPublic: true, layout: 'public' },

  // Dashboard area (requires authentication)
  {
    path: '/dashboard',
    requiresAuth: true,
    requiredRoles: ['Admin', 'Waiter', 'Kitchen'],
    layout: 'dashboard'
  },
  { path: '/admin/users', requiresAuth: true, requiredRoles: ['Admin'], layout: 'dashboard' },
  { path: '/admin/tables', requiresAuth: true, requiredRoles: ['Admin'], layout: 'dashboard' },
  { path: '/admin/menu', requiresAuth: true, requiredRoles: ['Admin'], layout: 'dashboard' },
  { path: '/admin', requiresAuth: true, requiredRoles: ['Admin'], layout: 'dashboard' },
  {
    path: '/kitchen',
    requiresAuth: true,
    requiredRoles: ['Kitchen', 'Admin'],
    layout: 'dashboard'
  },
  { path: '/cart', isPublic: true, layout: 'public' },
  {
    path: '/orders',
    requiresAuth: true,
    requiredRoles: ['Kitchen', 'Waiter', 'Admin'],
    layout: 'dashboard'
  },
  {
    path: '/reservations',
    requiresAuth: true,
    requiredRoles: ['Admin', 'Waiter'],
    layout: 'dashboard'
  },
  { path: '/menu', isPublic: true, layout: 'public' },
  { path: '/order', isPublic: true, layout: 'none' },
  { path: '/profile', requiresAuth: true, layout: 'dashboard' },

  // Root (public landing page — unauthenticated users can see CTA)
  { path: '/', isPublic: true, layout: 'public' }
];

/**
 * Find the best matching route meta for a pathname.
 * Uses longest-prefix match so more specific routes win.
 */
export function getRouteMeta(pathname: string) {
  if (!pathname) return undefined;
  // ensure leading slash
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  // sort by longest path first
  const sorted = [...ROUTES].toSorted((a, b) => b.path.length - a.path.length);
  return sorted.find(
    (r) => path === r.path || path.startsWith(r.path + '/') || path.startsWith(r.path)
  );
}

export default ROUTES;
