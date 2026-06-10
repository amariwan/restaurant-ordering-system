'use client';

import { useMemo, useState, useEffect } from 'react';
import type { NavItem, NavGroup } from '@/types';
import { getRouteMeta } from '@/config/routes';
import { parseRole } from '@/features/restaurant/lib/auth-store';

/**
 * Hook to filter navigation items based on simple RBAC
 *
 * For actual security (API routes, server actions), always use server-side checks.
 * This is only for UI visibility.
 */
export function useFilteredNavItems(items: NavItem[]) {
  // Avoid reading client-only state (localStorage/token) during SSR or
  // the first client render to prevent hydration mismatches. We only
  // evaluate role-based visibility after hydration.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // If item has no url (anchor), keep it
      if (!item.url || item.url === '#') return true;

      // Check route meta (client-side visibility only)
      const meta = getRouteMeta(item.url);
      if (!meta) return true;

      // If route is public, always show
      if (meta.isPublic) return true;

      // If route requires specific roles, ensure current user has one
      if (meta.requiredRoles && meta.requiredRoles.length > 0) {
        // Before hydration we hide protected routes so server and first
        // client render remain identical. After hydration we can safely
        // read the token/localStorage and show role-specific items.
        if (!hydrated) return false;

        const role = parseRole();
        if (!role) return false;
        return meta.requiredRoles.some((r) => r.toLowerCase() === role.toLowerCase());
      }

      // default: show (visibility only, server enforces security)
      return true;
    });
  }, [items, hydrated]);

  return filteredItems;
}

/**
 * Hook to filter navigation groups based on simple RBAC
 */
export function useFilteredNavGroups(groups: NavGroup[]) {
  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const filteredItems = useFilteredNavItems(allItems);

  return useMemo(() => {
    const filteredSet = new Set(filteredItems.map((item) => item.title));
    return groups
      .map((group) => ({
        ...group,
        items: filteredItems.filter((item) =>
          group.items.some((gi) => gi.title === item.title && filteredSet.has(gi.title))
        )
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, filteredItems]);
}
